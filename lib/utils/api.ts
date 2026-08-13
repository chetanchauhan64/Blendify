// ============================================================
// BLENDIFY — Admin API Response Helper
// Consistent API response envelope for all admin routes
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess, ForbiddenError } from '@/lib/admin-guard';
import { ZodError } from 'zod';

export type ApiSuccess<T> = {
  success: true;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

export type ApiError = {
  success: false;
  error: string;
  details?: unknown;
};

export function ok<T>(data: T, pagination?: ApiSuccess<T>['pagination']): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, ...(pagination ? { pagination } : {}) });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(error: string, details?: unknown): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error, details }, { status: 400 });
}

export function notFound(error = 'Not found'): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error }, { status: 404 });
}

export function forbidden(error = 'Forbidden'): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error }, { status: 403 });
}

export function serverError(error: string): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error }, { status: 500 });
}

/**
 * Wrap a route handler with admin auth and standardized error handling.
 * Compatible with Next.js 16 route handler signature (params as Promise).
 */
export function withAdmin(
  handler: (req: NextRequest, ctx: { user: Awaited<ReturnType<typeof requireAdminAccess>>; params?: Record<string, string> }) => Promise<Response>,
) {
  return async (req: NextRequest, context?: { params?: Promise<Record<string, string>> }): Promise<Response> => {
    try {
      const user = await requireAdminAccess();
      const params = context?.params ? await context.params : undefined;
      return await handler(req, { user, params });
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return forbidden(err.message);
      }
      if (err instanceof ZodError) {
        return badRequest('Validation failed', err.flatten().fieldErrors);
      }
      if (err instanceof Error) {
        if (err.message.includes('Not found') || err.message.includes('not found')) {
          return notFound(err.message);
        }
        console.error('[Admin API Error]', err);
        return serverError(err.message);
      }
      return serverError('An unexpected error occurred');
    }
  };
}

/**
 * Parse URL search params into an object.
 */
export function parseSearchParams(url: string): Record<string, string> {
  const { searchParams } = new URL(url);
  const result: Record<string, string> = {};
  searchParams.forEach((value, key) => { result[key] = value; });
  return result;
}
