// PATCH /api/account/profile — update user profile
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { ProfileSchema } from '@/lib/validations/auth';
import type { ApiResponse, UserDTO } from '@/types/auth';

export async function PATCH(req: Request): Promise<NextResponse<ApiResponse<Partial<UserDTO>>>> {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const result = ProfileSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error.issues[0]?.message ?? 'Validation failed',
        code: 'VALIDATION_ERROR',
      },
      { status: 422 },
    );
  }

  const { firstName, lastName, phone } = result.data;

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, phone },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'User not found', code: 'NOT_FOUND' },
      { status: 404 },
    );
  }
}
