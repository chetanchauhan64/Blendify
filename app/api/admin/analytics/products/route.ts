// ============================================================
// BLENDIFY — Analytics Products API
// GET /api/admin/analytics/products
//
// Query params:
//   dateFrom   : ISO date string
//   dateTo     : ISO date string
//   period     : same as overview
//   categoryId : filter by category
//   sortBy     : revenue|units|rating (default: revenue)
//   order      : asc|desc (default: desc)
//   page       : number (default: 1)
//   limit      : number (default: 20, max: 100)
//
// Only includes paid/completed orders.
// Cancelled/fully-refunded orders are excluded.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, serverError, badRequest } from '@/lib/utils/api';
import { z } from 'zod';

const REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const QuerySchema = z.object({
  period: z.enum(['today', 'yesterday', 'last7', 'last30', 'last90', 'thisMonth', 'prevMonth', 'thisYear', 'custom']).default('last30'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categoryId: z.string().optional(),
  sortBy: z.enum(['revenue', 'units', 'rating']).default('revenue'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function getPeriodDates(period: string, dateFrom?: string, dateTo?: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  switch (period) {
    case 'today': return { from: today, to: tomorrow };
    case 'yesterday': return { from: new Date(today.getTime() - 86400000), to: today };
    case 'last7': return { from: new Date(today.getTime() - 6 * 86400000), to: tomorrow };
    case 'last90': return { from: new Date(today.getTime() - 89 * 86400000), to: tomorrow };
    case 'thisMonth': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    case 'prevMonth': return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) };
    case 'thisYear': return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear() + 1, 0, 1) };
    case 'custom': {
      if (!dateFrom || !dateTo) return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow };
      return { from: new Date(dateFrom), to: new Date(new Date(dateTo).getTime() + 86400000) };
    }
    default: return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow };
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }
    const { period, dateFrom, dateTo, categoryId, sortBy, order, page, limit } = parseResult.data;
    const { from, to } = getPeriodDates(period, dateFrom, dateTo);

    // Aggregate order items for eligible orders within date range
    const grouped = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalPrice: true },
      _count: { id: true },
      where: {
        order: {
          createdAt: { gte: from, lt: to },
          status: { in: REVENUE_STATUSES as never[] },
        },
      },
    });

    if (grouped.length === 0) {
      return ok({ products: [], total: 0, page, limit, totalPages: 0 });
    }

    // Fetch product details + category filter
    const productIds = grouped.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        ...(categoryId ? { categoryId } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
        reviews: {
          select: { rating: true },
          where: { status: 'APPROVED' },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Merge aggregated data with product info
    const merged = grouped
      .filter((g) => productMap.has(g.productId))
      .map((g) => {
        const prod = productMap.get(g.productId)!;
        const ratings = prod.reviews.map((r) => r.rating);
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        return {
          productId: g.productId,
          name: prod.name,
          slug: prod.slug,
          categoryId: prod.categoryId,
          categoryName: prod.category?.name ?? null,
          imageUrl: prod.images[0]?.url ?? null,
          units: Number(g._sum?.quantity ?? 0),
          revenue: Number(g._sum?.totalPrice ?? 0),
          orderCount: g._count.id,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: ratings.length,
        };
      });

    // Sort
    merged.sort((a, b) => {
      let diff = 0;
      if (sortBy === 'units') diff = a.units - b.units;
      else if (sortBy === 'rating') diff = a.avgRating - b.avgRating;
      else diff = a.revenue - b.revenue;
      return order === 'asc' ? diff : -diff;
    });

    const total = merged.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = merged.slice(offset, offset + limit);

    return ok({
      products: paginated,
      total,
      page,
      limit,
      totalPages,
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
    });
  } catch (err) {
    console.error('[Analytics Products] Error:', err);
    return serverError('Failed to fetch product analytics');
  }
}
