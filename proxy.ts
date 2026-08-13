// ============================================================
// BLENDIFY — proxy.ts (Next.js 16 route protection)
// Replaces Clerk middleware with Jose JWT cookie check.
// Cookie: "blendify-session" (set by lib/session.ts)
//
// Admin route handling:
//   /admin/sign-in       → public (no auth required)
//   /admin/unauthorized  → public (no auth required)
//   /admin/*             → protected (valid JWT + ADMIN role required)
//   /account, /checkout, /wishlist → protected (any valid JWT)
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'blendify-session';

// Admin routes that do NOT require authentication
const ADMIN_PUBLIC_PATHS = ['/admin/sign-in', '/admin/unauthorized'];

// Storefront routes that require any valid session
const STOREFRONT_PROTECTED_PREFIXES = ['/account', '/checkout', '/wishlist'];

// Static/internal paths that should always be skipped
const SKIP_PREFIXES = ['/_next', '/api/auth', '/api/webhooks', '/favicon.ico'];

interface TokenPayload {
  userId?: string;
  role?: string;
}

/**
 * Verify the JWT and return its payload, or null if invalid/missing.
 */
async function verifyToken(token: string): Promise<TokenPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ['HS256'] }
    );
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip static / internal paths ────────────────────────────
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Admin public pages (sign-in, unauthorized) ───────────────
  // Mark these with a header so the admin layout can detect them
  // and skip rendering AdminShell + calling requireAdminAccess().
  if (ADMIN_PUBLIC_PATHS.includes(pathname)) {
    const response = NextResponse.next();
    response.headers.set('x-admin-public', 'true');
    return response;
  }

  // ── Admin protected routes (/admin/*) ───────────────────────
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const payload = token ? await verifyToken(token) : null;

    // No valid session → redirect to admin sign-in
    // Preserve the requested path so we can redirect back after sign-in
    if (!payload?.userId) {
      const signInUrl = new URL('/admin/sign-in', request.url);
      signInUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Valid session but not admin role → redirect to unauthorized page
    const role = payload.role as string | undefined;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
    }

    // Authenticated admin — allow through
    return NextResponse.next();
  }

  // ── Storefront protected routes ──────────────────────────────
  if (STOREFRONT_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const payload = token ? await verifyToken(token) : null;

    if (!payload?.userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
