// ============================================================
// BLENDIFY — Admin API: Store Settings
// ============================================================
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { getStoreSettings, updateStoreSettings } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    await requireAdminAccess();
    const settings = await getStoreSettings();
    return NextResponse.json({ success: true, data: settings });
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
    const updated = await updateStoreSettings(body);
    return NextResponse.json({ success: true, data: updated, message: 'Store settings saved successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
