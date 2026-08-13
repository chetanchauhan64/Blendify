// ============================================================
// BLENDIFY — Analytics Export API
// GET /api/admin/analytics/export
//
// Query params: same as overview + format (csv|excel|pdf|print)
//
// Requires analytics.export permission (admin role).
// Logs export action to audit log.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import {
  generateCSV, generateExcelXML, generatePDFHtml,
  csvResponse, excelResponse, pdfHtmlResponse,
  type ExportColumn,
} from '@/lib/utils/export';
import { badRequest } from '@/lib/utils/api';
import { z } from 'zod';

const REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const QuerySchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf', 'print']).default('csv'),
  section: z.enum(['overview', 'products', 'categories']).default('overview'),
  period: z.enum(['today', 'yesterday', 'last7', 'last30', 'last90', 'thisMonth', 'prevMonth', 'thisYear', 'custom']).default('last30'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  categoryId: z.string().optional(),
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
  const user = await requireAdminAccess();

  const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parseResult = QuerySchema.safeParse(raw);
  if (!parseResult.success) {
    return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
  }
  const { format, section, period, dateFrom, dateTo, categoryId } = parseResult.data;
  const { from, to } = getPeriodDates(period, dateFrom, dateTo);
  const now = new Date();
  const filename = `analytics-${section}-${now.toISOString().slice(0, 10)}`;

  // Log the export action
  try {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'EXPORT',
        module: 'analytics',
        entityId: section,
        entityLabel: `Analytics ${section} export (${period})`,
        after: { format, period, dateFrom: from.toISOString(), dateTo: to.toISOString() },
        ip: req.headers.get('x-forwarded-for') ?? '',
        userAgent: req.headers.get('user-agent') ?? '',
      },
    });
  } catch { /* non-critical */ }

  // ── OVERVIEW EXPORT ──────────────────────────────────────────
  if (section === 'overview') {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lt: to } },
      select: {
        orderNumber: true, status: true, paymentStatus: true,
        subtotal: true, discount: true, tax: true, shippingCost: true, total: true,
        currencyCode: true, createdAt: true,
        user: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    type OverviewRow = {
      orderNumber: string; customerName: string; email: string;
      status: string; paymentStatus: string; subtotal: number;
      discount: number; tax: number; shipping: number; total: number;
      currency: string; date: string;
    };

    const data: OverviewRow[] = orders.map((o) => ({
      orderNumber: o.orderNumber,
      customerName: o.user ? `${o.user.firstName} ${o.user.lastName}`.trim() : 'Guest',
      email: o.user?.email ?? '',
      status: o.status,
      paymentStatus: o.paymentStatus,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      tax: Number(o.tax),
      shipping: Number(o.shippingCost),
      total: Number(o.total),
      currency: o.currencyCode,
      date: new Date(o.createdAt).toLocaleDateString('en-IN'),
    }));

    const title = `Analytics Overview — ${period}`;
    const columns: ExportColumn<OverviewRow>[] = [
      { header: 'Order #', key: 'orderNumber' },
      { header: 'Customer', key: 'customerName' },
      { header: 'Email', key: 'email' },
      { header: 'Status', key: 'status' },
      { header: 'Payment', key: 'paymentStatus' },
      { header: 'Subtotal', key: 'subtotal' },
      { header: 'Discount', key: 'discount' },
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

  // ── PRODUCTS EXPORT ──────────────────────────────────────────
  if (section === 'products') {
    const grouped = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalPrice: true },
      where: {
        order: { createdAt: { gte: from, lt: to }, status: { in: REVENUE_STATUSES as never[] } },
      },
    });

    const productIds = grouped.map((g) => g.productId);
    const products = productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds }, ...(categoryId ? { categoryId } : {}) },
          select: { id: true, name: true, slug: true, category: { select: { name: true } } },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    type ProductRow = { name: string; category: string; units: number; revenue: number };
    const data: ProductRow[] = grouped
      .filter((g) => productMap.has(g.productId))
      .map((g) => {
        const p = productMap.get(g.productId)!;
        return { name: p.name, category: p.category?.name ?? 'Uncategorized', units: Number(g._sum?.quantity ?? 0), revenue: Number(g._sum?.totalPrice ?? 0) };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const title = `Product Analytics — ${period}`;
    const columns: ExportColumn<ProductRow>[] = [
      { header: 'Product', key: 'name' },
      { header: 'Category', key: 'category' },
      { header: 'Units Sold', key: 'units' },
      { header: 'Revenue', key: 'revenue' },
    ];
    const typedCols = columns as ExportColumn<Record<string, unknown>>[];
    if (format === 'excel') return excelResponse(generateExcelXML(data, typedCols, title), filename);
    if (format === 'pdf') return pdfHtmlResponse(generatePDFHtml(data, typedCols, title), filename);
    if (format === 'print') return new Response(generatePDFHtml(data, typedCols, title), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    return csvResponse(generateCSV(data, typedCols), filename);
  }

  // ── CATEGORIES EXPORT ────────────────────────────────────────
  const itemsByProduct = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, totalPrice: true },
    where: { order: { createdAt: { gte: from, lt: to }, status: { in: REVENUE_STATUSES as never[] } } },
  });

  const productIds = itemsByProduct.map((g) => g.productId);
  const products = productIds.length > 0
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, categoryId: true } })
    : [];
  const productCategoryMap = new Map(products.map((p) => [p.id, p.categoryId]));

  const catMap = new Map<string, { name: string; units: number; revenue: number }>();
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const catNameMap = new Map(categories.map((c) => [c.id, c.name]));

  for (const item of itemsByProduct) {
    const catId = productCategoryMap.get(item.productId) ?? 'Uncategorized';
    const catName = catId !== 'Uncategorized' ? (catNameMap.get(catId) ?? 'Unknown') : 'Uncategorized';
    const existing = catMap.get(catId) ?? { name: catName, units: 0, revenue: 0 };
    catMap.set(catId, { name: catName, units: existing.units + Number(item._sum?.quantity ?? 0), revenue: existing.revenue + Number(item._sum?.totalPrice ?? 0) });
  }

  type CategoryRow = { category: string; units: number; revenue: number };
  const catData: CategoryRow[] = Array.from(catMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .map((c) => ({ category: c.name, units: c.units, revenue: c.revenue }));

  const catTitle = `Category Analytics — ${period}`;
  const catColumns: ExportColumn<CategoryRow>[] = [
    { header: 'Category', key: 'category' },
    { header: 'Units Sold', key: 'units' },
    { header: 'Revenue', key: 'revenue' },
  ];
  const typedCatCols = catColumns as ExportColumn<Record<string, unknown>>[];
  if (format === 'excel') return excelResponse(generateExcelXML(catData, typedCatCols, catTitle), filename);
  if (format === 'pdf') return pdfHtmlResponse(generatePDFHtml(catData, typedCatCols, catTitle), filename);
  if (format === 'print') return new Response(generatePDFHtml(catData, typedCatCols, catTitle), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  return csvResponse(generateCSV(catData, typedCatCols), filename);
}
