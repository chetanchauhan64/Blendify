// ============================================================
// BLENDIFY — Admin API: Tax Configuration
// ============================================================
import { NextResponse } from 'next/server';
import { getTaxConfig, updateTaxConfig } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    const config = await getTaxConfig();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateTaxConfig(body);
    return NextResponse.json({ success: true, data: updated, message: 'Tax configuration saved successfully' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
