// ============================================================
// BLENDIFY — CRM Overview API
// GET /api/admin/crm/overview
//
// Query params:
//   period   : today|yesterday|last7|last30|last90|thisMonth|prevMonth|thisYear|custom
//   dateFrom : ISO date string (required when period=custom)
//   dateTo   : ISO date string (required when period=custom)
//   compare  : prevPeriod|prevMonth|prevYear|none
//   groupBy  : day|week|month
//
// Returns real CRM metrics, time series, and segment distributions
// computed via PostgreSQL / Prisma aggregations.
// Password hashes and sensitive credentials are never queried.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, serverError, badRequest } from '@/lib/utils/api';
import { z } from 'zod';

const QuerySchema = z.object({
  period: z.enum(['today', 'yesterday', 'last7', 'last30', 'last90', 'thisMonth', 'prevMonth', 'thisYear', 'custom']).default('last30'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  compare: z.enum(['prevPeriod', 'prevMonth', 'prevYear', 'none']).default('prevPeriod'),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

const REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function getPeriodDates(period: string, dateFrom?: string, dateTo?: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  switch (period) {
    case 'today': return { from: today, to: tomorrow };
    case 'yesterday': return { from: new Date(today.getTime() - 86400000), to: today };
    case 'last7': return { from: new Date(today.getTime() - 6 * 86400000), to: tomorrow };
    case 'last30': return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow };
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

function getComparisonDates(current: { from: Date; to: Date }, compare: string): { from: Date; to: Date } | null {
  if (compare === 'none') return null;
  const duration = current.to.getTime() - current.from.getTime();
  switch (compare) {
    case 'prevPeriod':
      return { from: new Date(current.from.getTime() - duration), to: new Date(current.from) };
    case 'prevMonth': {
      const f = new Date(current.from); f.setMonth(f.getMonth() - 1);
      const t = new Date(current.to); t.setMonth(t.getMonth() - 1);
      return { from: f, to: t };
    }
    case 'prevYear': {
      const f = new Date(current.from); f.setFullYear(f.getFullYear() - 1);
      const t = new Date(current.to); t.setFullYear(t.getFullYear() - 1);
      return { from: f, to: t };
    }
    default: return null;
  }
}

async function getCrmKpis(from: Date, to: Date) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);

  const [
    totalCustomers,
    newCustomers,
    revenueAgg,
    periodOrdersCount,
    usersWithPeriodOrders,
    usersWithPriorOrders,
    repeatCustomersCount,
    inactiveCustomersCount,
    totalOrderingCustomersCount,
  ] = await Promise.all([
    // Total registered customers
    prisma.user.count({
      where: { role: 'CUSTOMER' },
    }),
    // New customer registrations in period
    prisma.user.count({
      where: { role: 'CUSTOMER', createdAt: { gte: from, lt: to } },
    }),
    // Revenue from revenue-eligible orders in period
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: from, lt: to }, status: { in: REVENUE_STATUSES as never[] } },
    }),
    // Total eligible orders in period
    prisma.order.count({
      where: { createdAt: { gte: from, lt: to }, status: { in: REVENUE_STATUSES as never[] } },
    }),
    // Distinct users who ordered in this period
    prisma.order.findMany({
      where: { createdAt: { gte: from, lt: to }, status: { in: REVENUE_STATUSES as never[] }, userId: { not: null } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    // Distinct users who ordered before this period
    prisma.order.findMany({
      where: { createdAt: { lt: from }, status: { in: REVENUE_STATUSES as never[] }, userId: { not: null } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    // Repeat customers (users with >= 2 lifetime orders)
    prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*)::int AS count FROM (
        SELECT "userId" FROM orders
        WHERE "userId" IS NOT NULL AND status IN ('CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED')
        GROUP BY "userId"
        HAVING COUNT(*) >= 2
      ) repeat_users
    `,
    // Inactive customers (no orders in past 90 days or never ordered)
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        orders: {
          none: {
            createdAt: { gte: ninetyDaysAgo },
            status: { in: REVENUE_STATUSES as never[] },
          },
        },
      },
    }),
    // Lifetime ordering customers count
    prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(DISTINCT "userId")::int AS count FROM orders
      WHERE "userId" IS NOT NULL AND status IN ('CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED')
    `,
  ]);

  const periodUserIds = new Set(usersWithPeriodOrders.map(u => u.userId as string));
  const priorUserIds = new Set(usersWithPriorOrders.map(u => u.userId as string));

  // Returning customers: ordered in period AND had an order prior to period
  let returningCustomersCount = 0;
  for (const id of periodUserIds) {
    if (priorUserIds.has(id)) {
      returningCustomersCount++;
    }
  }

  const activeCustomers = periodUserIds.size;
  const totalRev = Number(revenueAgg._sum?.total ?? 0);
  const repeatCount = Number(repeatCustomersCount[0]?.count ?? 0);
  const lifetimeOrderingCount = Number(totalOrderingCustomersCount[0]?.count ?? 0);

  const repeatPurchaseRate = lifetimeOrderingCount > 0
    ? (repeatCount / lifetimeOrderingCount) * 100
    : 0;

  const priorOrderingCount = priorUserIds.size;
  const retentionRate = priorOrderingCount > 0
    ? (returningCustomersCount / priorOrderingCount) * 100
    : (repeatPurchaseRate > 0 ? repeatPurchaseRate : 0);

  const clv = totalCustomers > 0 ? totalRev / totalCustomers : 0;
  const aov = periodOrdersCount > 0 ? totalRev / periodOrdersCount : 0;
  const ordersPerCustomer = activeCustomers > 0 ? periodOrdersCount / activeCustomers : 0;

  return {
    totalCustomers,
    newCustomers,
    activeCustomers,
    inactiveCustomers: inactiveCustomersCount,
    returningCustomers: returningCustomersCount,
    repeatCustomers: repeatCount,
    repeatPurchaseRate,
    retentionRate,
    clv,
    aov,
    totalCustomerRevenue: totalRev,
    ordersPerCustomer,
    periodOrdersCount,
  };
}

async function getTimeSeries(from: Date, to: Date, groupBy: string) {
  const trunc = groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';

  // Customer registrations over time
  const userGrowth = await prisma.$queryRaw<Array<{ period: Date; count: bigint | number }>>`
    SELECT
      DATE_TRUNC(${trunc}, "createdAt") AS period,
      COUNT(*) AS count
    FROM users
    WHERE role = 'CUSTOMER' AND "createdAt" >= ${from} AND "createdAt" < ${to}
    GROUP BY DATE_TRUNC(${trunc}, "createdAt")
    ORDER BY period
  `;

  // Revenue and order counts over time
  const revenueSeries = await prisma.$queryRaw<Array<{ period: Date; revenue: bigint | number; orders: bigint | number }>>`
    SELECT
      DATE_TRUNC(${trunc}, "createdAt") AS period,
      COALESCE(SUM(total), 0) AS revenue,
      COUNT(*) AS orders
    FROM orders
    WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
      AND status IN ('CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED')
    GROUP BY DATE_TRUNC(${trunc}, "createdAt")
    ORDER BY period
  `;

  const map = new Map<string, { date: string; newCustomers: number; revenue: number; orders: number }>();

  for (const row of userGrowth) {
    const d = new Date(row.period).toISOString().slice(0, 10);
    map.set(d, { date: d, newCustomers: Number(row.count), revenue: 0, orders: 0 });
  }

  for (const row of revenueSeries) {
    const d = new Date(row.period).toISOString().slice(0, 10);
    const existing = map.get(d);
    if (existing) {
      existing.revenue = Number(row.revenue);
      existing.orders = Number(row.orders);
    } else {
      map.set(d, { date: d, newCustomers: 0, revenue: Number(row.revenue), orders: Number(row.orders) });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function getSegmentsDistribution() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);

  const [
    allCount,
    newCount,
    activeCount,
    inactiveCount,
    repeatCountAgg,
    oneTimeCountAgg,
    noPurchaseCount,
    loyaltyCount,
    referralCount,
    highValueCountAgg,
  ] = await Promise.all([
    // All customers
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    // New (registered in last 30 days)
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: thirtyDaysAgo } } }),
    // Active (ordered in last 60 days)
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        orders: { some: { createdAt: { gte: sixtyDaysAgo }, status: { in: REVENUE_STATUSES as never[] } } },
      },
    }),
    // Inactive (no orders in 90+ days)
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        orders: { none: { createdAt: { gte: ninetyDaysAgo }, status: { in: REVENUE_STATUSES as never[] } } },
      },
    }),
    // Repeat (>= 2 orders lifetime)
    prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*)::int AS count FROM (
        SELECT "userId" FROM orders
        WHERE "userId" IS NOT NULL AND status IN ('CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED')
        GROUP BY "userId"
        HAVING COUNT(*) >= 2
      ) repeat_users
    `,
    // One-Time (exactly 1 order lifetime)
    prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*)::int AS count FROM (
        SELECT "userId" FROM orders
        WHERE "userId" IS NOT NULL AND status IN ('CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED')
        GROUP BY "userId"
        HAVING COUNT(*) = 1
      ) single_order_users
    `,
    // No purchase
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        orders: { none: { status: { in: REVENUE_STATUSES as never[] } } },
      },
    }),
    // Loyalty members (> 0 points or Silver/Gold/Platinum)
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        OR: [
          { loyaltyPoints: { gt: 0 } },
          { loyaltyTier: { in: ['SILVER', 'GOLD', 'PLATINUM'] } },
        ],
      },
    }),
    // Referral champions (referred >= 1 user)
    prisma.user.count({
      where: {
        role: 'CUSTOMER',
        referrals: { some: {} },
      },
    }),
    // High Value / VIP (spent >= ₹10,000)
    prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*)::int AS count FROM (
        SELECT "userId" FROM orders
        WHERE "userId" IS NOT NULL AND status IN ('CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED')
        GROUP BY "userId"
        HAVING SUM(total) >= 10000
      ) vip_users
    `,
  ]);

  return [
    { key: 'all', label: 'All Customers', count: allCount, color: '#581312' },
    { key: 'high_value', label: 'High Value VIP', count: Number(highValueCountAgg[0]?.count ?? 0), color: '#C47C0A' },
    { key: 'repeat', label: 'Repeat Customers', count: Number(repeatCountAgg[0]?.count ?? 0), color: '#2D7A4F' },
    { key: 'new', label: 'New Customers', count: newCount, color: '#1565A0' },
    { key: 'active', label: 'Active', count: activeCount, color: '#4A7C59' },
    { key: 'one_time', label: 'One-Time Buyers', count: Number(oneTimeCountAgg[0]?.count ?? 0), color: '#8B3030' },
    { key: 'inactive', label: 'Inactive / At-Risk', count: inactiveCount, color: '#D4880A' },
    { key: 'no_purchase', label: 'Registered (No Purchase)', count: noPurchaseCount, color: '#6B1A1A' },
    { key: 'loyalty', label: 'Loyalty Members', count: loyaltyCount, color: '#C47C0A' },
    { key: 'referral', label: 'Referral Champions', count: referralCount, color: '#3395FF' },
  ];
}

async function getOrderFrequencyDistribution() {
  const result = await prisma.$queryRaw<Array<{ frequency: string; count: bigint | number }>>`
    SELECT
      CASE
        WHEN order_count = 1 THEN '1 Order'
        WHEN order_count BETWEEN 2 AND 3 THEN '2-3 Orders'
        WHEN order_count BETWEEN 4 AND 5 THEN '4-5 Orders'
        ELSE '6+ Orders'
      END AS frequency,
      COUNT(*)::int AS count
    FROM (
      SELECT COUNT(*) AS order_count
      FROM orders
      WHERE "userId" IS NOT NULL AND status IN ('CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED')
      GROUP BY "userId"
    ) user_orders
    GROUP BY frequency
    ORDER BY frequency
  `;

  return result.map(r => ({ label: r.frequency, value: Number(r.count) }));
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }

    const { period, dateFrom, dateTo, compare, groupBy } = parseResult.data;
    const current = getPeriodDates(period, dateFrom, dateTo);
    const compDates = getComparisonDates(current, compare);

    const [kpis, timeSeries, segments, frequencyDistribution, compKpis] = await Promise.all([
      getCrmKpis(current.from, current.to),
      getTimeSeries(current.from, current.to, groupBy),
      getSegmentsDistribution(),
      getOrderFrequencyDistribution(),
      compDates ? getCrmKpis(compDates.from, compDates.to) : null,
    ]);

    const pctChange = (curr: number, prev: number | null | undefined) => {
      if (prev === null || prev === undefined || prev === 0) return null;
      return ((curr - prev) / prev) * 100;
    };

    const comparison = compKpis ? {
      customersChange: pctChange(kpis.totalCustomers, compKpis.totalCustomers),
      newCustomersChange: pctChange(kpis.newCustomers, compKpis.newCustomers),
      activeCustomersChange: pctChange(kpis.activeCustomers, compKpis.activeCustomers),
      revenueChange: pctChange(kpis.totalCustomerRevenue, compKpis.totalCustomerRevenue),
      aovChange: pctChange(kpis.aov, compKpis.aov),
      clvChange: pctChange(kpis.clv, compKpis.clv),
      prevTotalCustomers: compKpis.totalCustomers,
      prevNewCustomers: compKpis.newCustomers,
      prevRevenue: compKpis.totalCustomerRevenue,
    } : null;

    return ok({
      period: {
        selected: period,
        dateFrom: current.from.toISOString(),
        dateTo: current.to.toISOString(),
        groupBy,
        compare,
      },
      kpis,
      timeSeries,
      segments,
      frequencyDistribution,
      comparison,
    });
  } catch (err) {
    console.error('[CRM Overview] Error:', err);
    return serverError('Failed to fetch CRM overview');
  }
}
