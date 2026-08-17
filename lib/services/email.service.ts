// ============================================================
// BLENDIFY — Email Service (Transactional)
// Reuses the existing Resend integration.
// If RESEND_API_KEY is missing, emails are skipped silently.
// Email failure NEVER blocks payment processing.
// NEVER expose secrets in email content.
// ============================================================
import 'server-only';

// ── Types ─────────────────────────────────────────────────────

export interface OrderConfirmationEmailData {
  to: string;
  firstName: string;
  orderNumber: string;
  orderTotal: number;
  currencyCode: string;
  itemCount: number;
  orderUrl: string;
}

export interface PaymentConfirmationEmailData {
  to: string;
  firstName: string;
  orderNumber: string;
  amountPaid: number;
  currencyCode: string;
  gateway: string;
  paidAt: string;
  orderUrl: string;
}

export interface PaymentFailureEmailData {
  to: string;
  firstName: string;
  orderNumber: string;
  failureReason?: string;
  checkoutUrl: string;
}

export interface RefundConfirmationEmailData {
  to: string;
  firstName: string;
  orderNumber: string;
  refundAmount: number;
  currencyCode: string;
  processedAt: string;
}

// ── Resend Sender ─────────────────────────────────────────────

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Silent skip — email failure must not block payment
    console.warn('[EmailService] RESEND_API_KEY not configured. Skipping email.');
    return;
  }

  const from =
    process.env.EMAIL_FROM ?? 'BLENDIFY <no-reply@blendify.coffee>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[EmailService] Resend API error:', res.status, body);
    }
  } catch (err) {
    // Non-blocking: email failure must not affect payment state
    console.error('[EmailService] Failed to send email:', err);
  }
}

// ── Email Helpers ─────────────────────────────────────────────

/**
 * Order successfully confirmed/created.
 * Triggered: after Payment record is created and order is PENDING payment.
 */
export async function sendOrderConfirmationEmail(
  data: OrderConfirmationEmailData,
): Promise<void> {
  const subject = `Order Confirmed — #${data.orderNumber} | BLENDIFY`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="font-family:Inter,Arial,sans-serif;background:#faf9f7;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#581312;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:0.05em;">BLENDIFY</h1>
      <p style="color:#f5c28d;margin:8px 0 0;font-size:13px;">The Art of Coffee</p>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#1a0a00;margin:0 0 8px;">Thank you, ${data.firstName}!</h2>
      <p style="color:#5a4a3a;margin:0 0 24px;">Your order has been received and is being processed.</p>

      <div style="background:#faf9f7;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table width="100%" style="border-collapse:collapse;">
          <tr><td style="color:#7a6a5a;font-size:13px;padding-bottom:8px;">Order Number</td><td style="text-align:right;font-weight:600;color:#1a0a00;">#${data.orderNumber}</td></tr>
          <tr><td style="color:#7a6a5a;font-size:13px;padding-bottom:8px;">Items</td><td style="text-align:right;font-weight:600;color:#1a0a00;">${data.itemCount}</td></tr>
          <tr><td style="color:#7a6a5a;font-size:13px;">Order Total</td><td style="text-align:right;font-weight:700;color:#581312;font-size:18px;">${data.currencyCode} ${data.orderTotal.toFixed(2)}</td></tr>
        </table>
      </div>

      <a href="${data.orderUrl}" style="display:block;background:#581312;color:#fff;text-align:center;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">View Your Order</a>

      <p style="color:#7a6a5a;font-size:12px;margin-top:24px;text-align:center;">
        Questions? Reply to this email or contact us at support@blendify.coffee
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Thank you, ${data.firstName}!\n\nYour BLENDIFY order #${data.orderNumber} has been received.\nOrder Total: ${data.currencyCode} ${data.orderTotal.toFixed(2)}\nItems: ${data.itemCount}\n\nView your order: ${data.orderUrl}\n\nQuestions? Email support@blendify.coffee`;

  await sendEmail({ to: data.to, subject, html, text });
}

/**
 * Payment successfully verified by server.
 * Triggered: after HMAC-SHA256 verification succeeds.
 */
export async function sendPaymentConfirmationEmail(
  data: PaymentConfirmationEmailData,
): Promise<void> {
  const subject = `Payment Confirmed — #${data.orderNumber} | BLENDIFY`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="font-family:Inter,Arial,sans-serif;background:#faf9f7;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1a5c2e;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:0.05em;">BLENDIFY</h1>
      <p style="color:#a8d5b5;margin:8px 0 0;font-size:13px;">Payment Confirmed ✓</p>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#1a0a00;margin:0 0 8px;">Payment received, ${data.firstName}!</h2>
      <p style="color:#5a4a3a;margin:0 0 24px;">Your payment has been successfully verified and your order is being prepared.</p>

      <div style="background:#f0faf3;border:1px solid #a8d5b5;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table width="100%" style="border-collapse:collapse;">
          <tr><td style="color:#7a6a5a;font-size:13px;padding-bottom:8px;">Order Number</td><td style="text-align:right;font-weight:600;color:#1a0a00;">#${data.orderNumber}</td></tr>
          <tr><td style="color:#7a6a5a;font-size:13px;padding-bottom:8px;">Amount Paid</td><td style="text-align:right;font-weight:700;color:#1a5c2e;font-size:18px;">${data.currencyCode} ${data.amountPaid.toFixed(2)}</td></tr>
          <tr><td style="color:#7a6a5a;font-size:13px;padding-bottom:8px;">Payment Method</td><td style="text-align:right;font-weight:600;color:#1a0a00;">${data.gateway}</td></tr>
          <tr><td style="color:#7a6a5a;font-size:13px;">Paid At</td><td style="text-align:right;color:#1a0a00;">${data.paidAt}</td></tr>
        </table>
      </div>

      <a href="${data.orderUrl}" style="display:block;background:#1a5c2e;color:#fff;text-align:center;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">View Order Details</a>

      <p style="color:#7a6a5a;font-size:12px;margin-top:24px;text-align:center;">
        Keep this email as your payment receipt. Order support: support@blendify.coffee
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Payment Confirmed!\n\nHi ${data.firstName},\n\nYour payment for BLENDIFY order #${data.orderNumber} has been confirmed.\nAmount: ${data.currencyCode} ${data.amountPaid.toFixed(2)}\nMethod: ${data.gateway}\nPaid at: ${data.paidAt}\n\nView order: ${data.orderUrl}`;

  await sendEmail({ to: data.to, subject, html, text });
}

/**
 * Payment failed.
 * Triggered: after payment failure event from webhook or verification failure.
 */
export async function sendPaymentFailureEmail(
  data: PaymentFailureEmailData,
): Promise<void> {
  const subject = `Payment Issue — #${data.orderNumber} | BLENDIFY`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="font-family:Inter,Arial,sans-serif;background:#faf9f7;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#7c1e1e;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:0.05em;">BLENDIFY</h1>
      <p style="color:#f5a0a0;margin:8px 0 0;font-size:13px;">Payment Could Not Be Processed</p>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#1a0a00;margin:0 0 8px;">We couldn&apos;t process your payment, ${data.firstName}</h2>
      <p style="color:#5a4a3a;margin:0 0 8px;">Your order #${data.orderNumber} could not be completed due to a payment issue.</p>
      ${data.failureReason ? `<p style="color:#5a4a3a;margin:0 0 24px;">Reason: ${data.failureReason}</p>` : '<p style="color:#5a4a3a;margin:0 0 24px;">Please try again or use a different payment method.</p>'}

      <a href="${data.checkoutUrl}" style="display:block;background:#581312;color:#fff;text-align:center;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Try Again</a>

      <p style="color:#7a6a5a;font-size:12px;margin-top:24px;text-align:center;">
        Need help? Contact us at support@blendify.coffee
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Payment Issue\n\nHi ${data.firstName},\n\nWe could not process your payment for order #${data.orderNumber}.\n${data.failureReason ? `Reason: ${data.failureReason}\n` : ''}Please try again: ${data.checkoutUrl}\n\nHelp: support@blendify.coffee`;

  await sendEmail({ to: data.to, subject, html, text });
}

/**
 * Refund successfully processed.
 * Triggered: after refund is confirmed server-side.
 */
export async function sendRefundConfirmationEmail(
  data: RefundConfirmationEmailData,
): Promise<void> {
  const subject = `Refund Processed — #${data.orderNumber} | BLENDIFY`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="font-family:Inter,Arial,sans-serif;background:#faf9f7;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1a4a6b;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:0.05em;">BLENDIFY</h1>
      <p style="color:#a0c8e0;margin:8px 0 0;font-size:13px;">Refund Processed</p>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#1a0a00;margin:0 0 8px;">Your refund has been processed, ${data.firstName}</h2>
      <p style="color:#5a4a3a;margin:0 0 24px;">The refund for order #${data.orderNumber} has been initiated and will appear in your account within 5–7 business days.</p>

      <div style="background:#f0f6fa;border:1px solid #a0c8e0;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table width="100%" style="border-collapse:collapse;">
          <tr><td style="color:#7a6a5a;font-size:13px;padding-bottom:8px;">Order Number</td><td style="text-align:right;font-weight:600;color:#1a0a00;">#${data.orderNumber}</td></tr>
          <tr><td style="color:#7a6a5a;font-size:13px;padding-bottom:8px;">Refund Amount</td><td style="text-align:right;font-weight:700;color:#1a4a6b;font-size:18px;">${data.currencyCode} ${data.refundAmount.toFixed(2)}</td></tr>
          <tr><td style="color:#7a6a5a;font-size:13px;">Processed</td><td style="text-align:right;color:#1a0a00;">${data.processedAt}</td></tr>
        </table>
      </div>

      <p style="color:#7a6a5a;font-size:12px;margin-top:24px;text-align:center;">
        Questions about your refund? Contact us at support@blendify.coffee
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Refund Processed\n\nHi ${data.firstName},\n\nYour refund for BLENDIFY order #${data.orderNumber} has been processed.\nRefund Amount: ${data.currencyCode} ${data.refundAmount.toFixed(2)}\nProcessed: ${data.processedAt}\n\nAllow 5–7 business days for it to appear in your account.\nHelp: support@blendify.coffee`;

  await sendEmail({ to: data.to, subject, html, text });
}
