// ============================================================
// BLENDIFY — Checkout: Shipping Calculation
// POST /api/checkout/shipping
//
// Security:
//   - Customer session required
//   - Address ownership verified (userId match)
//   - Cart subtotal calculated server-side from DB
//   - Shipping amount is NEVER trusted from client
//   - Delivery date dynamically computed from today + configured days
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const BodySchema = z.object({
  addressId: z.string().min(1),
});

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Shipping configuration — aligned with order.service.ts
const SHIPPING_CONFIG = {
  FREE_THRESHOLD: 2499,   // Free shipping above this subtotal (INR)
  SHIPPING_COST: 99,      // Standard shipping cost (INR)
  PROCESSING_DAYS: 1,     // Days to process order before dispatch
  TRANSIT_DAYS_MIN: 3,    // Minimum transit days
  TRANSIT_DAYS_MAX: 5,    // Maximum transit days
};

function getDeliveryRange(today: Date = new Date()): {
  minDate: Date;
  maxDate: Date;
  estimatedDate: Date;
} {
  const minDaysTotal = SHIPPING_CONFIG.PROCESSING_DAYS + SHIPPING_CONFIG.TRANSIT_DAYS_MIN;
  const maxDaysTotal = SHIPPING_CONFIG.PROCESSING_DAYS + SHIPPING_CONFIG.TRANSIT_DAYS_MAX;

  const minDate = new Date(today);
  minDate.setDate(today.getDate() + minDaysTotal);

  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + maxDaysTotal);

  // Skip Sundays (index 0) for both min and max
  while (minDate.getDay() === 0) minDate.setDate(minDate.getDate() + 1);
  while (maxDate.getDay() === 0) maxDate.setDate(maxDate.getDate() + 1);

  // Estimated = between min and max, prefer the earlier
  const estimatedDate = minDate;

  return { minDate, maxDate, estimatedDate };
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────
    const session = await getSession();
    if (!session?.userId) {
      return err('Authentication required.', 401);
    }
    const userId = session.userId;

    // ── Parse body ───────────────────────────────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err('Invalid request body.');
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return err('Address ID is required.');
    }
    const { addressId } = parsed.data;

    // ── Verify address ownership ──────────────────────────────
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
      include: { country: { select: { shippingZone: true } } },
    });

    if (!address) {
      return err('Address not found or does not belong to your account.', 403);
    }

    // ── Load cart and calculate subtotal server-side ──────────
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return err('Your cart is empty.');
    }

    let subtotal = 0;
    for (const item of cart.items) {
      const price =
        item.isSubscription && item.variant.product.subscriptionPrice
          ? Number(item.variant.product.subscriptionPrice)
          : Number(item.variant.price);
      subtotal += price * item.quantity;
    }

    // ── Calculate shipping ────────────────────────────────────
    const isFreeShipping = subtotal >= SHIPPING_CONFIG.FREE_THRESHOLD;
    const shippingAmount = isFreeShipping ? 0 : SHIPPING_CONFIG.SHIPPING_COST;

    // ── Calculate delivery dates ──────────────────────────────
    const now = new Date();
    const { minDate, maxDate, estimatedDate } = getDeliveryRange(now);

    const deliveryMessage = isFreeShipping
      ? `Free delivery by ${formatDateShort(estimatedDate)}`
      : `Standard delivery by ${formatDateShort(estimatedDate)}`;

    const amountNeededForFreeShipping = isFreeShipping
      ? 0
      : Math.max(0, SHIPPING_CONFIG.FREE_THRESHOLD - subtotal);

    return NextResponse.json({
      success: true,
      shippingAmount,
      isFreeShipping,
      amountNeededForFreeShipping: Math.round(amountNeededForFreeShipping * 100) / 100,
      estimatedDeliveryDate: estimatedDate.toISOString(),
      estimatedDeliveryDateMin: minDate.toISOString(),
      estimatedDeliveryDateMax: maxDate.toISOString(),
      deliveryMessage,
      deliveryDateFormatted: formatDateShort(estimatedDate),
      deliveryDateRangeFormatted: `${formatDateShort(minDate)} – ${formatDateShort(maxDate)}`,
    });
  } catch {
    console.error('[Shipping] Unexpected error');
    return NextResponse.json(
      { success: false, error: 'Failed to calculate shipping. Please try again.' },
      { status: 500 },
    );
  }
}
