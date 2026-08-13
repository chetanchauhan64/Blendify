// GET PATCH DELETE /api/admin/email-campaigns/[id]
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { campaignService } from '@/lib/services/campaign.service';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  try { return NextResponse.json({ success: true, data: await campaignService.getCampaign(id) }); }
  catch { return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminAccess();
  const { id } = await params;
  try {
    const body = await req.json();
    return NextResponse.json({ success: true, data: await campaignService.updateCampaign(id, body, user.id) });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  try {
    await campaignService.deleteCampaign(id);
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}
