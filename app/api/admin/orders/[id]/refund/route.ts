// ============================================================
// BLENDIFY — Admin: Process Refund
// POST /api/admin/orders/[id]/refund
//
// Security:
//   - Admin RBAC required (ADMIN or SUPER_ADMIN)
//   - Validates order exists and is paid
//   - Validates refund amount server-side
//   - Prevents refund exceeding refundable balance
//   - Creates Razorpay refund server-side only
//   - Never trusts client-provided amounts without validation
//   - AuditLog for all refund events
//   - Customer email on success (non-blocking)
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { razorpay, toPaise } from '@/lib/services/razorpay';
import { sendRefundConfirmationEmail } from '@/lib/services/email.service';
import { z } from 'zod';

// ── Request Schema ────────────────────────────────────────────

const RefundBodySchema = z.object({
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(3).max(500).default('Customer refund request'),
  returnRequestId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// ── Helper ────────────────────────────────────────────────────

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ── POST Handler ──────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // ── Step 1: Admin RBAC ────────────────────────────────────
    const adminUser = await requireAdminAccess();

    // ── Step 2: Get order ID from route ───────────────────────
    const params = await context.params;
    const orderId = params.id;

    if (!orderId) {
      return err('Order ID is required.', 400);
    }

    // ── Step 3: Parse & validate body ─────────────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err('Invalid request body.');
    }

    const parseResult = RefundBodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid refund data', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { amount: requestedAmount, reason, returnRequestId, notes } = parseResult.data;

    // ── Step 4: Load Order and Payment ───────────────────────
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          where: { gateway: 'RAZORPAY', status: { in: ['PAID', 'PARTIALLY_REFUNDED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        user: { select: { email: true, firstName: true } },
      },
    });

    if (!order) {
      return err('Order not found.', 404);
    }

    const payment = order.payments[0];

    if (!payment) {
      return err('No paid Razorpay payment found for this order. Only Razorpay orders can be refunded through this interface.', 400);
    }

    if (!payment.gatewayPaymentId) {
      return err('Payment does not have a Razorpay payment ID. Cannot process refund.', 400);
    }

    // ── Step 5: Validate refund amount ────────────────────────
    const totalPaid = Number(payment.amount);
    const alreadyRefunded = Number(payment.refundAmount ?? 0);
    const refundableBalance = totalPaid - alreadyRefunded;

    if (requestedAmount > refundableBalance) {
      return err(
        `Refund amount (₹${requestedAmount.toFixed(2)}) exceeds refundable balance (₹${refundableBalance.toFixed(2)}).`,
        400,
      );
    }

    if (requestedAmount <= 0) {
      return err('Refund amount must be greater than zero.', 400);
    }

    // ── Step 6: Create Razorpay refund server-side ────────────
    let razorpayRefund: { id: string; amount?: number; status: string };
    try {
      razorpayRefund = await razorpay.payments.refund(
        payment.gatewayPaymentId,
        {
          amount: toPaise(requestedAmount), // Razorpay requires paise
          speed: 'normal',
          notes: {
            reason,
            admin: adminUser.email,
            order_number: order.orderNumber,
            ...(notes ? { admin_notes: notes.substring(0, 200) } : {}),
          },
        },
      );
    } catch (razorpayErr) {
      console.error('[AdminRefund] Razorpay refund creation failed:', razorpayErr);

      // AuditLog the failure
      prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          userEmail: adminUser.email,
          action: 'REFUND_FAILED',
          module: 'payments',
          entityId: payment.id,
          entityLabel: order.orderNumber,
          after: {
            error: 'Razorpay refund creation failed',
            orderId,
            requestedAmount,
          },
        },
      }).catch(() => { /* non-blocking */ });

      return err('Failed to create refund at payment gateway. Please try again.', 502);
    }

    // ── Step 7: Update Payment + Order in DB ─────────────────
    const now = new Date();
    const newTotalRefunded = alreadyRefunded + requestedAmount;
    const isFullRefund = newTotalRefunded >= totalPaid;

    await prisma.$transaction(async (tx) => {
      // Update Payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundId: razorpayRefund.id,
          refundAmount: newTotalRefunded,
          refundedAt: now,
          status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          metadata: {
            ...(typeof payment.metadata === 'object' && payment.metadata !== null
              ? payment.metadata as object
              : {}),
            refund_id: razorpayRefund.id,
            refund_amount: requestedAmount,
            refund_reason: reason,
            refunded_by_admin: adminUser.email,
            refunded_at: now.toISOString(),
          },
        },
      });

      // Update Order status
      if (isFullRefund) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'REFUNDED',
            status: 'REFUNDED',
          },
        });
        await tx.orderTimeline.create({
          data: {
            orderId,
            status: 'REFUNDED',
            message: `Full refund of ₹${requestedAmount.toFixed(2)} processed by admin.`,
            isPublic: true,
          },
        });
      } else {
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'PARTIALLY_REFUNDED' },
        });
        await tx.orderTimeline.create({
          data: {
            orderId,
            status: 'REFUND_INITIATED',
            message: `Partial refund of ₹${requestedAmount.toFixed(2)} processed.`,
            isPublic: true,
          },
        });
      }

      // Update ReturnRequest if linked
      if (returnRequestId) {
        await tx.returnRequest.update({
          where: { id: returnRequestId },
          data: {
            status: isFullRefund ? 'COMPLETED' : 'REFUND_INITIATED',
            refundAmount: requestedAmount,
            resolvedAt: isFullRefund ? now : undefined,
            adminNote: notes ?? reason,
          },
        });
      }
    });

    // ── Step 8: AuditLog ─────────────────────────────────────
    prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        userEmail: adminUser.email,
        action: isFullRefund ? 'REFUND_COMPLETED' : 'REFUND_INITIATED',
        module: 'payments',
        entityId: payment.id,
        entityLabel: order.orderNumber,
        after: {
          razorpayRefundId: razorpayRefund.id,
          refundAmount: requestedAmount,
          totalRefunded: newTotalRefunded,
          reason,
          isFullRefund,
          processedAt: now.toISOString(),
        },
      },
    }).catch(() => { /* non-blocking */ });

    // ── Step 9: Send refund email (non-blocking) ──────────────
    if (order.user?.email) {
      sendRefundConfirmationEmail({
        to: order.user.email,
        firstName: order.user.firstName ?? 'Valued Customer',
        orderNumber: order.orderNumber,
        refundAmount: requestedAmount,
        currencyCode: payment.currencyCode,
        processedAt: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      }).catch(() => { /* non-blocking */ });
    }

    // ── Step 10: Return safe response ────────────────────────
    return NextResponse.json({
      success: true,
      message: `Refund of ₹${requestedAmount.toFixed(2)} processed successfully.`,
      refundId: razorpayRefund.id,
      refundAmount: requestedAmount,
      totalRefunded: newTotalRefunded,
      refundableBalance: refundableBalance - requestedAmount,
      isFullRefund,
    });
  } catch (err) {
    console.error('[AdminRefund] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
