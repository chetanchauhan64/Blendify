// GET /api/addresses — list user addresses
// POST /api/addresses — create address
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { AddressSchema } from '@/lib/validations/auth';
import type { ApiResponse, AddressDTO } from '@/types/auth';

type RawAddress = Awaited<ReturnType<typeof prisma.address.findMany>>[number];

// ── GET — list all addresses for authenticated user ───────────
export async function GET(): Promise<NextResponse<ApiResponse<AddressDTO[]>>> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: addresses as unknown as AddressDTO[] });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// ── POST — create address ─────────────────────────────────────
export async function POST(req: Request): Promise<NextResponse<ApiResponse<AddressDTO>>> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

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
    const { isDefault, ...rest } = result.data;

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
      data: { ...rest, isDefault: isDefault ?? false, userId },
    });

    return NextResponse.json({ success: true, data: address as unknown as AddressDTO }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
