// ============================================================
// BLENDIFY — Support Export API
// GET /api/admin/support/export
//
// Formats: csv, excel, pdf, print
// Reuses lib/utils/export.ts
// Respects all active filters.
// Max 5000 records. AuditLog on every export.
// Never exports passwords, hashes, tokens, or secrets.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { serverError, badRequest } from '@/lib/utils/api';
import {
  generateCSV, csvResponse,
  generateExcelXML, excelResponse,
  generatePDFHtml, pdfHtmlResponse,
  formatDateTime,
  type ExportColumn,
} from '@/lib/utils/export';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const QuerySchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf', 'print']),
  search: z.string().optional(),
  status: z.enum(['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED']).default('ALL'),
  priority: z.enum(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('ALL'),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

type TicketExport = {
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  customerName: string;
  customerEmail: string;
  assignedTo: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string;
};

const EXPORT_COLUMNS: ExportColumn<TicketExport>[] = [
  { header: 'Ticket #', key: 'ticketNumber' },
  { header: 'Subject', key: 'subject' },
  { header: 'Category', key: 'category' },
  { header: 'Priority', key: 'priority' },
  { header: 'Status', key: 'status' },
  { header: 'Customer', key: 'customerName' },
  { header: 'Email', key: 'customerEmail' },
  { header: 'Assigned To', key: 'assignedTo' },
  { header: 'Order #', key: 'orderNumber' },
  { header: 'Created', key: 'createdAt' },
  { header: 'Updated', key: 'updatedAt' },
  { header: 'Resolved', key: 'resolvedAt' },
];

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }

    const { format, search, status, priority, category, assignedTo, dateFrom, dateTo } = parseResult.data;

    const where: Prisma.SupportTicketWhereInput = {};
    if (status !== 'ALL') where.status = status as Prisma.EnumSupportTicketStatusFilter;
    if (priority !== 'ALL') where.priority = priority as Prisma.EnumSupportTicketPriorityFilter;
    if (category && category !== 'ALL') where.category = category;
    if (assignedTo && assignedTo !== 'ALL') {
      if (assignedTo === 'UNASSIGNED') {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedTo;
      }
    }
    if (dateFrom) where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter || {}), gte: new Date(dateFrom) };
    if (dateTo) {
      const existing = (where.createdAt as Prisma.DateTimeFilter) || {};
      where.createdAt = { ...existing, lte: new Date(new Date(dateTo).getTime() + 86400000) };
    }
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      select: {
        ticketNumber: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        order: { select: { orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const data: TicketExport[] = tickets.map(t => ({
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      customerName: `${t.user.firstName} ${t.user.lastName}`,
      customerEmail: t.user.email,
      assignedTo: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : '—',
      orderNumber: t.order?.orderNumber ?? '—',
      createdAt: formatDateTime(t.createdAt),
      updatedAt: formatDateTime(t.updatedAt),
      resolvedAt: formatDateTime(t.resolvedAt),
    }));

    const now = new Date();
    const filename = `support-tickets-${now.toISOString().slice(0, 10)}`;

    // AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          action: 'EXPORT',
          module: 'support',
          entityId: 'tickets',
          entityLabel: `Support tickets export (${format}) — ${data.length} records`,
          after: { format, status, priority, category: category ?? 'ALL', search: search ?? '', recordCount: data.length },
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch { /* non-critical */ }

    switch (format) {
      case 'csv':
        return csvResponse(generateCSV(data, EXPORT_COLUMNS), filename);
      case 'excel':
        return excelResponse(generateExcelXML(data, EXPORT_COLUMNS, 'Support Tickets'), filename);
      case 'pdf':
      case 'print':
        return pdfHtmlResponse(generatePDFHtml(data, EXPORT_COLUMNS, 'Blendify — Support Tickets'), filename);
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) throw error;
    console.error('[Support Export]', error);
    return serverError('Failed to export support tickets');
  }
}
