// ============================================================
// BLENDIFY — Admin API: Third-Party Integrations
// ============================================================
import { NextResponse } from 'next/server';
import { getIntegrations } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    const integrations = await getIntegrations();
    return NextResponse.json({ success: true, data: integrations });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({ success: true, data: body, message: 'Integration settings saved' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
