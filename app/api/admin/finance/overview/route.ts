// ============================================================
// BLENDIFY — Finance Overview API
// GET /api/admin/finance/overview
//
// Query params:
//   period   : today|yesterday|last7|last30|last90|thisMonth|prevMonth|thisYear|custom
//   dateFrom : ISO date string (required when period=custom)
//   dateTo   : ISO date string (required when period=custom)
//   compare  : prevPeriod|prevMonth|prevYear|none
//   groupBy  : day|week|month
//
// Returns KPIs, time series, gateway breakdown, reconciliation,
// refund reporting, and tax/discount breakdown.
// All values from real PostgreSQL aggregation.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
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

// ── Statuses ──────────────────────────────────────────────────
const REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const ALL_ORDER_STATUSES = [...REVENUE_STATUSES, 'RETURN_REQUESTED', 'RETURNED', 'REFUND_INITIATED', 'REFUNDED', 'CANCELLED'];

// ── Date range helpers (same pattern as analytics) ────────────
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

// ── Core KPI aggregation ──────────────────────────────────────
async function getFinanceKPIs(from: Date, to: Date) {
  const [
    revenueAgg,
    discountAgg,
    taxAgg,
    shippingAgg,
    orderCount,
    cancelledCount,
    refundedOrderCount,
    paymentAgg,
    paymentFailedAgg,
    paymentPendingAgg,
    totalPaymentCount,
    refundPaymentAgg,
  ] = await Promise.all([
    // Gross revenue from revenue-eligible orders
    prisma.order.aggregate({
      _sum: { total: true, subtotal: true },
      where: { createdAt: { gte: from, lt: to }, status: { in: REVENUE_STATUSES as never[] } },
    }),
    // Discounts (all non-cancelled orders)
    prisma.order.aggregate({
      _sum: { discount: true, loyaltyDiscount: true },
      where: { createdAt: { gte: from, lt: to }, status: { in: ALL_ORDER_STATUSES.filter(s => s !== 'CANCELLED') as never[] } },
    }),
    // Tax collected
    prisma.order.aggregate({
      _sum: { tax: true },
      where: { createdAt: { gte: from, lt: to }, status: { in: ALL_ORDER_STATUSES.filter(s => s !== 'CANCELLED') as never[] } },
    }),
    // Shipping revenue
    prisma.order.aggregate({
      _sum: { shippingCost: true },
      where: { createdAt: { gte: from, lt: to }, status: { in: ALL_ORDER_STATUSES.filter(s => s !== 'CANCELLED') as never[] } },
    }),
    // Revenue-eligible order count
    prisma.order.count({
      where: { createdAt: { gte: from, lt: to }, status: { in: REVENUE_STATUSES as never[] } },
    }),
    // Cancelled order count
    prisma.order.count({
      where: { createdAt: { gte: from, lt: to }, status: 'CANCELLED' },
    }),
    // Refunded order count
    prisma.order.count({
      where: { createdAt: { gte: from, lt: to }, status: { in: ['REFUNDED', 'REFUND_INITIATED'] as never[] } },
    }),
    // Successful payment aggregation (PAID status — authoritative for success rate)
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: { createdAt: { gte: from, lt: to }, status: 'PAID' },
    }),
    // Failed payment aggregation
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: { createdAt: { gte: from, lt: to }, status: 'FAILED' },
    }),
    // Pending payment aggregation
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: { createdAt: { gte: from, lt: to }, status: 'PENDING' },
    }),
    // Total payment count
    prisma.payment.count({
      where: { createdAt: { gte: from, lt: to } },
    }),
    // Refund amounts from Payment records (authoritative for refund amounts)
    prisma.payment.aggregate({
      _sum: { refundAmount: true },
      _count: { id: true },
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
      },
    }),
  ]);

  const gross = Number(revenueAgg._sum?.total ?? 0);
  const totalRevenue = Number(revenueAgg._sum?.subtotal ?? 0);
  const discounts = Number(discountAgg._sum?.discount ?? 0) + Number(discountAgg._sum?.loyaltyDiscount ?? 0);
  const couponDiscounts = Number(discountAgg._sum?.discount ?? 0);
  const loyaltyDiscounts = Number(discountAgg._sum?.loyaltyDiscount ?? 0);
  const taxCollected = Number(taxAgg._sum?.tax ?? 0);
  const shippingRevenue = Number(shippingAgg._sum?.shippingCost ?? 0);
  const refunds = Number(refundPaymentAgg._sum?.refundAmount ?? 0);
  const net = Math.max(0, gross - refunds);
  const totalOrders = orderCount + cancelledCount + refundedOrderCount;
  const aov = orderCount > 0 ? gross / orderCount : 0;

  const successfulPayments = paymentAgg._count?.id ?? 0;
  const failedPayments = paymentFailedAgg._count?.id ?? 0;
  const pendingPayments = paymentPendingAgg._count?.id ?? 0;
  const successfulAmount = Number(paymentAgg._sum?.amount ?? 0);
  const failedAmount = Number(paymentFailedAgg._sum?.amount ?? 0);
  const pendingAmount = Number(paymentPendingAgg._sum?.amount ?? 0);
  const refundedPaymentCount = refundPaymentAgg._count?.id ?? 0;

  const paymentSuccessRate = totalPaymentCount > 0 ? (successfulPayments / totalPaymentCount) * 100 : 0;
  const paymentFailureRate = totalPaymentCount > 0 ? (failedPayments / totalPaymentCount) * 100 : 0;
  const refundRate = totalOrders > 0 ? (refundedOrderCount / totalOrders) * 100 : 0;
  const netReceivable = Math.max(0, successfulAmount - refunds);

  return {
    grossRevenue: gross,
    netRevenue: net,
    totalRevenue,
    discounts,
    couponDiscounts,
    loyaltyDiscounts,
    taxCollected,
    shippingRevenue,
    refunds,
    netReceivable,
    totalOrders,
    totalTransactions: totalPaymentCount,
    aov,
    paymentSuccessRate,
    paymentFailureRate,
    refundRate,
    // Reconciliation
    successfulPayments,
    failedPayments,
    pendingPayments,
    refundedPaymentCount,
    successfulAmount,
    failedAmount,
    pendingAmount,
    refundedAmount: refunds,
    totalGatewayAmount: successfulAmount + failedAmount + pendingAmount,
    totalOrderAmount: gross,
    reconciliationVariance: (successfulAmount + failedAmount + pendingAmount) - gross,
  };
}

// ── Time series ───────────────────────────────────────────────
async function getTimeSeries(from: Date, to: Date, groupBy: string) {
  // IMPORTANT: trunc is always one of 3 hardcoded values — safe for Prisma.raw()
  const trunc = groupBy === 'month' ? 'month' : groupBy === 'week' ? 'week' : 'day';
  const truncSql = Prisma.raw(`'${trunc}'`);

  // Revenue time series from orders
  const revenueSeries = await prisma.$queryRaw<Array<{ period: Date; revenue: bigint | number; orders: bigint | number; tax: bigint | number; discount: bigint | number; shipping: bigint | number }>>`
    SELECT
      DATE_TRUNC(${truncSql}, "createdAt") AS period,
      COALESCE(SUM(CASE WHEN status IN ('CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED') THEN total ELSE 0 END), 0) AS revenue,
      COUNT(CASE WHEN status IN ('CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED') THEN 1 END) AS orders,
      COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN tax ELSE 0 END), 0) AS tax,
      COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN discount + "loyaltyDiscount" ELSE 0 END), 0) AS discount,
      COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN "shippingCost" ELSE 0 END), 0) AS shipping
    FROM orders
    WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
    GROUP BY DATE_TRUNC(${truncSql}, "createdAt")
    ORDER BY period
  `;

  // Transaction/refund time series from payments
  const paymentSeries = await prisma.$queryRaw<Array<{ period: Date; transactions: bigint | number; refunds: bigint | number }>>`
    SELECT
      DATE_TRUNC(${truncSql}, "createdAt") AS period,
      COUNT(*) AS transactions,
      COALESCE(SUM(CASE WHEN status IN ('REFUNDED','PARTIALLY_REFUNDED') THEN "refundAmount" ELSE 0 END), 0) AS refunds
    FROM payments
    WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
    GROUP BY DATE_TRUNC(${truncSql}, "createdAt")
    ORDER BY period
  `;


  // Merge into a single series
  const dateMap = new Map<string, {
    date: string; revenue: number; orders: number; transactions: number;
    refunds: number; tax: number; discount: number; shipping: number; netRevenue: number;
  }>();

  for (const row of revenueSeries) {
    const d = new Date(row.period).toISOString().slice(0, 10);
    const rev = Number(row.revenue);
    dateMap.set(d, {
      date: d, revenue: rev, orders: Number(row.orders),
      transactions: 0, refunds: 0,
      tax: Number(row.tax), discount: Number(row.discount),
      shipping: Number(row.shipping), netRevenue: rev,
    });
  }

  for (const row of paymentSeries) {
    const d = new Date(row.period).toISOString().slice(0, 10);
    const existing = dateMap.get(d);
    const refAmt = Number(row.refunds);
    if (existing) {
      existing.transactions = Number(row.transactions);
      existing.refunds = refAmt;
      existing.netRevenue = Math.max(0, existing.revenue - refAmt);
    } else {
      dateMap.set(d, {
        date: d, revenue: 0, orders: 0,
        transactions: Number(row.transactions), refunds: refAmt,
        tax: 0, discount: 0, shipping: 0, netRevenue: 0,
      });
    }
  }

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// ── Gateway breakdown ─────────────────────────────────────────
async function getGatewayBreakdown(from: Date, to: Date) {
  const gateways = await prisma.payment.groupBy({
    by: ['gateway', 'status'],
    _sum: { amount: true, refundAmount: true },
    _count: { id: true },
    where: { createdAt: { gte: from, lt: to } },
  });

  // Aggregate per gateway
  const map = new Map<string, {
    gateway: string; transactionCount: number;
    successfulAmount: number; failedAmount: number;
    pendingAmount: number; refundedAmount: number;
    successfulCount: number; failedCount: number;
    pendingCount: number; refundedCount: number;
  }>();

  for (const row of gateways) {
    const g = row.gateway;
    if (!map.has(g)) {
      map.set(g, {
        gateway: g, transactionCount: 0,
        successfulAmount: 0, failedAmount: 0, pendingAmount: 0, refundedAmount: 0,
        successfulCount: 0, failedCount: 0, pendingCount: 0, refundedCount: 0,
      });
    }
    const entry = map.get(g)!;
    const count = row._count.id;
    const amount = Number(row._sum?.amount ?? 0);
    const refund = Number(row._sum?.refundAmount ?? 0);
    entry.transactionCount += count;

    if (row.status === 'PAID' || row.status === 'AUTHORIZED') {
      entry.successfulAmount += amount;
      entry.successfulCount += count;
    } else if (row.status === 'FAILED' || row.status === 'CANCELLED') {
      entry.failedAmount += amount;
      entry.failedCount += count;
    } else if (row.status === 'PENDING') {
      entry.pendingAmount += amount;
      entry.pendingCount += count;
    }
    if (row.status === 'REFUNDED' || row.status === 'PARTIALLY_REFUNDED') {
      entry.refundedAmount += refund;
      entry.refundedCount += count;
    }
  }

  return Array.from(map.values());
}

// ── Refund reporting ──────────────────────────────────────────
async function getRefundReport(from: Date, to: Date) {
  // From Payment records (authoritative for financial refund amounts)
  const [paymentRefunds, returnRequests] = await Promise.all([
    prisma.payment.groupBy({
      by: ['gateway'],
      _sum: { refundAmount: true },
      _count: { id: true },
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
      },
    }),
    prisma.returnRequest.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { refundAmount: true },
      where: { createdAt: { gte: from, lt: to } },
    }),
  ]);

  const refundsByGateway = paymentRefunds.map(r => ({
    gateway: r.gateway,
    count: r._count.id,
    amount: Number(r._sum?.refundAmount ?? 0),
  }));

  const returnStatusBreakdown = returnRequests.map(r => ({
    status: r.status,
    count: r._count.id,
    amount: Number(r._sum?.refundAmount ?? 0),
  }));

  const totalRefundCount = refundsByGateway.reduce((s, r) => s + r.count, 0);
  const totalRefundAmount = refundsByGateway.reduce((s, r) => s + r.amount, 0);

  return {
    totalRefundCount,
    totalRefundAmount,
    refundsByGateway,
    returnStatusBreakdown,
  };
}

// ── Main handler ──────────────────────────────────────────────
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

    // Run all aggregations in parallel
    const [kpis, timeSeries, gatewayBreakdown, refundReport, compKpis] = await Promise.all([
      getFinanceKPIs(current.from, current.to),
      getTimeSeries(current.from, current.to, groupBy),
      getGatewayBreakdown(current.from, current.to),
      getRefundReport(current.from, current.to),
      compDates ? getFinanceKPIs(compDates.from, compDates.to) : null,
    ]);

    // Calculate comparison percentages
    const pctChange = (curr: number, prev: number | null | undefined) => {
      if (prev === null || prev === undefined || prev === 0) return null;
      return ((curr - prev) / prev) * 100;
    };

    const comparison = compKpis ? {
      grossRevenueChange: pctChange(kpis.grossRevenue, compKpis.grossRevenue),
      netRevenueChange: pctChange(kpis.netRevenue, compKpis.netRevenue),
      ordersChange: pctChange(kpis.totalOrders, compKpis.totalOrders),
      transactionsChange: pctChange(kpis.totalTransactions, compKpis.totalTransactions),
      aovChange: pctChange(kpis.aov, compKpis.aov),
      refundsChange: pctChange(kpis.refunds, compKpis.refunds),
      taxChange: pctChange(kpis.taxCollected, compKpis.taxCollected),
      discountsChange: pctChange(kpis.discounts, compKpis.discounts),
      prevGrossRevenue: compKpis.grossRevenue,
      prevNetRevenue: compKpis.netRevenue,
      prevOrders: compKpis.totalOrders,
      prevTransactions: compKpis.totalTransactions,
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
      gatewayBreakdown,
      refundReport,
      comparison,
    });
  } catch (err) {
    console.error('[Finance Overview] Error:', err);
    return serverError('Failed to fetch finance overview');
  }
}
