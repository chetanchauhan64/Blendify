// ============================================================
// BLENDIFY — Admin API: SEO Settings & Meta Tags
// ============================================================
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { getSeoSettings, updateSeoSettings } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    await requireAdminAccess();
    const seo = await getSeoSettings();
    return NextResponse.json({ success: true, data: seo });
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdminAccess();
    const body = await req.json();
    const updated = await updateSeoSettings(body);
    return NextResponse.json({ success: true, data: updated, message: 'SEO settings saved' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
