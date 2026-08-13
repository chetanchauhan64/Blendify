// GET PATCH DELETE /api/admin/coupons/[id]
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: { ...coupon, discountValue: Number(coupon.value) } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminAccess();
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await prisma.coupon.update({
      where: { id },
      data: { ...body, updatedById: user.id },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
