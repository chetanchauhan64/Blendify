// ============================================================
// BLENDIFY — Analytics Overview API
// GET /api/admin/analytics/overview
//
// Query params:
//   period    : today|yesterday|last7|last30|last90|thisMonth|prevMonth|thisYear|custom
//   dateFrom  : ISO date string (required when period=custom)
//   dateTo    : ISO date string (required when period=custom)
//   compare   : prevPeriod|prevMonth|prevYear|none
//   groupBy   : day|week|month
//
// All revenue values use stored historical order data.
// Cancelled orders are excluded from revenue.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, serverError, badRequest } from '@/lib/utils/api';
import { z } from 'zod';

// ── Input validation ──────────────────────────────────────────
const QuerySchema = z.object({
  period: z.enum(['today', 'yesterday', 'last7', 'last30', 'last90', 'thisMonth', 'prevMonth', 'thisYear', 'custom']).default('last30'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  compare: z.enum(['prevPeriod', 'prevMonth', 'prevYear', 'none']).default('prevPeriod'),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// ── Statuses considered eligible (not cancelled/refunded) ────
const ELIGIBLE_ORDER_STATUSES = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_REQUESTED', 'RETURNED', 'REFUND_INITIATED', 'REFUNDED'];
const CANCELLED_STATUSES = ['CANCELLED'];
const REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

// ── Date range helpers ────────────────────────────────────────
function getPeriodDates(period: string, dateFrom?: string, dateTo?: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);

  switch (period) {
    case 'today':
      return { from: today, to: tomorrow };
    case 'yesterday': {
      const yest = new Date(today.getTime() - 86400000);
      return { from: yest, to: today };
    }
    case 'last7': {
      const f = new Date(today.getTime() - 6 * 86400000);
      return { from: f, to: tomorrow };
    }
    case 'last30': {
      const f = new Date(today.getTime() - 29 * 86400000);
      return { from: f, to: tomorrow };
    }
    case 'last90': {
      const f = new Date(today.getTime() - 89 * 86400000);
      return { from: f, to: tomorrow };
    }
    case 'thisMonth': {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      const t = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { from: f, to: t };
    }
    case 'prevMonth': {
      const f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const t = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: f, to: t };
    }
    case 'thisYear': {
      const f = new Date(now.getFullYear(), 0, 1);
      const t = new Date(now.getFullYear() + 1, 0, 1);
      return { from: f, to: t };
    }
    case 'custom': {
      if (!dateFrom || !dateTo) {
        const f = new Date(today.getTime() - 29 * 86400000);
        return { from: f, to: tomorrow };
      }
      return { from: new Date(dateFrom), to: new Date(new Date(dateTo).getTime() + 86400000) };
    }
    default: {
      const f = new Date(today.getTime() - 29 * 86400000);
      return { from: f, to: tomorrow };
    }
  }
}

function getComparisonDates(current: { from: Date; to: Date }, compare: string): { from: Date; to: Date } | null {
  if (compare === 'none') return null;
  const duration = current.to.getTime() - current.from.getTime();
  switch (compare) {
    case 'prevPeriod':
      return { from: new Date(current.from.getTime() - duration), to: new Date(current.from) };
    case 'prevMonth': {
      const f = new Date(current.from);
      f.setMonth(f.getMonth() - 1);
      const t = new Date(current.to);
      t.setMonth(t.getMonth() - 1);
      return { from: f, to: t };
    }
    case 'prevYear': {
      const f = new Date(current.from);
      f.setFullYear(f.getFullYear() - 1);
      const t = new Date(current.to);
      t.setFullYear(t.getFullYear() - 1);
      return { from: f, to: t };
    }
    default: return null;
  }
}

// ── Core aggregation ──────────────────────────────────────────
async function getRevenueMetrics(from: Date, to: Date) {
  // Gross revenue: sum of totals for non-cancelled orders
  const [revenueData, discountData, taxData, shippingData, refundData, orderCountData, cancelledCountData, unitsData] = await Promise.all([
    // Gross revenue (all non-cancelled orders)
    prisma.order.aggregate({
      _sum: { total: true, subtotal: true },
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: REVENUE_STATUSES as never[] },
      },
    }),
    // Total discounts
    prisma.order.aggregate({
      _sum: { discount: true, loyaltyDiscount: true },
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: ELIGIBLE_ORDER_STATUSES as never[] },
      },
    }),
    // Total tax (stored historical)
    prisma.order.aggregate({
      _sum: { tax: true },
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: ELIGIBLE_ORDER_STATUSES as never[] },
      },
    }),
    // Shipping revenue (stored historical)
    prisma.order.aggregate({
      _sum: { shippingCost: true },
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: ELIGIBLE_ORDER_STATUSES as never[] },
      },
    }),
    // Actual refund amounts from payment records
    prisma.payment.aggregate({
      _sum: { refundAmount: true },
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
      },
    }),
    // Total eligible orders
    prisma.order.count({
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: REVENUE_STATUSES as never[] },
      },
    }),
    // Cancelled orders
    prisma.order.count({
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: CANCELLED_STATUSES as never[] },
      },
    }),
    // Total units sold
    prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: {
          createdAt: { gte: from, lt: to },
          status: { in: REVENUE_STATUSES as never[] },
        },
      },
    }),
  ]);

  const gross = Number(revenueData._sum?.total ?? 0);
  const refunds = Number(refundData._sum?.refundAmount ?? 0);
  const discount = Number(discountData._sum?.discount ?? 0) + Number(discountData._sum?.loyaltyDiscount ?? 0);
  const tax = Number(taxData._sum?.tax ?? 0);
  const shipping = Number(shippingData._sum?.shippingCost ?? 0);
  const net = Math.max(0, gross - refunds);
  const aov = orderCountData > 0 ? net / orderCountData : 0;

  // Refund rate: orders that have been refunded / total eligible orders
  const refundedOrderCount = await prisma.order.count({
    where: {
      createdAt: { gte: from, lt: to },
      status: { in: ['REFUNDED', 'REFUND_INITIATED'] as never[] },
    },
  });

  const totalOrders = orderCountData + cancelledCountData + refundedOrderCount;
  const cancellationRate = totalOrders > 0 ? (cancelledCountData / totalOrders) * 100 : 0;
  const refundRate = totalOrders > 0 ? (refundedOrderCount / totalOrders) * 100 : 0;

  return {
    gross,
    net,
    discount,
    refunds,
    tax,
    shipping,
    aov,
    orders: orderCountData,
    cancelledOrders: cancelledCountData,
    cancellationRate,
    refundRate,
    unitsSold: Number(unitsData._sum?.quantity ?? 0),
  };
}

async function getCustomerMetrics(from: Date, to: Date) {
  // New customers: first-time registrations in period
  const newCustomerRegistrations = await prisma.user.count({
    where: {
      createdAt: { gte: from, lt: to },
      role: 'CUSTOMER',
    },
  });

  // Customers who placed an eligible order in this period
  const ordersInPeriod = await prisma.order.findMany({
    where: {
      createdAt: { gte: from, lt: to },
      status: { in: REVENUE_STATUSES as never[] },
      userId: { not: null },
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  const uniqueOrderingUsers = ordersInPeriod.map((o) => o.userId as string);

  if (uniqueOrderingUsers.length === 0) {
    return { newCustomers: newCustomerRegistrations, returningCustomers: 0, repeatRate: 0 };
  }

  // Returning customers: had an order BEFORE this period AND ordered in this period
  const priorOrderUsers = await prisma.order.findMany({
    where: {
      createdAt: { lt: from },
      status: { in: REVENUE_STATUSES as never[] },
      userId: { in: uniqueOrderingUsers },
    },
    select: { userId: true },
    distinct: ['userId'],
  });
  const returningUserIds = new Set(priorOrderUsers.map((o) => o.userId as string));
  const returningCustomers = uniqueOrderingUsers.filter((id) => returningUserIds.has(id)).length;
  const repeatRate = uniqueOrderingUsers.length > 0 ? (returningCustomers / uniqueOrderingUsers.length) * 100 : 0;

  return {
    newCustomers: newCustomerRegistrations,
    returningCustomers,
    repeatRate,
  };
}

async function getPaymentMethodBreakdown(from: Date, to: Date) {
  const payments = await prisma.payment.groupBy({
    by: ['gateway'],
    _sum: { amount: true },
    _count: { id: true },
    where: {
      status: 'PAID',
      createdAt: { gte: from, lt: to },
    },
  });
  return payments.map((p) => ({
    gateway: p.gateway,
    revenue: Number(p._sum?.amount ?? 0),
    count: p._count.id,
  }));
}

async function getTimeSeries(from: Date, to: Date, groupBy: string) {
  // Use Prisma raw SQL for DATE_TRUNC grouping (PostgreSQL native)
  const truncUnit = groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';

  const revenueRows = await prisma.$queryRaw<Array<{ bucket: Date; revenue: number; orders: bigint }>>`
    SELECT
      DATE_TRUNC(${truncUnit}, "createdAt") AS bucket,
      COALESCE(SUM(CASE WHEN status = ANY(${REVENUE_STATUSES}::text[]) THEN total ELSE 0 END), 0) AS revenue,
      COUNT(CASE WHEN status = ANY(${REVENUE_STATUSES}::text[]) THEN 1 END) AS orders
    FROM orders
    WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  const customerRows = await prisma.$queryRaw<Array<{ bucket: Date; customers: bigint }>>`
    SELECT
      DATE_TRUNC(${truncUnit}, "createdAt") AS bucket,
      COUNT(*) AS customers
    FROM users
    WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
      AND role = 'CUSTOMER'
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  // Merge into unified time series
  const revenueMap = new Map(revenueRows.map((r) => [r.bucket.toISOString(), r]));
  const customerMap = new Map(customerRows.map((r) => [r.bucket.toISOString(), r]));

  const allBuckets = new Set([...revenueMap.keys(), ...customerMap.keys()]);
  return Array.from(allBuckets)
    .sort()
    .map((bucket) => {
      const rev = revenueMap.get(bucket);
      const cust = customerMap.get(bucket);
      return {
        date: bucket,
        revenue: Number(rev?.revenue ?? 0),
        orders: Number(rev?.orders ?? 0),
        customers: Number(cust?.customers ?? 0),
      };
    });
}

// ── Route handler ─────────────────────────────────────────────
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
    const compRange = getComparisonDates(current, compare);

    // Fetch current period metrics in parallel
    const [currentMetrics, currentCustomers, paymentMethods, timeSeries] = await Promise.all([
      getRevenueMetrics(current.from, current.to),
      getCustomerMetrics(current.from, current.to),
      getPaymentMethodBreakdown(current.from, current.to),
      getTimeSeries(current.from, current.to, groupBy),
    ]);

    // Fetch comparison metrics if requested
    let comparison: {
      currentPeriod: { from: string; to: string };
      previousPeriod: { from: string; to: string } | null;
      revenueChange: number | null;
      orderChange: number | null;
      customerChange: number | null;
      prevGrossRevenue: number | null;
      prevNetRevenue: number | null;
      prevOrders: number | null;
      prevNewCustomers: number | null;
    } = {
      currentPeriod: { from: current.from.toISOString(), to: current.to.toISOString() },
      previousPeriod: compRange ? { from: compRange.from.toISOString(), to: compRange.to.toISOString() } : null,
      revenueChange: null,
      orderChange: null,
      customerChange: null,
      prevGrossRevenue: null,
      prevNetRevenue: null,
      prevOrders: null,
      prevNewCustomers: null,
    };

    if (compRange) {
      const [prevMetrics, prevCustomers] = await Promise.all([
        getRevenueMetrics(compRange.from, compRange.to),
        getCustomerMetrics(compRange.from, compRange.to),
      ]);
      const safeChange = (curr: number, prev: number) =>
        prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;

      comparison = {
        ...comparison,
        revenueChange: safeChange(currentMetrics.gross, prevMetrics.gross),
        orderChange: safeChange(currentMetrics.orders, prevMetrics.orders),
        customerChange: safeChange(currentCustomers.newCustomers, prevCustomers.newCustomers),
        prevGrossRevenue: prevMetrics.gross,
        prevNetRevenue: prevMetrics.net,
        prevOrders: prevMetrics.orders,
        prevNewCustomers: prevCustomers.newCustomers,
      };
    }

    return ok({
      period: { selected: period, dateFrom: current.from.toISOString(), dateTo: current.to.toISOString(), groupBy, compare },
      revenue: {
        gross: currentMetrics.gross,
        net: currentMetrics.net,
        discount: currentMetrics.discount,
        refunds: currentMetrics.refunds,
        tax: currentMetrics.tax,
        shipping: currentMetrics.shipping,
        aov: currentMetrics.aov,
        growth: comparison.revenueChange,
      },
      sales: {
        orders: currentMetrics.orders,
        units: currentMetrics.unitsSold,
        aov: currentMetrics.aov,
        cancellationRate: currentMetrics.cancellationRate,
        refundRate: currentMetrics.refundRate,
        cancelledOrders: currentMetrics.cancelledOrders,
      },
      customers: {
        newCustomers: currentCustomers.newCustomers,
        returningCustomers: currentCustomers.returningCustomers,
        repeatRate: currentCustomers.repeatRate,
      },
      timeSeries,
      paymentMethods,
      comparison,
    });
  } catch (err) {
    console.error('[Analytics Overview] Error:', err);
    return serverError('Failed to fetch analytics data');
  }
}
