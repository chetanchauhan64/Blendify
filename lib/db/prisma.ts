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
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    connectionString?.includes('sslmode=') ||
    connectionString?.includes('render.com');

  const pool = new Pool({
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
  });
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
export function getIsDbConfigured(): boolean {
  return (
    !!process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.startsWith('REPLACE')
  );
}

export const isDbConfigured = getIsDbConfigured();

// ── Singleton export ──────────────────────────────────────────
export function getPrismaClient(): PrismaClient {
  if (!getIsDbConfigured()) {
    return null as unknown as PrismaClient;
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      return undefined;
    }
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;
