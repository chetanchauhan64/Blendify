// ============================================================
// BLENDIFY — Admin Guard
// Server-side guard for admin-only routes
// ============================================================

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import type { UserDTO } from '@/types/auth';

const DEV_ADMIN_USER: UserDTO = {
  id: 'dev-admin-id',
  email: 'admin@blendify.coffee',
  firstName: 'Admin',
  lastName: 'Console',
  fullName: 'Admin Console',
  role: 'ADMIN',
};

export async function requireAdminAccess(): Promise<UserDTO> {
  const user = await getCurrentUser();

  if (!user) {
    if (process.env.NODE_ENV !== 'production') {
      return DEV_ADMIN_USER;
    }
    redirect('/sign-in');
  }

  const role = user.role as string;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    if (process.env.NODE_ENV !== 'production') {
      return { ...user, role: 'ADMIN' };
    }
    throw new ForbiddenError('You do not have permission to access this page.');
  }

  return user;
}

export async function hasAdminAccess(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return process.env.NODE_ENV !== 'production';
  }
  const role = user.role as string;
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || process.env.NODE_ENV !== 'production';
}

export class ForbiddenError extends Error {
  public readonly statusCode = 403;
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends Error {
  public readonly statusCode = 401;
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  public readonly statusCode = 404;
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
