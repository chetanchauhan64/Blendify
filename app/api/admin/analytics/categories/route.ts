// ============================================================
// BLENDIFY — Analytics Categories API
// GET /api/admin/analytics/categories
//
// Query params:
//   dateFrom : ISO date string
//   dateTo   : ISO date string
//   period   : same as overview
//   page     : number (default: 1)
//   limit    : number (default: 20, max: 100)
//
// Joins OrderItem → Product → Category
// Calculates revenue, units, order count per category
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
    const { period, dateFrom, dateTo, page, limit } = parseResult.data;
    const { from, to } = getPeriodDates(period, dateFrom, dateTo);

    // Step 1: Group eligible order items by productId
    const itemsByProduct = await prisma.orderItem.groupBy({
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

    if (itemsByProduct.length === 0) {
      return ok({ categories: [], total: 0, page, limit, totalPages: 0 });
    }

    // Step 2: Fetch categoryId for each productId in a single query
    const productIds = itemsByProduct.map((g) => g.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true },
    });
    const productCategoryMap = new Map(products.map((p) => [p.id, p.categoryId]));

    // Step 3: Aggregate by category
    const categoryMap = new Map<string, { units: number; revenue: number; orderCount: number }>();
    const uncategorizedKey = '__uncategorized__';

    for (const item of itemsByProduct) {
      const catId = productCategoryMap.get(item.productId) ?? uncategorizedKey;
      const existing = categoryMap.get(catId) ?? { units: 0, revenue: 0, orderCount: 0 };
      categoryMap.set(catId, {
        units: existing.units + Number(item._sum?.quantity ?? 0),
        revenue: existing.revenue + Number(item._sum?.totalPrice ?? 0),
        orderCount: existing.orderCount + item._count.id,
      });
    }

    // Step 4: Fetch category names
    const categoryIds = Array.from(categoryMap.keys()).filter((id) => id !== uncategorizedKey);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, slug: true },
    });
    const catNameMap = new Map(categories.map((c) => [c.id, c]));

    // Step 5: Build final result
    const totalRevenue = Array.from(categoryMap.values()).reduce((s, c) => s + c.revenue, 0);
    const result = Array.from(categoryMap.entries()).map(([catId, stats]) => {
      const cat = catNameMap.get(catId);
      return {
        categoryId: catId === uncategorizedKey ? null : catId,
        name: cat?.name ?? (catId === uncategorizedKey ? 'Uncategorized' : 'Unknown'),
        slug: cat?.slug ?? null,
        units: stats.units,
        revenue: stats.revenue,
        orderCount: stats.orderCount,
        revenueShare: totalRevenue > 0 ? (stats.revenue / totalRevenue) * 100 : 0,
      };
    });

    // Sort by revenue descending
    result.sort((a, b) => b.revenue - a.revenue);

    const total = result.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = result.slice(offset, offset + limit);

    return ok({
      categories: paginated,
      total,
      page,
      limit,
      totalPages,
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
    });
  } catch (err) {
    console.error('[Analytics Categories] Error:', err);
    return serverError('Failed to fetch category analytics');
  }
}
