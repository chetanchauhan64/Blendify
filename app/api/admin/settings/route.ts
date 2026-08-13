// ============================================================
// BLENDIFY — Admin API: Store Settings
// ============================================================
import { NextResponse } from 'next/server';
import { getStoreSettings, updateStoreSettings } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateStoreSettings(body);
    return NextResponse.json({ success: true, data: updated, message: 'Store settings saved successfully' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
