// ============================================================
// BLENDIFY — proxy.ts (Next.js 16 route protection)
// Replaces Clerk middleware with Jose JWT cookie check
// Cookie: "blendify-session" (set by lib/session.ts)
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Protected route prefixes — require a valid session
const PROTECTED_PREFIXES = ['/account', '/checkout', '/wishlist', '/admin'];

// Public routes — always allowed without auth
const PUBLIC_PREFIXES = ['/sign-in', '/sign-up', '/api/auth', '/_next', '/api/webhooks'];

const COOKIE_NAME = 'blendify-session';

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Protect specific routes
  if (isProtected(pathname)) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const valid = token ? await verifyToken(token) : false;

    if (!valid) {
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
