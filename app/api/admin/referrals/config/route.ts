// GET POST /api/admin/referrals/config
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { referralService } from '@/lib/services/referral.service';

export async function GET() {
  await requireAdminAccess();
  const [config, stats] = await Promise.all([referralService.getConfig(), referralService.getStats()]);
  return NextResponse.json({ success: true, data: { config, stats } });
}

export async function POST(req: Request) {
  const user = await requireAdminAccess();
  try {
    const body = await req.json();
    const data = await referralService.updateConfig(body, user.id);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}
