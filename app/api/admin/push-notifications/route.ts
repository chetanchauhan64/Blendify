// GET POST /api/admin/push-notifications
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { campaignService } from '@/lib/services/campaign.service';
import { parseSearchParams } from '@/lib/utils/api';

export async function GET(req: Request) {
  await requireAdminAccess();
  const result = await campaignService.listPush(parseSearchParams(req.url));
  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: Request) {
  const user = await requireAdminAccess();
  try {
    const body = await req.json();
    const data = await campaignService.createPush(body, user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}
