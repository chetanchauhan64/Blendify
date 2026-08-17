// ============================================================
// BLENDIFY — Single Support Ticket API
// GET /api/admin/support/tickets/[id]  — full ticket context
// PUT /api/admin/support/tickets/[id]  — update ticket fields
//
// Never returns passwords, hashes, tokens, or secrets.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, notFound, serverError, badRequest } from '@/lib/utils/api';
import { z } from 'zod';

const SUPPORT_CATEGORIES = ['ORDER', 'PAYMENT', 'SHIPPING', 'RETURN', 'REFUND', 'PRODUCT', 'ACCOUNT', 'TECHNICAL', 'GENERAL'];

const UpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.string().refine(v => SUPPORT_CATEGORIES.includes(v), { message: 'Invalid category' }).optional(),
  assignedToId: z.string().nullable().optional(),
}).refine(data => Object.values(data).some(v => v !== undefined), { message: 'At least one field required' });

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess();
    const { id } = await context.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        description: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        firstResponseAt: true,
        resolvedAt: true,
        closedAt: true,
        orderId: true,
        assignedToId: true,
        userId: true,
        user: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            avatar: true, isActive: true, loyaltyPoints: true, loyaltyTier: true, createdAt: true,
          },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        order: {
          select: {
            id: true, orderNumber: true, status: true, paymentStatus: true,
            total: true, currencyCode: true, createdAt: true,
            items: { select: { productName: true, quantity: true, totalPrice: true }, take: 10 },
          },
        },
        messages: {
          select: {
            id: true, senderName: true, senderEmail: true, type: true,
            body: true, isInternal: true, createdAt: true,
            sender: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) return notFound('Ticket not found');

    // Get customer's recent orders and previous tickets for context
    const [recentOrders, previousTickets, returnRequests] = await Promise.all([
      prisma.order.findMany({
        where: { userId: ticket.userId },
        select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.supportTicket.findMany({
        where: { userId: ticket.userId, id: { not: ticket.id } },
        select: { id: true, ticketNumber: true, subject: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.returnRequest.findMany({
        where: { userId: ticket.userId },
        select: { id: true, status: true, reason: true, refundAmount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return ok({
      ...ticket,
      customerContext: {
        recentOrders,
        previousTickets,
        returnRequests,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) throw error;
    console.error('[Support Ticket GET]', error);
    return serverError('Failed to load ticket');
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminAccess();
    const { id } = await context.params;

    const body = await req.json();
    const parseResult = UpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest('Invalid data', parseResult.error.flatten().fieldErrors);
    }

    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) return notFound('Ticket not found');

    const data = parseResult.data;
    const updateData: Record<string, unknown> = {};
    const auditChanges: Record<string, { from: unknown; to: unknown }> = {};

    // Status change
    if (data.status && data.status !== existing.status) {
      updateData.status = data.status;
      auditChanges.status = { from: existing.status, to: data.status };

      if (data.status === 'RESOLVED' && !existing.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      if (data.status === 'CLOSED' && !existing.closedAt) {
        updateData.closedAt = new Date();
      }
      // Reopening
      if (['OPEN', 'IN_PROGRESS'].includes(data.status) && ['RESOLVED', 'CLOSED'].includes(existing.status)) {
        updateData.resolvedAt = null;
        updateData.closedAt = null;
      }
    }

    // Priority change
    if (data.priority && data.priority !== existing.priority) {
      updateData.priority = data.priority;
      auditChanges.priority = { from: existing.priority, to: data.priority };
    }

    // Category change
    if (data.category && data.category !== existing.category) {
      updateData.category = data.category;
      auditChanges.category = { from: existing.category, to: data.category };
    }

    // Staff assignment
    if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) {
      if (data.assignedToId !== null) {
        // Validate staff exists and has admin/support role
        const staffUser = await prisma.user.findUnique({
          where: { id: data.assignedToId },
          select: { id: true, role: true, isActive: true },
        });
        if (!staffUser) return badRequest('Staff user not found');
        if (!staffUser.isActive) return badRequest('Staff user is not active');
        if (!['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(staffUser.role)) {
          return badRequest('User does not have a staff role');
        }
      }
      updateData.assignedToId = data.assignedToId;
      auditChanges.assignedTo = { from: existing.assignedToId, to: data.assignedToId };
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest('No changes to apply');
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      select: {
        id: true, ticketNumber: true, status: true, priority: true,
        category: true, assignedToId: true, updatedAt: true, resolvedAt: true, closedAt: true,
      },
    });

    // AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          action: 'UPDATE',
          module: 'support',
          entityId: id,
          entityLabel: `Ticket ${existing.ticketNumber}`,
          before: JSON.parse(JSON.stringify(auditChanges)),
          after: JSON.parse(JSON.stringify(updateData)),
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch { /* non-critical */ }

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) throw error;
    console.error('[Support Ticket PUT]', error);
    return serverError('Failed to update ticket');
  }
}
