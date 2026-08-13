// ============================================================
// BLENDIFY — Admin API: Shipping Zones & Rates
// ============================================================
import { NextResponse } from 'next/server';
import { getShippingZones, createShippingZone, updateShippingZone } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    const zones = await getShippingZones();
    return NextResponse.json({ success: true, data: zones });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await createShippingZone(body);
    return NextResponse.json({ success: true, data: created, message: 'Shipping zone created successfully' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    const updated = await updateShippingZone(id, data);
    return NextResponse.json({ success: true, data: updated, message: 'Shipping zone updated successfully' });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
