// ============================================================
// BLENDIFY — Prisma Client Singleton (Prisma 7 + adapter-pg)
// Safe when DATABASE_URL is not set (demo / build mode).
// Uses lazy initialisation — client is never created at import
// time, only on first actual DB call.
// ============================================================
import type { PrismaClient } from '@prisma/client';

// ── Types ─────────────────────────────────────────────────────
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ── Lazy factory ──────────────────────────────────────────────
// We import everything inside the function so that:
//   1. The module loads cleanly even when DATABASE_URL is absent
//   2. TypeScript type-checks against the generated client types
//      only when running properly (after prisma generate)
function createPrismaClient(): PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require('@prisma/adapter-pg');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require('pg');

  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
  });
}

// ── DB availability check ─────────────────────────────────────
export const isDbConfigured =
  !!process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.startsWith('REPLACE');

// ── Singleton export ──────────────────────────────────────────
// `prisma` is null when DATABASE_URL is not set.
// All callers that use the DB should check isDbConfigured first,
// or use the safe helper below.
export const prisma: PrismaClient = isDbConfigured
  ? (globalForPrisma.prisma ?? (() => {
      const client = createPrismaClient();
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = client;
      }
      return client;
    })())
  : (null as unknown as PrismaClient); // null in demo/build mode

export default prisma;
