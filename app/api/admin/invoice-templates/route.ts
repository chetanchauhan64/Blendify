// ============================================================
// BLENDIFY — Admin API: Invoice Templates
// ============================================================
import { NextResponse } from 'next/server';
import { getInvoiceTemplate, updateInvoiceTemplate } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    const template = await getInvoiceTemplate();
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateInvoiceTemplate(body);
    return NextResponse.json({ success: true, data: updated, message: 'Invoice template saved' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
