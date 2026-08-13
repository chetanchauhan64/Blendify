// GET /api/admin/reviews  POST (bulk action)
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { reviewService } from '@/lib/services/review.service';
import { parseSearchParams } from '@/lib/utils/api';

export async function GET(req: Request) {
  await requireAdminAccess();
  try {
    const filters = parseSearchParams(req.url);
    if (filters.analyticsOnly === 'true') {
      const analytics = await reviewService.getAnalytics();
      return NextResponse.json({ success: { analytics } });
    }
    const result = await reviewService.list(filters);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  await requireAdminAccess();
  try {
    const body = await req.json();
    const result = await reviewService.bulkAction(body);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}
