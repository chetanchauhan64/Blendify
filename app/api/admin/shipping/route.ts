// ============================================================
// BLENDIFY — Admin API: Shipping Zones & Rates
// ============================================================
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { getShippingZones, createShippingZone, updateShippingZone } from '@/lib/db/repositories/phase2.repository';

export async function GET() {
  try {
    await requireAdminAccess();
    const zones = await getShippingZones();
    return NextResponse.json({ success: true, data: zones });
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminAccess();
    const body = await req.json();
    const created = await createShippingZone(body);
    return NextResponse.json({ success: true, data: created, message: 'Shipping zone created successfully' });
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
    const { id, ...data } = body;
    const updated = await updateShippingZone(id, data);
    return NextResponse.json({ success: true, data: updated, message: 'Shipping zone updated successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) throw error;
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
