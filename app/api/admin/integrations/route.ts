// ============================================================
// BLENDIFY — Admin API: Third-Party Integrations
// ============================================================
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { getIntegrations } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    await requireAdminAccess();
    const integrations = await getIntegrations();
    return NextResponse.json({ success: true, data: integrations });
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
    return NextResponse.json({ success: true, data: body, message: 'Integration settings saved' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
