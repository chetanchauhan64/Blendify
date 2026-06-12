// ============================================================
// BLENDIFY — Newsletter Subscription API
// POST /api/newsletter
// ============================================================

import { NextResponse } from 'next/server';
import { z } from 'zod';

const SubscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().optional(),
  source: z.string().default('website'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email, firstName, source } = parsed.data;

    // ── When DB is connected, use the newsletter service ──
    // const dbReady = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('REPLACE');
    // if (dbReady) {
    //   const { newsletterService } = await import('@/lib/services/newsletter.service');
    //   const result = await newsletterService.subscribe({ email, firstName, source });
    //   if (result.status === 'already_subscribed') {
    //     return NextResponse.json({ success: true, status: 'already_subscribed' });
    //   }
    //   return NextResponse.json({ success: true, status: 'subscribed' });
    // }

    // ── Dev fallback: log and acknowledge ─────────────────
    console.log(`[Newsletter] Subscribe request: ${email} (source: ${source}, name: ${firstName ?? 'unknown'})`);

    // Simulate a small delay so the UX feels real
    await new Promise((r) => setTimeout(r, 300));

    return NextResponse.json({ success: true, status: 'subscribed' });
  } catch (err) {
    console.error('[Newsletter] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
