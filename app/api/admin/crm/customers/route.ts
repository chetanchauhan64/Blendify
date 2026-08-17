// ============================================================
// BLENDIFY — CRM Customers List API
// GET /api/admin/crm/customers
//
// Query params:
//   search   : search on name, email, phone, id
//   segment  : all|new|active|inactive|high_value|repeat|one_time|no_purchase|loyalty|referral
//   status   : all|active|suspended
//   sortBy   : createdAt|totalSpent|orderCount|lastOrderDate|name (default: createdAt)
//   order    : asc|desc (default: desc)
//   page     : number (default: 1)
//   limit    : number (default: 25, max: 100)
//
// Returns paginated customer records with lifetime order aggregates.
// Passwords, hashes, and authentication secrets are NEVER included.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, serverError, badRequest } from '@/lib/utils/api';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const QuerySchema = z.object({
  search: z.string().optional(),
  segment: z.enum(['all', 'new', 'active', 'inactive', 'high_value', 'repeat', 'one_time', 'no_purchase', 'loyalty', 'referral']).default('all'),
  status: z.enum(['all', 'active', 'suspended']).default('all'),
  sortBy: z.enum(['createdAt', 'totalSpent', 'orderCount', 'lastOrderDate', 'name']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }

    const { search, segment, status, sortBy, order, page, limit } = parseResult.data;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);

    // Build Prisma where
    const where: Prisma.UserWhereInput = {
      role: 'CUSTOMER',
    };

    if (status === 'active') where.isActive = true;
    if (status === 'suspended') where.isActive = false;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply segment filter
    if (segment === 'new') {
      where.createdAt = { gte: thirtyDaysAgo };
    } else if (segment === 'active') {
      where.orders = { some: { createdAt: { gte: sixtyDaysAgo }, status: { in: REVENUE_STATUSES as never[] } } };
    } else if (segment === 'inactive') {
      where.orders = { none: { createdAt: { gte: ninetyDaysAgo }, status: { in: REVENUE_STATUSES as never[] } } };
    } else if (segment === 'no_purchase') {
      where.orders = { none: { status: { in: REVENUE_STATUSES as never[] } } };
    } else if (segment === 'loyalty') {
      where.OR = [
        { loyaltyPoints: { gt: 0 } },
        { loyaltyTier: { in: ['SILVER', 'GOLD', 'PLATINUM'] } },
      ];
    } else if (segment === 'referral') {
      where.referrals = { some: {} };
    }

    // Fetch users with aggregated data
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          isActive: true,
          loyaltyPoints: true,
          loyaltyTier: true,
          referralCode: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              referrals: true,
            },
          },
          orders: {
            where: { status: { in: REVENUE_STATUSES as never[] } },
            select: {
              id: true,
              total: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: sortBy === 'name'
          ? [{ firstName: order }, { lastName: order }]
          : sortBy === 'createdAt'
          ? { createdAt: order }
          : { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Map and enrich customer objects
    let data = users.map((u) => {
      const orderCount = u.orders.length;
      const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.total), 0);
      const aov = orderCount > 0 ? totalSpent / orderCount : 0;
      const lastOrderDate = u.orders[0]?.createdAt.toISOString() ?? null;

      // Lifecycle status
      let lifecycle = 'New';
      if (orderCount === 0) lifecycle = 'Prospect';
      else if (orderCount >= 2 && lastOrderDate && new Date(lastOrderDate) >= sixtyDaysAgo) lifecycle = 'Repeat Active';
      else if (orderCount >= 1 && lastOrderDate && new Date(lastOrderDate) >= sixtyDaysAgo) lifecycle = 'Active';
      else if (lastOrderDate && new Date(lastOrderDate) < ninetyDaysAgo) lifecycle = 'At Risk / Inactive';

      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        isActive: u.isActive,
        loyaltyPoints: u.loyaltyPoints,
        loyaltyTier: u.loyaltyTier,
        referralCode: u.referralCode,
        referralsCount: u._count.referrals,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        orderCount,
        totalSpent,
        aov,
        lastOrderDate,
        lifecycle,
      };
    });

    // In-memory sort for derived columns if requested
    if (sortBy === 'totalSpent') {
      data.sort((a, b) => order === 'asc' ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent);
    } else if (sortBy === 'orderCount') {
      data.sort((a, b) => order === 'asc' ? a.orderCount - b.orderCount : b.orderCount - a.orderCount);
    } else if (sortBy === 'lastOrderDate') {
      data.sort((a, b) => {
        const da = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
        const db = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
        return order === 'asc' ? da - db : db - da;
      });
    }

    // Filter segments that depend on aggregations if needed
    if (segment === 'high_value') {
      data = data.filter(d => d.totalSpent >= 10000);
    } else if (segment === 'repeat') {
      data = data.filter(d => d.orderCount >= 2);
    } else if (segment === 'one_time') {
      data = data.filter(d => d.orderCount === 1);
    }

    const totalPages = Math.ceil(total / limit);

    return ok({
      customers: data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error('[CRM Customers List] Error:', err);
    return serverError('Failed to fetch CRM customers');
  }
}
