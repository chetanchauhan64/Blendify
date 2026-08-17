// ============================================================
// BLENDIFY — Payment: Create Razorpay Order
// POST /api/payment/create-order
//
// Security:
//   - Customer session required (JWT httpOnly cookie)
//   - userId always from authenticated session — never from body
//   - All pricing calculated server-side
//   - Coupon validated server-side
//   - Loyalty points validated server-side
//   - Stock validated server-side
//   - Address ownership validated server-side
//   - RAZORPAY_KEY_SECRET never reaches the browser
//   - Returns only minimum info required by Razorpay Checkout
//
// Idempotency:
//   - FIRST checks if an existing PENDING order + Payment with a
//     valid gatewayOrderId already exists for this user.
//   - If found, returns the existing Razorpay order — does NOT
//     create a new order or deduct stock again.
//   - This prevents duplicate orders and duplicate stock deductions.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';
import { orderService } from '@/lib/services/order.service';
import { razorpay, toPaise } from '@/lib/services/razorpay';
import { z } from 'zod';

// ── Request Schema ────────────────────────────────────────────

const CreateOrderBodySchema = z.object({
  shippingAddressId: z.string().min(1),
  billingAddressId: z.string().optional(),
  couponCode: z.string().optional(),
  loyaltyPointsToUse: z.number().int().min(0).default(0),
  notes: z.string().max(500).optional(),
  currencyCode: z.string().length(3).default('INR'),
});

// ── Helper: safe error response ───────────────────────────────

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ── POST Handler ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Step 1: Authenticate customer ────────────────────────
    const session = await getSession();
    if (!session?.userId) {
      return err('Authentication required. Please sign in to continue.', 401);
    }
    const userId = session.userId;

    // ── Step 2: Parse & validate request body ────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err('Invalid request body.');
    }

    const parseResult = CreateOrderBodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const {
      shippingAddressId,
      billingAddressId,
      couponCode,
      loyaltyPointsToUse,
      notes,
      currencyCode,
    } = parseResult.data;

    // ── Step 3: Validate shipping address ownership ──────────
    const address = await prisma.address.findFirst({
      where: { id: shippingAddressId, userId },
    });
    if (!address) {
      return err('Shipping address not found or does not belong to your account.', 403);
    }

    if (billingAddressId) {
      const billingAddr = await prisma.address.findFirst({
        where: { id: billingAddressId, userId },
      });
      if (!billingAddr) {
        return err('Billing address not found or does not belong to your account.', 403);
      }
    }

    // ── Step 4: Load cart from DB ─────────────────────────────
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        coupon: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      return err('Your cart is empty. Add items before checking out.');
    }

    // ── Step 5: Validate all cart items (stock, availability) ──
    for (const cartItem of cart.items) {
      const variant = cartItem.variant;
      const product = variant.product;

      if (!variant.isActive) {
        return err(`Product variant "${variant.name}" is no longer available.`);
      }
      if (product.status !== 'ACTIVE') {
        return err(`Product "${product.name}" is no longer available.`);
      }
      if (variant.stock < cartItem.quantity) {
        return err(`Insufficient stock for "${product.name} — ${variant.name}". Only ${variant.stock} left.`);
      }
    }

    // Build items array for pricing
    const items = cart.items.map((ci) => ({
      productId: ci.productId,
      variantId: ci.variantId,
      quantity: ci.quantity,
      isSubscription: ci.isSubscription,
      subscriptionFrequency: ci.subscriptionFrequency ?? undefined,
    }));

    // ── Step 6: Validate loyalty points ──────────────────────
    if (loyaltyPointsToUse > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
      });
      if (!user || user.loyaltyPoints < loyaltyPointsToUse) {
        return err('Insufficient loyalty points.');
      }
    }

    // ── Step 7: Server-side pricing (never trust the client) ──
    const effectiveCouponCode =
      couponCode ?? cart.coupon?.code ?? undefined;
    const effectiveLoyaltyPoints =
      loyaltyPointsToUse > 0 ? loyaltyPointsToUse : cart.loyaltyUsed;

    const pricing = await orderService.calculatePricing(items, {
      couponCode: effectiveCouponCode,
      loyaltyPointsToUse: effectiveLoyaltyPoints,
      userId,
    });

    // ── Step 8: Idempotency — check for existing PENDING order ─
    // Before creating anything, check if this user already has a
    // PENDING order with a valid Razorpay payment attached.
    // This prevents duplicate orders + duplicate stock deductions
    // when the checkout page is submitted more than once.
    const existingPendingPayment = await prisma.payment.findFirst({
      where: {
        gateway: 'RAZORPAY',
        status: 'PENDING',
        gatewayOrderId: { not: null },
        order: {
          userId,
          status: 'PENDING',
        },
      },
      include: {
        order: { select: { id: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPendingPayment?.gatewayOrderId) {
      // Return the existing Razorpay order — do NOT create a duplicate
      return NextResponse.json({
        success: true,
        razorpayOrderId: existingPendingPayment.gatewayOrderId,
        amount: toPaise(Number(existingPendingPayment.amount)),
        currency: existingPendingPayment.currencyCode,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        orderId: existingPendingPayment.order.id,
        orderNumber: existingPendingPayment.order.orderNumber,
      });
    }

    // ── Step 9: Create Blendify order ─────────────────────────
    // Stock deduction happens atomically inside createOrder().
    const order = await orderService.createOrder(userId, {
      items,
      shippingAddressId,
      billingAddressId: billingAddressId ?? shippingAddressId,
      paymentGateway: 'RAZORPAY',
      couponCode: effectiveCouponCode,
      loyaltyPointsToUse: effectiveLoyaltyPoints,
      notes,
      currencyCode,
    });

    // ── Step 10: Create Razorpay order ────────────────────────
    // Amount MUST be from server-side calculation — never from client
    const amountInPaise = toPaise(pricing.total);
    let razorpayOrder: { id: string; amount: number | string; currency: string };
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          blendify_order_id: order.id,
          blendify_order_number: order.orderNumber,
          customer_id: userId,
        },
      });
    } catch (razorpayErr) {
      // Razorpay order creation failed — do NOT mark order as paid.
      // The Blendify order remains PENDING; it can be cancelled later
      // via a cleanup job or admin action.
      console.error('[PaymentCreateOrder] Razorpay order creation failed:', razorpayErr);

      // AuditLog the failure
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            userEmail: session.email,
            action: 'PAYMENT_ORDER_FAILED',
            module: 'payments',
            entityId: order.id,
            entityLabel: order.orderNumber,
            after: {
              error: 'Razorpay order creation failed',
              orderId: order.id,
            },
          },
        });
      } catch { /* non-blocking */ }

      return err('Payment gateway error. Please try again or contact support.', 502);
    }

    // ── Step 11: Create Payment record in DB ──────────────────
    await prisma.payment.create({
      data: {
        orderId: order.id,
        gateway: 'RAZORPAY',
        status: 'PENDING',
        amount: pricing.total,
        currencyCode: 'INR',
        gatewayOrderId: razorpayOrder.id,
      },
    });

    // ── Step 12: AuditLog ─────────────────────────────────────
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          userEmail: session.email,
          action: 'PAYMENT_ORDER_CREATED',
          module: 'payments',
          entityId: order.id,
          entityLabel: order.orderNumber,
          after: {
            razorpayOrderId: razorpayOrder.id,
            amount: pricing.total,
            currency: 'INR',
            gateway: 'RAZORPAY',
          },
        },
      });
    } catch { /* non-blocking */ }

    // ── Step 13: Return safe response (no secrets) ────────────
    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: toPaise(pricing.total),
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    // NEVER expose stack traces, secrets, or DB internals to the client
    console.error('[PaymentCreateOrder] Unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
