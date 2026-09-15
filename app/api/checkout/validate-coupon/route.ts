// ============================================================
// BLENDIFY — Checkout: Real-time Coupon Validation
// POST /api/checkout/validate-coupon
//
// Security:
//   - Customer session required
//   - Cart subtotal calculated server-side from DB (never trusted from client)
//   - Reuses existing couponRepository.findValid()
//   - Returns discount amount computed server-side
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';
import { couponRepository } from '@/lib/db/repositories';
import { z } from 'zod';

const BodySchema = z.object({
  code: z.string().min(1).max(50).transform((s) => s.trim().toUpperCase()),
});

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // ── Step 1: Auth ─────────────────────────────────────────
    const session = await getSession();
    if (!session?.userId) {
      return err('Authentication required.', 401);
    }
    const userId = session.userId;

    // ── Step 2: Parse body ───────────────────────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err('Invalid request body.');
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return err('Invalid coupon code.');
    }
    const { code } = parsed.data;

    // ── Step 3: Load cart from DB (server-side subtotal) ─────
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

    // ── Step 4: Calculate subtotal server-side ───────────────
    let subtotal = 0;
    for (const item of cart.items) {
      const price =
        item.isSubscription && item.variant.product.subscriptionPrice
          ? Number(item.variant.product.subscriptionPrice)
          : Number(item.variant.price);
      subtotal += price * item.quantity;
    }

    // ── Step 5: Validate coupon via existing repository ──────
    const { valid, error: couponError, coupon } = await couponRepository.findValid(code, userId);

    if (!valid || !coupon) {
      // Map internal error messages to user-friendly ones
      let userMessage = 'Invalid or expired coupon code.';
      if (couponError === 'Coupon not found') userMessage = 'Coupon code not found.';
      else if (couponError === 'Coupon is not active') userMessage = 'This coupon is no longer active.';
      else if (couponError === 'Coupon not yet valid') userMessage = 'This coupon is not valid yet.';
      else if (couponError === 'Coupon has expired') userMessage = 'This coupon has expired.';
      else if (couponError === 'Coupon usage limit reached') userMessage = 'This coupon has reached its usage limit.';
      else if (couponError === 'You have already used this coupon') userMessage = 'You have already used this coupon.';

      return NextResponse.json({ success: false, error: userMessage }, { status: 422 });
    }

    // ── Step 6: Check minimum order amount ───────────────────
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json({
        success: false,
        error: `Minimum order of ₹${Number(coupon.minOrderAmount).toFixed(0)} required for this coupon. Your cart is ₹${subtotal.toFixed(0)}.`,
      }, { status: 422 });
    }

    // ── Step 7: Calculate discount server-side ───────────────
    // Free shipping base
    const shippingCost = subtotal >= 2499 ? 0 : 99;

    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (subtotal * Number(coupon.value)) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
      }
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(Number(coupon.value), subtotal);
    } else if (coupon.type === 'FREE_SHIPPING') {
      discountAmount = shippingCost;
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    // ── Step 8: Return safe response ─────────────────────────
    return NextResponse.json({
      success: true,
      code: coupon.code,
      discountType: coupon.type,
      discountAmount,
      message:
        coupon.type === 'FREE_SHIPPING'
          ? `Free shipping applied! You saved ₹${discountAmount.toFixed(0)}.`
          : `Coupon applied! You saved ₹${discountAmount.toFixed(0)}.`,
      description: coupon.description ?? undefined,
    });
  } catch {
    console.error('[ValidateCoupon] Unexpected error');
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
