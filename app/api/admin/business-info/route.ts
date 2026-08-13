// ============================================================
// BLENDIFY — Admin API: Business Information
// ============================================================
import { NextResponse } from 'next/server';
import { getBusinessInfo, updateBusinessInfo } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    const info = await getBusinessInfo();
    return NextResponse.json({ success: true, data: info });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateBusinessInfo(body);
    return NextResponse.json({ success: true, data: updated, message: 'Business info saved successfully' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
