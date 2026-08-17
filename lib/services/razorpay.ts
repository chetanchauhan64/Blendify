// ============================================================
// BLENDIFY — Razorpay Service (server-only)
// Singleton Razorpay SDK client.
// NEVER import this in client components.
// RAZORPAY_KEY_SECRET must never reach the browser.
// ============================================================
import 'server-only';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// ── Singleton ─────────────────────────────────────────────────

let _razorpay: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  if (_razorpay) return _razorpay;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      '[Blendify] Razorpay environment variables are not configured. ' +
      'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.'
    );
  }

  _razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return _razorpay;
}

export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    const client = getRazorpayClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// ── Signature Verification ────────────────────────────────────

/**
 * Verify Razorpay payment signature (used in /api/payment/verify).
 * Signature = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 */
export function verifyPaymentSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('[Blendify] RAZORPAY_KEY_SECRET is not configured.');
  }

  const body = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(params.razorpay_signature, 'hex'),
    Buffer.from(expectedSignature, 'hex'),
  );
}

/**
 * Verify Razorpay webhook signature.
 * Signature = HMAC-SHA256(rawBody, webhook_secret)
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('[Blendify] RAZORPAY_WEBHOOK_SECRET is not configured.');
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  // Use constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  } catch {
    // Buffer lengths may differ if signature is malformed
    return false;
  }
}

/**
 * Convert INR amount (decimal) to Razorpay paise (integer).
 * Razorpay requires amounts in the smallest currency unit.
 */
export function toPaise(amountInRupees: number): number {
  return Math.round(amountInRupees * 100);
}

/**
 * Convert Razorpay paise to INR decimal.
 */
export function fromPaise(paise: number): number {
  return paise / 100;
}
