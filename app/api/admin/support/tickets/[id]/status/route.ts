// ============================================================
// BLENDIFY — Support Ticket Status API
// PUT /api/admin/support/tickets/[id]/status
//
// Dedicated status change endpoint with AuditLog.
// Handles reopening resolved/closed tickets safely.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, notFound, serverError, badRequest } from '@/lib/utils/api';
import { z } from 'zod';

const StatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED']),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminAccess();
    const { id } = await context.params;

    const body = await req.json();
    const parseResult = StatusSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest('Invalid status', parseResult.error.flatten().fieldErrors);
    }

    const { status } = parseResult.data;

    const existing = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, ticketNumber: true, status: true, resolvedAt: true, closedAt: true },
    });

    if (!existing) return notFound('Ticket not found');

    if (existing.status === status) {
      return badRequest(`Ticket is already ${status}`);
    }

    const updateData: Record<string, unknown> = { status };

    // Set timestamps based on status transition
    if (status === 'RESOLVED' && !existing.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (status === 'CLOSED') {
      if (!existing.closedAt) updateData.closedAt = new Date();
      if (!existing.resolvedAt) updateData.resolvedAt = new Date();
    }

    // Reopening: clear resolved/closed timestamps
    if (['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'].includes(status)) {
      if (['RESOLVED', 'CLOSED'].includes(existing.status)) {
        updateData.resolvedAt = null;
        updateData.closedAt = null;
      }
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      select: { id: true, ticketNumber: true, status: true, updatedAt: true, resolvedAt: true, closedAt: true },
    });

    // Create status change message
    try {
      await prisma.supportMessage.create({
        data: {
          ticketId: id,
          senderId: admin.id,
          senderEmail: admin.email,
          senderName: `${admin.firstName} ${admin.lastName}`,
          type: 'STATUS_CHANGE',
          body: `Status changed from ${existing.status} to ${status}`,
          isInternal: true,
        },
      });
    } catch { /* non-critical */ }

    // AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          action: 'UPDATE',
          module: 'support',
          entityId: id,
          entityLabel: `Status change on ticket ${existing.ticketNumber}`,
          before: { status: existing.status },
          after: { status },
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch { /* non-critical */ }

    return ok(updated);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) throw error;
    console.error('[Support Status]', error);
    return serverError('Failed to update ticket status');
  }
}
