// PATCH DELETE /api/admin/saved-filters/[id]
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { savedFilterRepository } from '@/lib/db/repositories';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminAccess();
  const { id } = await params;
  try {
    const body = await req.json();
    const data = await savedFilterRepository.update(id, user.id, body);
    return NextResponse.json({ success: true, data });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminAccess();
  const { id } = await params;
  await savedFilterRepository.delete(id, user.id);
  return NextResponse.json({ success: true });
}
