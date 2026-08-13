// GET /api/admin/loyalty/transactions  POST /api/admin/loyalty/adjust
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { loyaltyAdminService } from '@/lib/services/loyalty-admin.service';
import { parseSearchParams } from '@/lib/utils/api';

export async function GET(req: Request) {
  await requireAdminAccess();
  const result = await loyaltyAdminService.getTransactions(parseSearchParams(req.url));
  return NextResponse.json({ success: true, ...result });
}
