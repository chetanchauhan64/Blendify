// GET POST /api/admin/saved-filters
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { savedFilterRepository } from '@/lib/db/repositories';
import { parseSearchParams } from '@/lib/utils/api';

export async function GET(req: Request) {
  const user = await requireAdminAccess();
  const { module } = parseSearchParams(req.url);
  const data = await savedFilterRepository.findByUserAndModule(user.id, module ?? '');
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  const user = await requireAdminAccess();
  try {
    const body = await req.json();
    const data = await savedFilterRepository.create({ userId: user.id, ...body });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}
