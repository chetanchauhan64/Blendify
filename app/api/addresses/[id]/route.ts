// PUT /api/addresses/[id] — update address
// DELETE /api/addresses/[id] — delete address
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { AddressSchema } from '@/lib/validations/auth';
import type { ApiResponse, AddressDTO } from '@/types/auth';

type RouteParams = { params: Promise<{ id: string }> };

// ── PUT — update address ──────────────────────────────────────
export async function PUT(req: Request, { params }: RouteParams): Promise<NextResponse<ApiResponse<AddressDTO>>> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ success: false, error: 'Invalid JSON', code: 'VALIDATION_ERROR' }, { status: 400 }); }

  const result = AddressSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error.issues[0]?.message ?? 'Validation failed', code: 'VALIDATION_ERROR' },
      { status: 422 },
    );
  }

  try {
    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ success: false, error: 'Address not found', code: 'NOT_FOUND' }, { status: 404 });

    const { isDefault, ...rest } = result.data;

    if (isDefault && !existing.isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: { ...rest, isDefault: isDefault ?? existing.isDefault },
    });

    return NextResponse.json({ success: true, data: updated as unknown as AddressDTO });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// ── DELETE — delete address ───────────────────────────────────
export async function DELETE(_req: Request, { params }: RouteParams): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ success: false, error: 'Address not found', code: 'NOT_FOUND' }, { status: 404 });

    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
