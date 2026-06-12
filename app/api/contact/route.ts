// ============================================================
// BLENDIFY — Contact Form API
// POST /api/contact
// ============================================================

import { NextResponse } from 'next/server';
import { z } from 'zod';

const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  orderNumber: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { name, email, subject, message, orderNumber } = parsed.data;

    // ── When email is configured, send via SMTP/Resend ────
    // const emailReady = !!process.env.SMTP_HOST && !!process.env.CONTACT_EMAIL;
    // if (emailReady) {
    //   await sendContactEmail({ name, email, subject, message, orderNumber });
    // }

    // ── Dev fallback: log submission ──────────────────────
    console.log('[Contact] Form submission:', {
      name,
      email,
      subject,
      message: message.substring(0, 100),
      orderNumber,
      receivedAt: new Date().toISOString(),
    });

    // Simulate processing time
    await new Promise((r) => setTimeout(r, 400));

    return NextResponse.json({
      success: true,
      message: "Thank you for reaching out! We'll get back to you within 24 hours.",
    });
  } catch (err) {
    console.error('[Contact] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
