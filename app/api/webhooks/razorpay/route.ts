// ============================================================
// BLENDIFY — Razorpay Webhook Handler
// POST /api/webhooks/razorpay
//
// Security:
//   - Raw body MUST be read before any JSON parsing
//   - Webhook signature verified with HMAC-SHA256
//   - RAZORPAY_WEBHOOK_SECRET never exposed
//   - No customer authentication (webhooks are server-to-server)
//   - Idempotent: duplicate events are safe
//   - AuditLog for all meaningful events
//   - Emails sent non-blocking
//
// Supported events:
//   payment.captured  — mark order PAID (backup to /verify)
//   payment.failed    — mark payment FAILED
//   refund.created    — record refund initiation
//   refund.processed  — mark refund complete
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, fromPaise } from '@/lib/services/razorpay';
import { prisma } from '@/lib/db/prisma';
import {
  sendPaymentFailureEmail,
  sendRefundConfirmationEmail,
} from '@/lib/services/email.service';

// ── Razorpay Webhook Payload Types ────────────────────────────

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number; // in paise
  currency: string;
  status: string;
  error_code?: string;
  error_description?: string;
  error_reason?: string;
  email?: string;
}

interface RazorpayRefundEntity {
  id: string;
  payment_id: string;
  amount: number; // in paise
  currency: string;
  status: string;
}

interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: { entity: RazorpayPaymentEntity };
    refund?: { entity: RazorpayRefundEntity };
  };
}

// ── POST Handler ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Step 1: Read RAW body before ANY parsing ──────────────
  // Razorpay signature verification requires the exact raw body bytes.
  const rawBody = await req.text();

  // ── Step 2: Extract webhook signature ────────────────────
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  if (!signature) {
    await logWebhookRejection('Missing webhook signature', null);
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // ── Step 3: Verify webhook signature (HMAC-SHA256) ────────
  let signatureValid = false;
  try {
    signatureValid = verifyWebhookSignature(rawBody, signature);
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    await logWebhookRejection('Invalid webhook signature', null);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── Step 4: Parse the webhook payload ─────────────────────
  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const event = payload.event;

  // AuditLog: webhook received
  try {
    await prisma.auditLog.create({
      data: {
        userId: null,
        userEmail: 'webhook@razorpay',
        action: 'WEBHOOK_RECEIVED',
        module: 'payments',
        entityId: event,
        entityLabel: event,
        after: { event, accountId: payload.account_id },
      },
    });
  } catch { /* non-blocking */ }

  // ── Step 5: Route events ──────────────────────────────────

  try {
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payload.payment?.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payload.payment?.entity);
        break;

      case 'refund.created':
        await handleRefundCreated(payload.payload.refund?.entity);
        break;

      case 'refund.processed':
      case 'refund.speed_changed':
        await handleRefundProcessed(payload.payload.refund?.entity);
        break;

      default:
        // Unknown event — acknowledge receipt without action
        break;
    }
  } catch (err) {
    console.error(`[RazorpayWebhook] Error handling event "${event}":`, err);
    // Return 200 to prevent Razorpay retries for processing errors
    // (signature was valid; this is an internal error)
    return NextResponse.json({ received: true }, { status: 200 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// ── Event Handlers ────────────────────────────────────────────

/**
 * payment.captured — Payment confirmed by Razorpay.
 * This is a backup for cases where /api/payment/verify was not called
 * (e.g. user closed the browser after payment but before redirect).
 */
async function handlePaymentCaptured(entity?: RazorpayPaymentEntity) {
  if (!entity?.order_id || !entity?.id) return;

  // Find payment by Razorpay order ID
  const payment = await prisma.payment.findFirst({
    where: { gatewayOrderId: entity.order_id, gateway: 'RAZORPAY' },
    include: {
      order: {
        include: {
          user: { select: { email: true, firstName: true } },
          items: { select: { quantity: true } },
        },
      },
    },
  });

  if (!payment) return;

  // Idempotency: already PAID — skip
  if (payment.status === 'PAID') return;

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        gatewayPaymentId: entity.id,
        paidAt: now,
        metadata: {
          event: 'payment.captured',
          razorpay_payment_id: entity.id,
          razorpay_order_id: entity.order_id,
          captured_via: 'webhook',
        },
      },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    });

    await tx.orderTimeline.create({
      data: {
        orderId: payment.orderId,
        status: 'CONFIRMED',
        message: 'Payment captured by payment gateway. Order confirmed.',
        isPublic: true,
        metadata: { gateway: 'RAZORPAY', razorpayPaymentId: entity.id },
      },
    });

    // Award loyalty points if not already awarded
    const earnedPoints = payment.order.loyaltyPointsEarned ?? 0;
    if (earnedPoints > 0 && payment.order.userId) {
      const user = await tx.user.findUnique({
        where: { id: payment.order.userId },
        select: { loyaltyPoints: true },
      });
      // Check: no existing EARNED_PURCHASE transaction for this order
      const existing = await tx.loyaltyTransaction.findFirst({
        where: { orderId: payment.orderId, type: 'EARNED_PURCHASE' },
      });
      if (!existing && user) {
        const newBalance = user.loyaltyPoints + earnedPoints;
        await tx.user.update({
          where: { id: payment.order.userId },
          data: { loyaltyPoints: newBalance },
        });
        await tx.loyaltyTransaction.create({
          data: {
            userId: payment.order.userId,
            type: 'EARNED_PURCHASE',
            points: earnedPoints,
            balance: newBalance,
            description: `Points earned for order #${payment.order.orderNumber}`,
            orderId: payment.orderId,
          },
        });
      }
    }
  });

  // AuditLog
  prisma.auditLog.create({
    data: {
      userId: payment.order.userId ?? null,
      userEmail: payment.order.user?.email ?? 'webhook@razorpay',
      action: 'PAYMENT_CAPTURED_WEBHOOK',
      module: 'payments',
      entityId: payment.id,
      entityLabel: payment.order.orderNumber,
      after: {
        razorpayPaymentId: entity.id,
        amount: fromPaise(entity.amount),
        currency: entity.currency,
      },
    },
  }).catch(() => { /* non-blocking */ });
}

/**
 * payment.failed — Payment failed at gateway.
 */
async function handlePaymentFailed(entity?: RazorpayPaymentEntity) {
  if (!entity?.order_id || !entity?.id) return;

  const payment = await prisma.payment.findFirst({
    where: { gatewayOrderId: entity.order_id, gateway: 'RAZORPAY' },
    include: {
      order: {
        include: {
          user: { select: { email: true, firstName: true } },
        },
      },
    },
  });

  if (!payment) return;

  // Idempotency: already in a terminal state
  if (['PAID', 'FAILED', 'CANCELLED'].includes(payment.status)) return;

  // Safe failure reason — do NOT expose raw gateway errors
  const safeFailureReason = entity.error_description
    ? entity.error_description.substring(0, 200)
    : 'Payment could not be completed.';

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
      gatewayPaymentId: entity.id,
      failureCode: entity.error_code ?? 'PAYMENT_FAILED',
      failureReason: safeFailureReason,
    },
  });

  // AuditLog
  prisma.auditLog.create({
    data: {
      userId: payment.order.userId ?? null,
      userEmail: payment.order.user?.email ?? 'webhook@razorpay',
      action: 'PAYMENT_FAILED',
      module: 'payments',
      entityId: payment.id,
      entityLabel: payment.order.orderNumber,
      after: {
        failureCode: entity.error_code,
        failureReason: safeFailureReason,
        razorpayPaymentId: entity.id,
      },
    },
  }).catch(() => { /* non-blocking */ });

  // Send failure email (non-blocking)
  if (payment.order.user?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://blendify.coffee';
    sendPaymentFailureEmail({
      to: payment.order.user.email,
      firstName: payment.order.user.firstName ?? 'Valued Customer',
      orderNumber: payment.order.orderNumber,
      failureReason: safeFailureReason,
      checkoutUrl: `${appUrl}/checkout`,
    }).catch(() => { /* non-blocking */ });
  }
}

/**
 * refund.created — Refund has been initiated at Razorpay.
 */
async function handleRefundCreated(entity?: RazorpayRefundEntity) {
  if (!entity?.payment_id || !entity?.id) return;

  const payment = await prisma.payment.findFirst({
    where: { gatewayPaymentId: entity.payment_id },
  });

  if (!payment) return;

  // Idempotency: refund already recorded
  if (payment.refundId === entity.id) return;

  const refundAmountInRupees = fromPaise(entity.amount);
  const currentRefunded = Number(payment.refundAmount ?? 0);
  const newTotalRefunded = currentRefunded + refundAmountInRupees;
  const paymentAmount = Number(payment.amount);

  const newStatus = newTotalRefunded >= paymentAmount
    ? 'REFUNDED'
    : 'PARTIALLY_REFUNDED';

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      refundId: entity.id,
      refundAmount: newTotalRefunded,
      status: newStatus,
      metadata: {
        ...(typeof payment.metadata === 'object' && payment.metadata !== null
          ? payment.metadata as object
          : {}),
        refund_id: entity.id,
        refund_status: entity.status,
        refund_initiated_at: new Date().toISOString(),
      },
    },
  });

  prisma.auditLog.create({
    data: {
      userId: null,
      userEmail: 'webhook@razorpay',
      action: 'REFUND_CREATED',
      module: 'payments',
      entityId: payment.id,
      entityLabel: payment.orderId,
      after: {
        razorpayRefundId: entity.id,
        refundAmount: refundAmountInRupees,
        paymentStatus: newStatus,
      },
    },
  }).catch(() => { /* non-blocking */ });
}

/**
 * refund.processed — Refund has been fully settled.
 */
async function handleRefundProcessed(entity?: RazorpayRefundEntity) {
  if (!entity?.payment_id || !entity?.id) return;

  const payment = await prisma.payment.findFirst({
    where: { gatewayPaymentId: entity.payment_id },
    include: {
      order: {
        include: {
          user: { select: { email: true, firstName: true } },
          returnRequests: {
            where: { status: { in: ['APPROVED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED', 'REFUND_INITIATED'] } },
            take: 1,
          },
        },
      },
    },
  });

  if (!payment) return;

  const refundAmountInRupees = fromPaise(entity.amount);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        refundId: entity.id,
        refundAmount: refundAmountInRupees,
        refundedAt: now,
        status: refundAmountInRupees >= Number(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      },
    });

    // Update related ReturnRequest
    if (payment.order.returnRequests[0]) {
      await tx.returnRequest.update({
        where: { id: payment.order.returnRequests[0].id },
        data: {
          status: 'COMPLETED',
          resolvedAt: now,
        },
      });

      // Update Order status to REFUNDED if fully refunded
      if (refundAmountInRupees >= Number(payment.amount)) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'REFUNDED', paymentStatus: 'REFUNDED' },
        });
        await tx.orderTimeline.create({
          data: {
            orderId: payment.orderId,
            status: 'REFUNDED',
            message: 'Refund processed successfully.',
            isPublic: true,
          },
        });
      }
    }
  });

  prisma.auditLog.create({
    data: {
      userId: null,
      userEmail: 'webhook@razorpay',
      action: 'REFUND_COMPLETED',
      module: 'payments',
      entityId: payment.id,
      entityLabel: payment.orderId,
      after: {
        razorpayRefundId: entity.id,
        refundAmount: refundAmountInRupees,
        processedAt: now.toISOString(),
      },
    },
  }).catch(() => { /* non-blocking */ });

  // Send refund email
  if (payment.order.user?.email) {
    sendRefundConfirmationEmail({
      to: payment.order.user.email,
      firstName: payment.order.user.firstName ?? 'Valued Customer',
      orderNumber: payment.order.orderNumber,
      refundAmount: refundAmountInRupees,
      currencyCode: payment.currencyCode,
      processedAt: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    }).catch(() => { /* non-blocking */ });
  }
}

// ── Helper ────────────────────────────────────────────────────

async function logWebhookRejection(reason: string, ip: string | null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: null,
        userEmail: 'webhook@razorpay',
        action: 'WEBHOOK_REJECTED',
        module: 'payments',
        entityId: 'webhook',
        entityLabel: reason,
        after: { reason, ip },
      },
    });
  } catch { /* non-blocking */ }
}
