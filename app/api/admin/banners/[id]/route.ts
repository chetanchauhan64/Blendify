// GET PATCH DELETE /api/admin/banners/[id]
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { bannerService } from '@/lib/services/banner.service';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  try { return NextResponse.json({ success: true, data: await bannerService.getById(id) }); }
  catch { return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminAccess();
  const { id } = await params;
  try {
    return NextResponse.json({ success: true, data: await bannerService.update(id, await req.json(), user.id) });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  await bannerService.delete(id);
  return NextResponse.json({ success: true });
}
