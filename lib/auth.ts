// ============================================================
// BLENDIFY — lib/auth.ts
// Server-side auth helpers — replaces Clerk
// Uses Jose JWT sessions stored in httpOnly cookies
// ============================================================
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import type { SessionPayload } from '@/lib/session';

export type { SessionPayload };

// Re-export as UserDTO shape for backwards compatibility
export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'WAREHOUSE' | 'SUPPORT';
  // Optional — only available when read from DB, not from JWT alone
  phone?: string | null;
  avatar?: string | null;
  loyaltyPoints?: number;
  loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  isActive?: boolean;
  createdAt?: Date;
}

export interface AuthenticatedUser extends UserDTO {
  // Extended user — reserved for DB-backed fields
}

// ── Auth Helpers ──────────────────────────────────────────────

/**
 * Returns the current session payload, or null if not authenticated.
 * Safe to call from any Server Component or Server Action.
 */
export async function getCurrentUser(): Promise<UserDTO | null> {
  const session = await getSession();
  if (!session) return null;

  return {
    id: session.userId,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    fullName: `${session.firstName} ${session.lastName}`.trim(),
    role: session.role,
  };
}

/**
 * Require authentication. Redirects to /sign-in if not authenticated.
 */
export async function requireAuth(): Promise<UserDTO> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in');
  }
  return user;
}

/**
 * Require ADMIN role. Throws FORBIDDEN if not admin.
 */
export async function requireAdmin(): Promise<UserDTO> {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

/**
 * Require CUSTOMER role or higher.
 */
export async function requireCustomer(): Promise<UserDTO> {
  return requireAuth();
}

/**
 * Returns authenticated user or null — same shape as old getAuthenticatedUser().
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  return getCurrentUser();
}

/**
 * Returns only the userId string, or null.
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId ?? null;
}
