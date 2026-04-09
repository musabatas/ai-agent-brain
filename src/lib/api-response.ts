import { NextResponse } from 'next/server';
import { getAuthContext, AuthContext } from '@/lib/auth';
import { NextRequest } from 'next/server';

/**
 * Standardized API response helpers.
 * All responses follow: { data?, message?, pagination? }
 */

/** 200 — single entity */
export function ok<T>(data: T) {
  return NextResponse.json({ data });
}

/** 201 — entity created */
export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

/** 200 — action message */
export function message(msg: string, status = 200) {
  return NextResponse.json({ message: msg }, { status });
}

/** 401 — unauthenticated */
export function unauthorized() {
  return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
}

/** 403 — insufficient permissions */
export function forbidden(msg = 'Forbidden') {
  return NextResponse.json({ message: msg }, { status: 403 });
}

/** 404 — not found */
export function notFound(entity: string) {
  return NextResponse.json({ message: `${entity} not found` }, { status: 404 });
}

/** 400 — validation error */
export function badRequest(msg: string, details?: unknown) {
  return NextResponse.json(
    { message: msg, ...(details ? { details } : {}) },
    { status: 400 },
  );
}

/** 409 — conflict */
export function conflict(msg: string) {
  return NextResponse.json({ message: msg }, { status: 409 });
}

/**
 * Require auth context — returns AuthContext or sends 401.
 * Usage: const auth = await requireAuth(req); if (auth instanceof NextResponse) return auth;
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext | NextResponse> {
  const auth = await getAuthContext(req);
  if (!auth) return unauthorized();
  return auth;
}
