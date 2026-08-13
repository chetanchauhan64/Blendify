// POST /api/admin/email-campaigns/[id]/send
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { campaignService } from '@/lib/services/campaign.service';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  try {
    const result = await campaignService.sendCampaign(id);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}
