// GET PATCH DELETE /api/admin/bundles/[id]
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  const bundle = await prisma.bundle.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { id: true, name: true } }, variant: { select: { id: true, name: true, price: true } } } } },
  });
  if (!bundle) return NextResponse.json({ success: false, error: 'Bundle not found' }, { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      ...bundle,
      originalPrice: Number(bundle.originalPrice),
      bundlePrice: Number(bundle.bundlePrice),
      savingsPercent: Number(bundle.savingsPercent),
    },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  try {
    const body = await req.json();
    const { items, ...updateData } = body;

    const bundle = await prisma.bundle.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...bundle,
        originalPrice: Number(bundle.originalPrice),
        bundlePrice: Number(bundle.bundlePrice),
        savingsPercent: Number(bundle.savingsPercent),
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  await prisma.bundle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
