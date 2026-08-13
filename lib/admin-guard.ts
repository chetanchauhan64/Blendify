// ============================================================
// BLENDIFY — Admin Guard
// Server-side guard for admin-only routes.
// Auth is enforced identically in ALL environments.
// No dev bypasses. No automatic role promotion.
// ============================================================

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import type { UserDTO } from '@/types/auth';

/**
 * Require ADMIN or SUPER_ADMIN access.
 *
 * Unauthenticated  → redirects to /admin/sign-in
 * Authenticated but not ADMIN/SUPER_ADMIN → redirects to /admin/unauthorized
 *
 * Auth is enforced identically in development and production.
 * There are NO dev-mode bypasses, NO automatic role promotions, and NO fake users.
 */
export async function requireAdminAccess(): Promise<UserDTO> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin/sign-in');
  }

  const role = user.role as string;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    redirect('/admin/unauthorized');
  }

  return user;
}

/**
 * Returns true only when the current session belongs to an ADMIN or SUPER_ADMIN.
 * Never returns true based on environment — only based on the authenticated role.
 */
export async function hasAdminAccess(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const role = user.role as string;
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

// ── Error Classes ─────────────────────────────────────────────

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
