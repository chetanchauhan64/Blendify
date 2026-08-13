// ============================================================
// BLENDIFY — Admin API: Payment Gateways
// ============================================================
import { NextResponse } from 'next/server';
import { getPaymentGateways, updatePaymentGateway } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    const gateways = await getPaymentGateways();
    return NextResponse.json({ success: true, data: gateways });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const updated = await updatePaymentGateway(id, data);
    return NextResponse.json({ success: true, data: updated, message: 'Payment gateway configuration saved' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
