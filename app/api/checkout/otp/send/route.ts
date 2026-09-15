// ============================================================
// BLENDIFY — Checkout: Send Phone OTP
// POST /api/checkout/otp/send
//
// Security:
//   - Customer session required
//   - Phone validated server-side (E.164 format)
//   - OTP is 6-digit cryptographically random
//   - OTP hashed with bcrypt before DB storage (never stored plaintext)
//   - OTP NOT returned in response
//   - OTP NOT logged
//   - Rate limited: 1 request per phone per 60 seconds
//   - 5-minute expiry
//
// OTP Delivery:
//   - The project uses Resend for email. No SMS provider is configured.
//   - This implementation uses Resend to send the OTP via email as a
//     temporary channel until an SMS provider (e.g., MSG91, Twilio) is added.
//   - The API is provider-ready: replace the sendOtpViaEmail() call with
//     sendOtpViaSms() once an SMS gateway is connected.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// ── Config ────────────────────────────────────────────────────
const OTP_EXPIRY_SECONDS = 5 * 60;          // 5 minutes
const RATE_LIMIT_SECONDS = 60;               // 1 OTP per phone per minute
const OTP_LENGTH = 6;
const BCRYPT_ROUNDS = 10;

// ── Schema ────────────────────────────────────────────────────
const BodySchema = z.object({
  phone: z.string().min(10).max(15),
});

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ── Generate secure OTP ───────────────────────────────────────
function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = array[0] % 1_000_000;
  return String(num).padStart(OTP_LENGTH, '0');
}

// ── Normalize phone to E.164 ──────────────────────────────────
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  // India: 10 digits → +91XXXXXXXXXX
  if (digits.length === 10) return `+91${digits}`;
  // Already has country code: 12 digits starting with 91
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  // E.164 already: e.g. +919876543210
  if (raw.startsWith('+') && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

// ── Send OTP via email (temporary — replace with SMS provider) ─
async function sendOtpViaEmail(to: string, otp: string, phone: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[OTP Send] RESEND_API_KEY not set — skipping email delivery.');
    return;
  }
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'support@blendify.in';
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #E8D8C8;">
      <h2 style="color: #2C1008; font-size: 22px; margin-bottom: 8px;">Verify your phone number</h2>
      <p style="color: #5C3520; margin-bottom: 24px;">Enter this code to verify your mobile number <strong>${phone}</strong>:</p>
      <div style="background: #F5E6D3; border-radius: 8px; padding: 20px; text-align: center; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #581312; font-family: monospace;">
        ${otp}
      </div>
      <p style="color: #8B6555; font-size: 13px; margin-top: 20px;">This code expires in 5 minutes. Do not share it with anyone.</p>
      <p style="color: #8B6555; font-size: 13px;">If you did not request this, please ignore this email.</p>
    </div>
  `;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `BLENDIFY <${fromEmail}>`,
      to,
      subject: `Your BLENDIFY verification code: ${otp}`,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('[OTP Send] Email delivery failed:', res.status, body);
  }
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
      return err('Valid phone number is required.');
    }

    // ── Normalize phone ───────────────────────────────────────
    const normalized = normalizePhone(parsed.data.phone);
    if (!normalized) {
      return err('Please enter a valid 10-digit Indian mobile number.');
    }

    // ── Rate limiting: 1 OTP per phone per 60 seconds ─────────
    const rateLimitCutoff = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000);
    const recentOtp = await prisma.phoneOtp.findFirst({
      where: {
        phone: normalized,
        createdAt: { gt: rateLimitCutoff },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const secondsAgo = Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000);
      const waitSeconds = RATE_LIMIT_SECONDS - secondsAgo;
      return NextResponse.json(
        { success: false, error: `Please wait ${waitSeconds} seconds before requesting another OTP.` },
        { status: 429 },
      );
    }

    // ── Generate OTP ──────────────────────────────────────────
    const otp = generateOtp();

    // ── Hash OTP before storing ───────────────────────────────
    const codeHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);

    // ── Store in DB ───────────────────────────────────────────
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
    await prisma.phoneOtp.create({
      data: {
        phone: normalized,
        codeHash,
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    // ── Send OTP to the user's email (until SMS provider added) ─
    // Load user email for delivery
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user?.email) {
      // Non-blocking — don't fail the request if email sending fails
      sendOtpViaEmail(user.email, otp, normalized).catch((e) => {
        console.error('[OTP Send] Email delivery failed:', e);
      });
    }

    // ── Return safe response (NO OTP in response) ─────────────
    return NextResponse.json({
      success: true,
      phone: normalized,
      expiresIn: OTP_EXPIRY_SECONDS,
      // NOTE: In production with SMS provider, OTP is sent to phone.
      // Currently sent to account email as backup channel.
      channel: 'email', // Change to 'sms' once SMS provider is configured
    });
  } catch {
    console.error('[OTP Send] Unexpected error');
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP. Please try again.' },
      { status: 500 },
    );
  }
}
