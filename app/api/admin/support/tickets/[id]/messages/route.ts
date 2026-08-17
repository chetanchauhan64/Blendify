// ============================================================
// BLENDIFY — Support Ticket Messages API
// POST /api/admin/support/tickets/[id]/messages
//
// Add ADMIN_REPLY, CUSTOMER_REPLY, or INTERNAL_NOTE.
// Internal notes are NEVER emailed to customers.
// Customer replies use existing Resend integration if configured.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, notFound, serverError, badRequest } from '@/lib/utils/api';
import { z } from 'zod';

const isResendConfigured =
  !!process.env.RESEND_API_KEY &&
  !process.env.RESEND_API_KEY.startsWith('REPLACE');

const MessageSchema = z.object({
  type: z.enum(['CUSTOMER_REPLY', 'ADMIN_REPLY', 'INTERNAL_NOTE']),
  body: z.string().min(1, 'Message body is required').max(10000),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdminAccess();
    const { id } = await context.params;

    const body = await req.json();
    const parseResult = MessageSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest('Invalid message data', parseResult.error.flatten().fieldErrors);
    }

    const { type, body: messageBody } = parseResult.data;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: {
        id: true, ticketNumber: true, subject: true, status: true, firstResponseAt: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!ticket) return notFound('Ticket not found');

    const isInternal = type === 'INTERNAL_NOTE';

    // Create message
    const message = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        senderId: admin.id,
        senderEmail: admin.email,
        senderName: `${admin.firstName} ${admin.lastName}`,
        type,
        body: messageBody,
        isInternal,
      },
      select: {
        id: true, senderName: true, senderEmail: true, type: true,
        body: true, isInternal: true, createdAt: true,
      },
    });

    // Update ticket: first response time + status
    const ticketUpdate: Record<string, unknown> = {};
    if (!ticket.firstResponseAt && (type === 'ADMIN_REPLY' || type === 'CUSTOMER_REPLY')) {
      ticketUpdate.firstResponseAt = new Date();
    }
    if (type === 'ADMIN_REPLY' && ticket.status === 'OPEN') {
      ticketUpdate.status = 'IN_PROGRESS';
    }
    if (Object.keys(ticketUpdate).length > 0) {
      await prisma.supportTicket.update({ where: { id }, data: ticketUpdate });
    }

    // Send email for non-internal messages if Resend is configured
    let emailSent = false;
    if (!isInternal && type === 'ADMIN_REPLY' && isResendConfigured) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL ?? 'support@blendify.in',
            to: [ticket.user.email],
            subject: `Re: ${ticket.subject} [#${ticket.ticketNumber}]`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #581312;">Support Update — #${ticket.ticketNumber}</h2>
                <p>Hi ${ticket.user.firstName},</p>
                <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #581312;">
                  ${messageBody.replace(/\n/g, '<br>')}
                </div>
                <p style="color: #666; font-size: 12px;">This is a reply to your support ticket #${ticket.ticketNumber}.</p>
              </div>
            `,
          }),
        });
        emailSent = response.ok;
      } catch {
        // Email failure is non-critical — ticket message still saved
        console.error('[Support] Failed to send email reply');
      }
    }

    // AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          action: 'CREATE',
          module: 'support',
          entityId: id,
          entityLabel: `${isInternal ? 'Internal note' : 'Reply'} on ticket ${ticket.ticketNumber}`,
          after: { type, isInternal, emailSent },
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch { /* non-critical */ }

    return ok({ ...message, emailSent });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) throw error;
    console.error('[Support Message]', error);
    return serverError('Failed to add message');
  }
}
