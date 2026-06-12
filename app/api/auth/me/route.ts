// GET /api/auth/me — returns the current authenticated user from DB
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import type { ApiResponse, AuthenticatedUser } from '@/types/auth';

export async function GET(): Promise<NextResponse<ApiResponse<AuthenticatedUser>>> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, data: user });
}
