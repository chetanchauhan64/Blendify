// ============================================================
// BLENDIFY — Admin API: SEO Settings & Meta Tags
// ============================================================
import { NextResponse } from 'next/server';
import { getSeoSettings, updateSeoSettings } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    const seo = await getSeoSettings();
    return NextResponse.json({ success: true, data: seo });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateSeoSettings(body);
    return NextResponse.json({ success: true, data: updated, message: 'SEO settings saved' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
