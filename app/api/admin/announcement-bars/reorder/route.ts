// PUT /api/admin/announcement-bars/reorder
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { announcementRepository } from '@/lib/db/repositories';
import { z } from 'zod';

export async function PUT(req: Request) {
  await requireAdminAccess();
  try {
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(await req.json());
    await announcementRepository.reorder(ids);
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}
