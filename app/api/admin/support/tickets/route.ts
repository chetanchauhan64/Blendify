// ============================================================
// BLENDIFY — Support Tickets List API
// GET /api/admin/support/tickets
//
// Server-side search, filtering, pagination, sorting.
// Never returns passwords, hashes, tokens, or secrets.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, serverError, badRequest } from '@/lib/utils/api';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  status: z.enum(['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED']).default('ALL'),
  priority: z.enum(['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('ALL'),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status', 'ticketNumber']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }

    const { page, limit, search, status, priority, category, assignedTo, dateFrom, dateTo, sortBy, order } = parseResult.data;

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
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, tickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          category: true,
          priority: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
          orderId: true,
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          order: {
            select: { id: true, orderNumber: true },
          },
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const data = tickets.map(t => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      customerName: `${t.user.firstName} ${t.user.lastName}`,
      customerEmail: t.user.email,
      customerId: t.user.id,
      assignedTo: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : null,
      assignedToId: t.assignedTo?.id || null,
      orderNumber: t.order?.orderNumber || null,
      orderId: t.orderId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      resolvedAt: t.resolvedAt,
    }));

    return ok(data, {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) throw error;
    console.error('[Support Tickets]', error);
    return serverError('Failed to load support tickets');
  }
}
