// ============================================================
// BLENDIFY — Checkout: Verify Phone OTP
// POST /api/checkout/otp/verify
//
// Security:
//   - Customer session required
//   - OTP compared using bcrypt (timing-safe)
//   - Attempt counter increments on every invalid attempt
//   - Locked after 5 failed attempts
//   - Never verifiable after expiry
//   - Phone number never trusted from client — normalized server-side
//   - Marks User.phoneVerified = true on success
//   - Returns NO OTP, NO hash, NO internal IDs
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// ── Config ────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;

// ── Schema ────────────────────────────────────────────────────
const BodySchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6).regex(/^\d{6}$/),
});

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ── Normalize phone to E.164 ──────────────────────────────────
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (raw.startsWith('+') && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

// ── POST Handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── Authenticate ─────────────────────────────────────────
    const session = await getSession();
    if (!session?.userId) {
      return err('Authentication required.', 401);
    }
    const userId = session.userId;

    // ── Parse & validate body ─────────────────────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err('Invalid request body.');
    }

    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return err('Valid phone number and 6-digit code are required.');
    }

    // ── Normalize phone ───────────────────────────────────────
    const normalized = normalizePhone(parsed.data.phone);
    if (!normalized) {
      return err('Invalid phone number format.');
    }
    const { code } = parsed.data;

    // ── Find latest unverified OTP for this phone ─────────────
    const otpRecord = await prisma.phoneOtp.findFirst({
      where: {
        phone: normalized,
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return err('No OTP found for this number. Please request a new one.');
    }

    // ── Check expiry ──────────────────────────────────────────
    if (otpRecord.expiresAt < new Date()) {
      return err('OTP has expired. Please request a new one.', 410);
    }

    // ── Check attempt limit ───────────────────────────────────
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return err(
        'Too many incorrect attempts. Please request a new OTP.',
        429,
      );
    }

    // ── Verify OTP with bcrypt (timing-safe) ──────────────────
    const isValid = await bcrypt.compare(code, otpRecord.codeHash);

    if (!isValid) {
      // Increment attempt count
      await prisma.phoneOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      const attemptsLeft = MAX_ATTEMPTS - (otpRecord.attempts + 1);
      return NextResponse.json(
        {
          success: false,
          error:
            attemptsLeft > 0
              ? `Incorrect OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`
              : 'Too many incorrect attempts. Please request a new OTP.',
        },
        { status: 422 },
      );
    }

    // ── OTP verified — mark as used ───────────────────────────
    await prisma.$transaction([
      // Mark OTP as verified
      prisma.phoneOtp.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      }),
      // Update user's phone and phoneVerified status
      prisma.user.update({
        where: { id: userId },
        data: {
          phone: normalized,
          phoneVerified: true,
        },
      }),
    ]);

    // ── Return safe success response ──────────────────────────
    return NextResponse.json({
      success: true,
      phone: normalized,
      message: 'Phone number verified successfully.',
    });
  } catch {
    console.error('[OTP Verify] Unexpected error');
    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again.' },
      { status: 500 },
    );
  }
}
