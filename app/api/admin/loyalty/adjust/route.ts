// POST /api/admin/loyalty/adjust
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { loyaltyAdminService } from '@/lib/services/loyalty-admin.service';

export async function POST(req: Request) {
  await requireAdminAccess();
  try {
    const body = await req.json();
    const data = await loyaltyAdminService.manualAdjust(body);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}
