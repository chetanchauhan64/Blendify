// ============================================================
// BLENDIFY — Payment: Verify Razorpay Signature
// POST /api/payment/verify
//
// Security:
//   - Customer session required
//   - Order ownership verified (order.userId === session.userId)
//   - Razorpay signature verified with HMAC-SHA256
//   - Payment marked PAID only after successful verification
//   - Idempotent: duplicate calls for already-PAID payments are safe
//   - AuditLog entry on success and failure
//   - Confirmation email on success (non-blocking)
//   - RAZORPAY_KEY_SECRET never returned to client
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';
import { verifyPaymentSignature } from '@/lib/services/razorpay';
import {
  sendOrderConfirmationEmail,
  sendPaymentConfirmationEmail,
} from '@/lib/services/email.service';
import { RazorpayVerifySchema } from '@/lib/validations/schemas';

// ── Helper ────────────────────────────────────────────────────

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ── POST Handler ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Step 1: Authenticate customer ────────────────────────
    const session = await getSession();
    if (!session?.userId) {
      return err('Authentication required.', 401);
    }
    const userId = session.userId;

    // ── Step 2: Parse & validate body ─────────────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err('Invalid request body.');
    }

    const parseResult = RazorpayVerifySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment data', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = parseResult.data;

    // ── Step 3: Load Payment by gatewayOrderId ────────────────
    const payment = await prisma.payment.findFirst({
      where: {
        gatewayOrderId: razorpay_order_id,
        gateway: 'RAZORPAY',
      },
      include: {
        order: {
          include: {
            user: { select: { email: true, firstName: true } },
            items: { select: { quantity: true } },
          },
        },
      },
    });

    if (!payment) {
      await prisma.auditLog.create({
        data: {
          userId,
          userEmail: session.email,
          action: 'PAYMENT_VERIFICATION_FAILED',
          module: 'payments',
          entityId: orderId,
          entityLabel: 'Unknown',
          after: { reason: 'Payment record not found', razorpayOrderId: razorpay_order_id },
        },
      }).catch(() => { /* non-blocking */ });

      return err('Payment record not found.', 404);
    }

    // ── Step 4: Verify order ownership ───────────────────────
    if (payment.order.userId !== userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          userEmail: session.email,
          action: 'PAYMENT_VERIFICATION_FAILED',
          module: 'payments',
          entityId: payment.orderId,
          entityLabel: payment.order.orderNumber,
          after: { reason: 'Ownership mismatch — order belongs to different user' },
        },
      }).catch(() => { /* non-blocking */ });

      return err('Access denied.', 403);
    }

    // ── Step 5: Confirm Payment belongs to correct Order ─────
    if (payment.orderId !== orderId) {
      return err('Payment does not match the specified order.', 400);
    }

    // ── Step 6: Idempotency — already verified? ───────────────
    if (payment.status === 'PAID') {
      // Already verified — return success safely
      return NextResponse.json({
        success: true,
        orderNumber: payment.order.orderNumber,
        status: 'PAID',
      });
    }

    // ── Step 7: Verify Razorpay HMAC-SHA256 signature ────────
    let signatureValid: boolean;
    try {
      signatureValid = verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
    } catch {
      signatureValid = false;
    }

    if (!signatureValid) {
      // AuditLog the failure
      await prisma.auditLog.create({
        data: {
          userId,
          userEmail: session.email,
          action: 'PAYMENT_VERIFICATION_FAILED',
          module: 'payments',
          entityId: payment.orderId,
          entityLabel: payment.order.orderNumber,
          after: {
            reason: 'Invalid Razorpay signature',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
          },
        },
      }).catch(() => { /* non-blocking */ });

      // Update payment to FAILED
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureCode: 'INVALID_SIGNATURE',
          failureReason: 'Razorpay payment signature verification failed.',
        },
      });

      return err('Payment verification failed. Invalid signature.', 403);
    }

    // ── Step 8: Prevent payment ID reuse across orders ────────
    const existingPaymentWithId = await prisma.payment.findFirst({
      where: {
        gatewayPaymentId: razorpay_payment_id,
        id: { not: payment.id },
      },
    });
    if (existingPaymentWithId) {
      return err('Payment ID has already been used.', 409);
    }

    // ── Step 9: Update Payment + Order atomically ─────────────
    const now = new Date();
    const [updatedPayment, updatedOrder] = await prisma.$transaction(async (tx) => {
      // Mark payment as PAID
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          gatewayPaymentId: razorpay_payment_id,
          gatewaySignature: razorpay_signature,
          paidAt: now,
          metadata: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            verified_at: now.toISOString(),
          },
        },
      });

      // Move order to CONFIRMED with paymentStatus PAID
      const o = await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        },
      });

      // Add order timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId: payment.orderId,
          status: 'CONFIRMED',
          message: 'Payment received and confirmed. Your order is being prepared.',
          isPublic: true,
          metadata: {
            gateway: 'RAZORPAY',
            razorpayPaymentId: razorpay_payment_id,
            paidAt: now.toISOString(),
          },
        },
      });

      // Award loyalty points (if not already awarded)
      const loyaltyPointsToAward = payment.order.loyaltyPointsEarned ?? 0;
      if (loyaltyPointsToAward > 0) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { loyaltyPoints: true },
        });
        if (user) {
          const newBalance = user.loyaltyPoints + loyaltyPointsToAward;
          await tx.user.update({
            where: { id: userId },
            data: { loyaltyPoints: newBalance },
          });
          await tx.loyaltyTransaction.create({
            data: {
              userId,
              type: 'EARNED_PURCHASE',
              points: loyaltyPointsToAward,
              balance: newBalance,
              description: `Points earned for order #${payment.order.orderNumber}`,
              orderId: payment.orderId,
            },
          });
        }
      }

      // Record CouponUsage if coupon was applied
      if (payment.order.couponId) {
        const existingUsage = await tx.couponUsage.findFirst({
          where: { couponId: payment.order.couponId, orderId: payment.orderId },
        });
        if (!existingUsage) {
          await tx.couponUsage.create({
            data: {
              couponId: payment.order.couponId,
              userId,
              orderId: payment.orderId,
            },
          });
          // Increment coupon use count
          await tx.coupon.update({
            where: { id: payment.order.couponId },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      return [p, o];
    });

    // ── Step 10: AuditLog ─────────────────────────────────────
    prisma.auditLog.create({
      data: {
        userId,
        userEmail: session.email,
        action: 'PAYMENT_VERIFIED',
        module: 'payments',
        entityId: updatedPayment.id,
        entityLabel: payment.order.orderNumber,
        after: {
          paymentId: updatedPayment.id,
          razorpayPaymentId: razorpay_payment_id,
          amount: Number(updatedPayment.amount),
          currency: updatedPayment.currencyCode,
          paidAt: now.toISOString(),
          orderStatus: updatedOrder.status,
          paymentStatus: updatedPayment.status,
        },
      },
    }).catch(() => { /* non-blocking */ });

    // ── Step 11: Send confirmation emails (non-blocking) ─────
    const customerEmail = payment.order.user?.email ?? session.email;
    const customerName = payment.order.user?.firstName ?? session.firstName;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://blendify.coffee';
    const orderUrl = `${appUrl}/account/orders`;

    sendOrderConfirmationEmail({
      to: customerEmail,
      firstName: customerName,
      orderNumber: payment.order.orderNumber,
      orderTotal: Number(payment.amount),
      currencyCode: payment.currencyCode,
      itemCount: payment.order.items.reduce((sum, i) => sum + i.quantity, 0),
      orderUrl,
    }).catch(() => { /* non-blocking */ });

    sendPaymentConfirmationEmail({
      to: customerEmail,
      firstName: customerName,
      orderNumber: payment.order.orderNumber,
      amountPaid: Number(payment.amount),
      currencyCode: payment.currencyCode,
      gateway: 'Razorpay',
      paidAt: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      orderUrl,
    }).catch(() => { /* non-blocking */ });

    // ── Step 12: Return safe response ────────────────────────
    return NextResponse.json({
      success: true,
      orderNumber: payment.order.orderNumber,
      status: 'PAID',
      orderStatus: updatedOrder.status,
    });
  } catch (error) {
    console.error('[PaymentVerify] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please contact support.' },
      { status: 500 },
    );
  }
}
