// ============================================================
// BLENDIFY — Analytics Customers API
// GET /api/admin/analytics/customers
//
// Query params:
//   dateFrom : ISO date string
//   dateTo   : ISO date string
//   period   : same as overview
//   groupBy  : day|week|month
//
// Definitions:
//   New Customer: First registration in period
//   Returning Customer: Had eligible order before period, ordered in period
//   Repeat Purchase Rate: returning / total ordering customers × 100
//   CLV: Total historical spend from eligible orders
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
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
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
    const { period, dateFrom, dateTo, groupBy } = parseResult.data;
    const { from, to } = getPeriodDates(period, dateFrom, dateTo);

    // Customer registration time series
    const truncUnit = groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';
    const registrationSeries = await prisma.$queryRaw<Array<{ bucket: Date; count: bigint }>>`
      SELECT
        DATE_TRUNC(${truncUnit}, "createdAt") AS bucket,
        COUNT(*) AS count
      FROM users
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
        AND role = 'CUSTOMER'
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    // Customers who placed eligible orders in period
    const ordersInPeriod = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: REVENUE_STATUSES as never[] },
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const uniqueOrderingUserIds = ordersInPeriod.map((o) => o.userId as string);

    // Returning: had prior eligible order
    let returningCustomers = 0;
    if (uniqueOrderingUserIds.length > 0) {
      const priorOrderUsers = await prisma.order.findMany({
        where: {
          createdAt: { lt: from },
          status: { in: REVENUE_STATUSES as never[] },
          userId: { in: uniqueOrderingUserIds },
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      returningCustomers = priorOrderUsers.length;
    }

    const totalOrdering = uniqueOrderingUserIds.length;
    const repeatPurchaseRate = totalOrdering > 0 ? (returningCustomers / totalOrdering) * 100 : 0;

    // Top 10 customers by spend (CLV in period)
    const topCustomersRaw = await prisma.order.groupBy({
      by: ['userId'],
      _sum: { total: true },
      _count: { id: true },
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: REVENUE_STATUSES as never[] },
        userId: { not: null },
      },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    });

    const topUserIds = topCustomersRaw.map((r) => r.userId as string).filter(Boolean);
    const topUsers = topUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: topUserIds } },
          select: { id: true, firstName: true, lastName: true, email: true, loyaltyTier: true, createdAt: true },
        })
      : [];
    const userMap = new Map(topUsers.map((u) => [u.id, u]));

    const topCustomers = topCustomersRaw
      .filter((r) => r.userId && userMap.has(r.userId as string))
      .map((r) => {
        const user = userMap.get(r.userId as string)!;
        return {
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          loyaltyTier: user.loyaltyTier,
          memberSince: user.createdAt.toISOString(),
          periodRevenue: Number(r._sum?.total ?? 0),
          periodOrders: r._count.id,
        };
      });

    // Overall CLV metrics: average lifetime spend per customer with at least 1 order
    const lifetimeSpend = await prisma.order.groupBy({
      by: ['userId'],
      _sum: { total: true },
      where: {
        status: { in: REVENUE_STATUSES as never[] },
        userId: { not: null },
      },
    });
    const clvValues = lifetimeSpend.map((r) => Number(r._sum?.total ?? 0));
    const avgClv = clvValues.length > 0 ? clvValues.reduce((a, b) => a + b, 0) / clvValues.length : 0;

    return ok({
      period: { dateFrom: from.toISOString(), dateTo: to.toISOString(), groupBy },
      summary: {
        newRegistrations: registrationSeries.reduce((s, r) => s + Number(r.count), 0),
        activeCustomers: totalOrdering,
        returningCustomers,
        repeatPurchaseRate,
        avgClv,
      },
      registrationTimeSeries: registrationSeries.map((r) => ({
        date: r.bucket.toISOString(),
        customers: Number(r.count),
      })),
      topCustomers,
    });
  } catch (err) {
    console.error('[Analytics Customers] Error:', err);
    return serverError('Failed to fetch customer analytics');
  }
}
