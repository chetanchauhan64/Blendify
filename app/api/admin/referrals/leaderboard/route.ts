// GET /api/admin/referrals/leaderboard
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { referralService } from '@/lib/services/referral.service';

export async function GET() {
  await requireAdminAccess();
  const data = await referralService.getLeaderboard(20);
  return NextResponse.json({ success: true, data });
}
