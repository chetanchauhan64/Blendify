// GET PATCH DELETE /api/admin/announcement-bars/[id]
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { announcementRepository } from '@/lib/db/repositories';
import { UpdateAnnouncementBarSchema } from '@/lib/validations/admin.schemas';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  const data = await announcementRepository.findById(id);
  if (!data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminAccess();
  const { id } = await params;
  try {
    const body = await req.json();
    const data = UpdateAnnouncementBarSchema.parse(body);
    const result = await announcementRepository.update(id, { ...data, updatedById: user.id });
    return NextResponse.json({ success: true, data: result });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  await announcementRepository.delete(id);
  return NextResponse.json({ success: true });
}
