// ============================================================
// BLENDIFY — Auth TypeScript Types
// Strongly typed DTOs for authentication and user management
// Updated: Removed Clerk dependency. Uses Jose JWT sessions.
// ============================================================

// ── Core Auth Types ───────────────────────────────────────────

/** Lightweight user object safe to pass to client components */
export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  avatar?: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'WAREHOUSE' | 'SUPPORT';
  loyaltyPoints?: number;
  loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  isActive?: boolean;
  createdAt?: Date;
}

/** Minimal user object returned from /api/auth/me */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'WAREHOUSE' | 'SUPPORT';
}

/** Address data transfer object — matches Prisma Address model */
export interface AddressDTO {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryId: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  isDefault: boolean;
  label: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Profile update payload */
export interface ProfileUpdatePayload {
  firstName: string;
  lastName: string;
  phone?: string | null;
}

/** Address create/update payload */
export interface AddressPayload {
  firstName: string;
  lastName: string;
  company?: string | null;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryId: string;
  type?: 'HOME' | 'WORK' | 'OTHER';
  isDefault?: boolean;
  label?: string | null;
}

// ── API Response Types ────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR';
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
