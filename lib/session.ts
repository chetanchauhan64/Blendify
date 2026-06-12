// ============================================================
// BLENDIFY — lib/session.ts
// Stateless JWT session management using Jose
// Follows the official Next.js 16 authentication guide pattern
// Cookie: "blendify-session" (httpOnly, SameSite=lax)
// ============================================================
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// ── Types ─────────────────────────────────────────────────────
export interface SessionPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'ADMIN';
  expiresAt: Date;
}

// ── Config ────────────────────────────────────────────────────
const COOKIE_NAME = 'blendify-session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const secretKey = process.env.JWT_SECRET;

function getEncodedKey(): Uint8Array {
  if (!secretKey) {
    throw new Error(
      '[Blendify] JWT_SECRET is not set. Add it to .env.local.\n' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  return new TextEncoder().encode(secretKey);
}

// ── Encrypt / Decrypt ─────────────────────────────────────────

/**
 * Sign a JWT with the session payload.
 */
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getEncodedKey());
}

/**
 * Verify and decode a JWT. Returns null if invalid or expired.
 */
export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ── Cookie Helpers ─────────────────────────────────────────────

/**
 * Create a new session cookie after successful login/registration.
 */
export async function createSession(payload: Omit<SessionPayload, 'expiresAt'>): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encrypt({ ...payload, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Read and verify the current session from cookies.
 * Returns null if not authenticated.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return decrypt(token);
}

/**
 * Extend the session expiry on activity (sliding window).
 */
export async function refreshSession(): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encrypt({ ...session, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Delete the session cookie (logout).
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
