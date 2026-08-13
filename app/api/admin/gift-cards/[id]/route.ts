// GET PATCH /api/admin/gift-cards/[id]
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { giftCardService } from '@/lib/services/gift-card.service';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  try { return NextResponse.json({ success: true, data: await giftCardService.getById(id) }); }
  catch { return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  try {
    const body = await req.json();
    return NextResponse.json({ success: true, data: await giftCardService.update(id, body) });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}
