// GET POST /api/admin/announcement-bars
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { announcementRepository } from '@/lib/db/repositories';
import { parseSearchParams } from '@/lib/utils/api';
import { CreateAnnouncementBarSchema } from '@/lib/validations/admin.schemas';

export async function GET(req: Request) {
  await requireAdminAccess();
  const { page = '1', limit = '25', isActive } = parseSearchParams(req.url);
  const result = await announcementRepository.findAll({
    page: parseInt(page), limit: parseInt(limit), sortOrder: 'asc',
    ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
  });
  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: Request) {
  const user = await requireAdminAccess();
  try {
    const body = await req.json();
    const data = CreateAnnouncementBarSchema.parse(body);
    const result = await announcementRepository.create({ ...data, createdById: user.id });
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}
