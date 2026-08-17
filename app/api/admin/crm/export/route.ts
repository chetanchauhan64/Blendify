// ============================================================
// BLENDIFY — CRM Export API
// GET /api/admin/crm/export
//
// Query params:
//   format   : csv|excel|pdf|print
//   section  : customers|segments|overview
//   segment  : all|new|active|inactive|high_value|repeat|one_time|no_purchase|loyalty|referral
//   status   : all|active|suspended
//   search   : optional search term
//
// Uses existing lib/utils/export.ts utilities.
// Creates an AuditLog entry for every export.
// Never exports passwords, JWTs, hashes, or secrets.
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
import { Prisma } from '@prisma/client';

const QuerySchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf', 'print']),
  section: z.enum(['customers', 'segments', 'overview']).default('customers'),
  segment: z.enum(['all', 'new', 'active', 'inactive', 'high_value', 'repeat', 'one_time', 'no_purchase', 'loyalty', 'referral']).default('all'),
  status: z.enum(['all', 'active', 'suspended']).default('all'),
  search: z.string().optional(),
});

const REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }

    const { format, section, segment, status, search } = parseResult.data;
    const now = new Date();
    const filename = `crm-${section}-${now.toISOString().slice(0, 10)}`;

    // Audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          action: 'EXPORT',
          module: 'crm',
          entityId: section,
          entityLabel: `CRM ${section} export (${format})`,
          after: { format, section, segment, status, search: search ?? '' },
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch { /* non-critical */ }

    // ── CUSTOMERS EXPORT ────────────────────────────────────────
    if (section === 'customers') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);

      const where: Prisma.UserWhereInput = { role: 'CUSTOMER' };
      if (status === 'active') where.isActive = true;
      if (status === 'suspended') where.isActive = false;

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

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

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          loyaltyPoints: true,
          loyaltyTier: true,
          referralCode: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { referrals: true } },
          orders: {
            where: { status: { in: REVENUE_STATUSES as never[] } },
            select: { total: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });

      type CustomerRow = {
        customerId: string; name: string; email: string; phone: string;
        status: string; joinedDate: string; lastLogin: string;
        ordersCount: number; totalSpent: number; aov: number;
        loyaltyTier: string; loyaltyPoints: number; referrals: number;
      };

      let rows: CustomerRow[] = users.map((u) => {
        const orderCount = u.orders.length;
        const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.total), 0);
        const aov = orderCount > 0 ? totalSpent / orderCount : 0;
        return {
          customerId: u.id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          email: u.email,
          phone: u.phone ?? '—',
          status: u.isActive ? 'Active' : 'Suspended',
          joinedDate: new Date(u.createdAt).toLocaleDateString('en-IN'),
          lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN') : '—',
          ordersCount: orderCount,
          totalSpent: Math.round(totalSpent * 100) / 100,
          aov: Math.round(aov * 100) / 100,
          loyaltyTier: u.loyaltyTier,
          loyaltyPoints: u.loyaltyPoints,
          referrals: u._count.referrals,
        };
      });

      if (segment === 'high_value') rows = rows.filter(r => r.totalSpent >= 10000);
      if (segment === 'repeat') rows = rows.filter(r => r.ordersCount >= 2);
      if (segment === 'one_time') rows = rows.filter(r => r.ordersCount === 1);

      const title = `CRM Customers — ${segment.toUpperCase()} (${status})`;
      const columns: ExportColumn<CustomerRow>[] = [
        { header: 'Customer ID', key: 'customerId' },
        { header: 'Name', key: 'name' },
        { header: 'Email', key: 'email' },
        { header: 'Phone', key: 'phone' },
        { header: 'Status', key: 'status' },
        { header: 'Joined Date', key: 'joinedDate' },
        { header: 'Last Login', key: 'lastLogin' },
        { header: 'Orders Count', key: 'ordersCount' },
        { header: 'Total Spent (INR)', key: 'totalSpent' },
        { header: 'AOV (INR)', key: 'aov' },
        { header: 'Loyalty Tier', key: 'loyaltyTier' },
        { header: 'Loyalty Points', key: 'loyaltyPoints' },
        { header: 'Referrals Count', key: 'referrals' },
      ];

      const typedCols = columns as ExportColumn<Record<string, unknown>>[];
      if (format === 'excel') return excelResponse(generateExcelXML(rows, typedCols, title), filename);
      if (format === 'pdf') return pdfHtmlResponse(generatePDFHtml(rows, typedCols, title), filename);
      if (format === 'print') return new Response(generatePDFHtml(rows, typedCols, title), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      return csvResponse(generateCSV(rows, typedCols), filename);
    }

    // ── SEGMENTS EXPORT ─────────────────────────────────────────
    if (section === 'segments') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);

      const [allC, newC, activeC, inactiveC, noPurC, loyC, refC] = await Promise.all([
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: thirtyDaysAgo } } }),
        prisma.user.count({ where: { role: 'CUSTOMER', orders: { some: { createdAt: { gte: sixtyDaysAgo }, status: { in: REVENUE_STATUSES as never[] } } } } }),
        prisma.user.count({ where: { role: 'CUSTOMER', orders: { none: { createdAt: { gte: ninetyDaysAgo }, status: { in: REVENUE_STATUSES as never[] } } } } }),
        prisma.user.count({ where: { role: 'CUSTOMER', orders: { none: { status: { in: REVENUE_STATUSES as never[] } } } } }),
        prisma.user.count({ where: { role: 'CUSTOMER', OR: [{ loyaltyPoints: { gt: 0 } }, { loyaltyTier: { in: ['SILVER', 'GOLD', 'PLATINUM'] } }] } }),
        prisma.user.count({ where: { role: 'CUSTOMER', referrals: { some: {} } } }),
      ]);

      type SegmentRow = { segment: string; count: number; description: string };
      const segData: SegmentRow[] = [
        { segment: 'All Customers', count: allC, description: 'Total registered customer accounts' },
        { segment: 'New Customers', count: newC, description: 'Registered in the last 30 days' },
        { segment: 'Active Customers', count: activeC, description: 'Placed an order in the last 60 days' },
        { segment: 'Inactive Customers', count: inactiveC, description: 'No orders placed in 90+ days' },
        { segment: 'No Purchase', count: noPurC, description: 'Registered but zero completed orders' },
        { segment: 'Loyalty Members', count: loyC, description: 'Has positive points or tiered status' },
        { segment: 'Referral Champions', count: refC, description: 'Has successfully referred 1+ users' },
      ];

      const segTitle = `CRM Customer Segments — ${now.toISOString().slice(0, 10)}`;
      const segCols: ExportColumn<SegmentRow>[] = [
        { header: 'Segment Name', key: 'segment' },
        { header: 'Customer Count', key: 'count' },
        { header: 'Definition / Description', key: 'description' },
      ];

      const typedCols = segCols as ExportColumn<Record<string, unknown>>[];
      if (format === 'excel') return excelResponse(generateExcelXML(segData, typedCols, segTitle), filename);
      if (format === 'pdf') return pdfHtmlResponse(generatePDFHtml(segData, typedCols, segTitle), filename);
      if (format === 'print') return new Response(generatePDFHtml(segData, typedCols, segTitle), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      return csvResponse(generateCSV(segData, typedCols), filename);
    }

    return badRequest('Invalid export section');
  } catch (err) {
    console.error('[CRM Export] Error:', err);
    return serverError('Failed to export CRM data');
  }
}
