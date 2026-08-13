// GET POST /api/admin/loyalty/config
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { loyaltyAdminService } from '@/lib/services/loyalty-admin.service';

export async function GET() {
  await requireAdminAccess();
  const data = await loyaltyAdminService.getConfig();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  const user = await requireAdminAccess();
  try {
    const body = await req.json();
    const data = await loyaltyAdminService.updateConfig(body, user.id);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}
