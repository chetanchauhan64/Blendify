// GET POST /api/admin/banners
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { bannerService } from '@/lib/services/banner.service';
import { parseSearchParams } from '@/lib/utils/api';

export async function GET(req: Request) {
  await requireAdminAccess();
  const result = await bannerService.list(parseSearchParams(req.url));
  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: Request) {
  const user = await requireAdminAccess();
  try {
    const body = await req.json();
    const data = await bannerService.create(body, user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}
