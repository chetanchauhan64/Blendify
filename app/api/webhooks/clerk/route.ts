// POST /api/webhooks/clerk — DEPRECATED
// Clerk webhooks are no longer used. This route is kept as a stub
// to prevent 404 errors if any stale webhook deliveries arrive.
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ received: true, note: 'Clerk webhooks are deprecated. Auth is now handled via Jose JWT.' });
}
