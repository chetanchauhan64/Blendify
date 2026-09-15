// ============================================================
// BLENDIFY — Admin API: Tax Configuration
// ============================================================
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { getTaxConfig, updateTaxConfig } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    await requireAdminAccess();
    const config = await getTaxConfig();
    return NextResponse.json({ success: true, data: config });
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
    const updated = await updateTaxConfig(body);
    return NextResponse.json({ success: true, data: updated, message: 'Tax configuration saved successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
