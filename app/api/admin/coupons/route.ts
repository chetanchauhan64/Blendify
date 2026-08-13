// GET POST /api/admin/coupons
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { parseSearchParams } from '@/lib/utils/api';
import { prisma } from '@/lib/db/prisma';
import { CreateCouponAdminSchema } from '@/lib/validations/admin.schemas';

export async function GET(req: Request) {
  await requireAdminAccess();
  const { page = '1', limit = '25', search, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = parseSearchParams(req.url);
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: Record<string, unknown> = {
    ...(search ? { OR: [{ code: { contains: search.toUpperCase() } }, { description: { contains: search, mode: 'insensitive' } }] } : {}),
    ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.coupon.findMany({ where, orderBy: { [sortBy]: sortOrder }, skip, take }),
    prisma.coupon.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: data.map((c) => ({
      ...c,
      discountValue: Number(c.value),
      minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
      maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
    })),
    pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
  });
}

export async function POST(req: Request) {
  const user = await requireAdminAccess();
  try {
    const body = await req.json();
    const data = CreateCouponAdminSchema.parse(body);
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description ?? null,
        type: data.type as import('@prisma/client').CouponType,
        value: data.value,
        minOrderAmount: data.minOrderAmount ?? null,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        maxUses: data.maxUses ?? null,
        maxUsesPerUser: data.maxUsesPerUser ?? 1,
        isActive: data.isActive ?? true,
        startsAt: data.startsAt ?? null,
        expiresAt: data.expiresAt ?? null,
        applicableToAll: data.applicableToAll ?? true,
        applicableProducts: data.applicableProducts ?? [],
      },
    });
    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}
