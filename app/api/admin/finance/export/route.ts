// ============================================================
// BLENDIFY — Finance Export API
// GET /api/admin/finance/export
//
// Query params:
//   format   : csv|excel|pdf|print
//   section  : overview|transactions|reconciliation|refunds
//   period   : date period filter
//   dateFrom : ISO date
//   dateTo   : ISO date
//   gateway  : optional gateway filter
//
// Uses existing lib/utils/export.ts utilities.
// Creates audit log entry for each export.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { serverError, badRequest } from '@/lib/utils/api';
import {
  generateCSV, csvResponse,
  generateExcelXML, excelResponse,
  generatePDFHtml, pdfHtmlResponse,
  type ExportColumn,
} from '@/lib/utils/export';
import { z } from 'zod';

const QuerySchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf', 'print']),
  section: z.enum(['overview', 'transactions', 'reconciliation', 'refunds']).default('transactions'),
  period: z.enum(['today', 'yesterday', 'last7', 'last30', 'last90', 'thisMonth', 'prevMonth', 'thisYear', 'custom']).default('last30'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  gateway: z.enum(['RAZORPAY', 'STRIPE', 'COD', 'WALLET', 'LOYALTY_POINTS']).optional(),
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

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }
    const { format, section, period, dateFrom, dateTo, gateway } = parseResult.data;
    const { from, to } = getPeriodDates(period, dateFrom, dateTo);
    const now = new Date();
    const filename = `finance-${section}-${now.toISOString().slice(0, 10)}`;

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'EXPORT',
          module: 'finance',
          entityId: section,
          entityLabel: `Finance ${section} export (${period})`,
          after: { format, period, dateFrom: from.toISOString(), dateTo: to.toISOString() },
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch { /* non-critical */ }

    // ── TRANSACTIONS EXPORT ─────────────────────────────────────
    if (section === 'transactions') {
      const payments = await prisma.payment.findMany({
        where: {
          createdAt: { gte: from, lt: to },
          ...(gateway ? { gateway } : {}),
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              total: true,
              currencyCode: true,
              user: { select: { firstName: true, lastName: true, email: true } },
              guestEmail: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });

      type TxRow = {
        transactionId: string; orderNumber: string; customer: string; email: string;
        gateway: string; amount: number; currency: string; paymentStatus: string;
        orderStatus: string; paidAt: string; refundAmount: number; createdAt: string;
      };

      const data: TxRow[] = payments.map((p) => ({
        transactionId: p.id,
        orderNumber: p.order.orderNumber,
        customer: p.order.user ? `${p.order.user.firstName} ${p.order.user.lastName}`.trim() : 'Guest',
        email: p.order.user?.email ?? p.order.guestEmail ?? '',
        gateway: p.gateway,
        amount: Number(p.amount),
        currency: p.currencyCode,
        paymentStatus: p.status,
        orderStatus: p.order.status,
        paidAt: p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—',
        refundAmount: p.refundAmount ? Number(p.refundAmount) : 0,
        createdAt: new Date(p.createdAt).toLocaleDateString('en-IN'),
      }));

      const title = `Finance Transactions — ${period}`;
      const columns: ExportColumn<TxRow>[] = [
        { header: 'Transaction ID', key: 'transactionId' },
        { header: 'Order #', key: 'orderNumber' },
        { header: 'Customer', key: 'customer' },
        { header: 'Email', key: 'email' },
        { header: 'Gateway', key: 'gateway' },
        { header: 'Amount', key: 'amount' },
        { header: 'Currency', key: 'currency' },
        { header: 'Payment Status', key: 'paymentStatus' },
        { header: 'Order Status', key: 'orderStatus' },
        { header: 'Paid At', key: 'paidAt' },
        { header: 'Refund Amount', key: 'refundAmount' },
        { header: 'Created At', key: 'createdAt' },
      ];
      const typedCols = columns as ExportColumn<Record<string, unknown>>[];
      if (format === 'excel') return excelResponse(generateExcelXML(data, typedCols, title), filename);
      if (format === 'pdf') return pdfHtmlResponse(generatePDFHtml(data, typedCols, title), filename);
      if (format === 'print') return new Response(generatePDFHtml(data, typedCols, title), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      return csvResponse(generateCSV(data, typedCols), filename);
    }

    // ── OVERVIEW EXPORT ─────────────────────────────────────────
    if (section === 'overview') {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: from, lt: to } },
        select: {
          orderNumber: true, status: true, paymentStatus: true,
          subtotal: true, discount: true, loyaltyDiscount: true,
          tax: true, shippingCost: true, total: true,
          currencyCode: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });

      type OvRow = {
        orderNumber: string; status: string; paymentStatus: string;
        subtotal: number; discount: number; loyaltyDiscount: number;
        tax: number; shipping: number; total: number;
        currency: string; date: string;
      };

      const data: OvRow[] = orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        loyaltyDiscount: Number(o.loyaltyDiscount),
        tax: Number(o.tax),
        shipping: Number(o.shippingCost),
        total: Number(o.total),
        currency: o.currencyCode,
        date: new Date(o.createdAt).toLocaleDateString('en-IN'),
      }));

      const title = `Finance Overview — ${period}`;
      const columns: ExportColumn<OvRow>[] = [
        { header: 'Order #', key: 'orderNumber' },
        { header: 'Status', key: 'status' },
        { header: 'Payment', key: 'paymentStatus' },
        { header: 'Subtotal', key: 'subtotal' },
        { header: 'Discount', key: 'discount' },
        { header: 'Loyalty Discount', key: 'loyaltyDiscount' },
        { header: 'Tax', key: 'tax' },
        { header: 'Shipping', key: 'shipping' },
        { header: 'Total', key: 'total' },
        { header: 'Currency', key: 'currency' },
        { header: 'Date', key: 'date' },
      ];
      const typedCols = columns as ExportColumn<Record<string, unknown>>[];
      if (format === 'excel') return excelResponse(generateExcelXML(data, typedCols, title), filename);
      if (format === 'pdf') return pdfHtmlResponse(generatePDFHtml(data, typedCols, title), filename);
      if (format === 'print') return new Response(generatePDFHtml(data, typedCols, title), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      return csvResponse(generateCSV(data, typedCols), filename);
    }

    // ── RECONCILIATION EXPORT ───────────────────────────────────
    if (section === 'reconciliation') {
      const payments = await prisma.payment.groupBy({
        by: ['status'],
        _sum: { amount: true, refundAmount: true },
        _count: { id: true },
        where: { createdAt: { gte: from, lt: to } },
      });

      type RecRow = { status: string; count: number; amount: number; refundAmount: number };
      const data: RecRow[] = payments.map((p) => ({
        status: p.status,
        count: p._count.id,
        amount: Number(p._sum?.amount ?? 0),
        refundAmount: Number(p._sum?.refundAmount ?? 0),
      }));

      const title = `Finance Reconciliation — ${period}`;
      const columns: ExportColumn<RecRow>[] = [
        { header: 'Payment Status', key: 'status' },
        { header: 'Count', key: 'count' },
        { header: 'Amount', key: 'amount' },
        { header: 'Refund Amount', key: 'refundAmount' },
      ];
      const typedCols = columns as ExportColumn<Record<string, unknown>>[];
      if (format === 'excel') return excelResponse(generateExcelXML(data, typedCols, title), filename);
      if (format === 'pdf') return pdfHtmlResponse(generatePDFHtml(data, typedCols, title), filename);
      if (format === 'print') return new Response(generatePDFHtml(data, typedCols, title), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      return csvResponse(generateCSV(data, typedCols), filename);
    }

    // ── REFUNDS EXPORT ──────────────────────────────────────────
    const refunds = await prisma.payment.findMany({
      where: {
        createdAt: { gte: from, lt: to },
        status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
        ...(gateway ? { gateway } : {}),
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            user: { select: { firstName: true, lastName: true, email: true } },
            guestEmail: true,
          },
        },
      },
      orderBy: { refundedAt: 'desc' },
      take: 5000,
    });

    type RefRow = {
      transactionId: string; orderNumber: string; customer: string;
      gateway: string; originalAmount: number; refundAmount: number;
      currency: string; status: string; refundedAt: string;
    };

    const refData: RefRow[] = refunds.map((r) => ({
      transactionId: r.id,
      orderNumber: r.order.orderNumber,
      customer: r.order.user ? `${r.order.user.firstName} ${r.order.user.lastName}`.trim() : 'Guest',
      gateway: r.gateway,
      originalAmount: Number(r.amount),
      refundAmount: r.refundAmount ? Number(r.refundAmount) : 0,
      currency: r.currencyCode,
      status: r.status,
      refundedAt: r.refundedAt ? new Date(r.refundedAt).toLocaleDateString('en-IN') : '—',
    }));

    const refTitle = `Finance Refunds — ${period}`;
    const refColumns: ExportColumn<RefRow>[] = [
      { header: 'Transaction ID', key: 'transactionId' },
      { header: 'Order #', key: 'orderNumber' },
      { header: 'Customer', key: 'customer' },
      { header: 'Gateway', key: 'gateway' },
      { header: 'Original Amount', key: 'originalAmount' },
      { header: 'Refund Amount', key: 'refundAmount' },
      { header: 'Currency', key: 'currency' },
      { header: 'Status', key: 'status' },
      { header: 'Refunded At', key: 'refundedAt' },
    ];
    const typedRefCols = refColumns as ExportColumn<Record<string, unknown>>[];
    if (format === 'excel') return excelResponse(generateExcelXML(refData, typedRefCols, refTitle), filename);
    if (format === 'pdf') return pdfHtmlResponse(generatePDFHtml(refData, typedRefCols, refTitle), filename);
    if (format === 'print') return new Response(generatePDFHtml(refData, typedRefCols, refTitle), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    return csvResponse(generateCSV(refData, typedRefCols), filename);
  } catch (err) {
    console.error('[Finance Export] Error:', err);
    return serverError('Failed to export finance data');
  }
}
