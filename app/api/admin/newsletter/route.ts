// GET /api/admin/newsletter  DELETE bulk
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { parseSearchParams } from '@/lib/utils/api';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
  await requireAdminAccess();
  const { page = '1', limit = '25', search, isActive } = parseSearchParams(req.url);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: Record<string, unknown> = {
    ...(search ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { firstName: { contains: search, mode: 'insensitive' } }] } : {}),
    ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.newsletterSubscriber.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: data.map((s) => ({ ...s, subscribedAt: s.createdAt })),
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
}

export async function POST(req: Request) {
  await requireAdminAccess();
  try {
    const { action, ids } = await req.json();
    if (action === 'unsubscribe' && Array.isArray(ids)) {
      await prisma.newsletterSubscriber.updateMany({ where: { id: { in: ids } }, data: { isActive: false } });
      return NextResponse.json({ success: true, affected: ids.length });
    }
    if (action === 'delete' && Array.isArray(ids)) {
      await prisma.newsletterSubscriber.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ success: true, affected: ids.length });
    }
    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (e) { return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 }); }
}
