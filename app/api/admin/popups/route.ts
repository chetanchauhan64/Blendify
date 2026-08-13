// GET POST /api/admin/popups
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { popupService } from '@/lib/services/popup.service';
import { parseSearchParams } from '@/lib/utils/api';

export async function GET(req: Request) {
  await requireAdminAccess();
  const result = await popupService.list(parseSearchParams(req.url));
  return NextResponse.json({ success: true, ...result });
}

export async function POST(req: Request) {
  const user = await requireAdminAccess();
  try {
    const data = await popupService.create(await req.json(), user.id);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}
