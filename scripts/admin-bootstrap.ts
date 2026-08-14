// ============================================================
// BLENDIFY — scripts/admin-bootstrap.ts
// Creates or promotes the owner ADMIN account in PostgreSQL.
//
// Usage (always run locally — never from Vercel):
//   npm run admin:bootstrap
//
// Required environment variables (in .env.local):
//   OWNER_ADMIN_EMAIL    — the owner's email address
//   OWNER_ADMIN_PASSWORD — the owner's plaintext password (stored as bcrypt hash)
//   DIRECT_URL           — Supabase direct PostgreSQL URL (preferred for DDL/writes)
//   DATABASE_URL         — fallback if DIRECT_URL is not set
//
// Security guarantees:
//   ✓ Password is NEVER logged, printed, or stored in plaintext
//   ✓ Password is hashed with bcrypt (cost=12) before storing
//   ✓ Only OWNER_ADMIN_EMAIL is granted ADMIN access
//   ✓ No other email can receive ADMIN through this script
//   ✓ No NODE_ENV bypass — works identically in all environments
//   ✓ Uses DIRECT_URL (bypass pgBouncer) when available, DATABASE_URL otherwise
//   ✓ Never runs automatically during Vercel build
// ============================================================

import * as dotenv from 'dotenv';
// Load .env first, then .env.local with override — mirrors Next.js env resolution order
dotenv.config();
dotenv.config({ path: '.env.local', override: true });
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ── Read and validate environment variables ────────────────────────

// Prefer DIRECT_URL for bootstrap — it bypasses pgBouncer and is always
// a raw PostgreSQL connection, required for reliable upserts outside
// transaction-mode pooling. Falls back to DATABASE_URL if DIRECT_URL is absent.
const DIRECT_URL     = process.env.DIRECT_URL;
const DATABASE_URL   = process.env.DATABASE_URL;
const BOOTSTRAP_URL  = (DIRECT_URL && !DIRECT_URL.startsWith('REPLACE')) ? DIRECT_URL : DATABASE_URL;

const OWNER_EMAIL     = process.env.OWNER_ADMIN_EMAIL;
const OWNER_PASSWORD  = process.env.OWNER_ADMIN_PASSWORD;

if (!BOOTSTRAP_URL || BOOTSTRAP_URL.startsWith('REPLACE')) {
  console.log('\n⚠️  No usable database URL found (DIRECT_URL or DATABASE_URL) — skipping admin bootstrap.\n');
  process.exit(0);
}

if (!OWNER_EMAIL || !OWNER_EMAIL.includes('@')) {
  console.log('\n⚠️  OWNER_ADMIN_EMAIL is not set or invalid — skipping admin bootstrap.\n');
  process.exit(0);
}

if (!OWNER_PASSWORD || OWNER_PASSWORD.length < 8) {
  console.log('\n⚠️  OWNER_ADMIN_PASSWORD is not set or too short — skipping admin bootstrap.\n');
  process.exit(0);
}

// ── Initialise Prisma with the pg adapter ─────────────────────────────────
// SSL is required for all Supabase connections (direct and pooler).
const isProduction =
  process.env.NODE_ENV === 'production' ||
  BOOTSTRAP_URL.includes('supabase.co') ||
  BOOTSTRAP_URL.includes('supabase.com') ||
  BOOTSTRAP_URL.includes('sslmode=') ||
  BOOTSTRAP_URL.includes('render.com');

console.log(`\n   URL type    : ${DIRECT_URL && !DIRECT_URL.startsWith('REPLACE') ? 'DIRECT_URL (direct PostgreSQL)' : 'DATABASE_URL (pooler/fallback)'}`);
console.log(`   SSL         : ${isProduction ? 'enabled (rejectUnauthorized=false)' : 'disabled (local)'}`);

const pool = new Pool({
  connectionString: BOOTSTRAP_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({
  adapter,
  log: ['error'],
});

async function bootstrap() {
  console.log('\n🔐  BLENDIFY Admin Bootstrap');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Target email : ${OWNER_EMAIL}`);
  console.log(`   Target role  : ADMIN`);
  console.log('   Password     : [REDACTED — never logged]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── Hash the password using bcrypt (cost=12, same as signUp/signIn) ─
  console.log('⏳  Hashing password with bcrypt (cost=12)...');
  const hashedPassword = await bcrypt.hash(OWNER_PASSWORD!, 12);
  // hashedPassword is the only thing stored — OWNER_PASSWORD is never written anywhere

  // ── Upsert the owner account ────────────────────────────────
  console.log('⏳  Upserting owner account in PostgreSQL...');

  const user = await prisma.user.upsert({
    where: { email: OWNER_EMAIL! },
    update: {
      // Always force ADMIN role and update the password hash on every run
      role:      'ADMIN',
      password:  hashedPassword,
      isActive:  true,
    },
    create: {
      email:      OWNER_EMAIL!,
      firstName:  'Chetan',
      lastName:   'Thakur',
      role:       'ADMIN',
      password:   hashedPassword,
      isActive:   true,
    },
    select: {
      id:        true,
      email:     true,
      role:      true,
      isActive:  true,
      createdAt: true,
    },
  });

  // ── Verify NO other account has been granted ADMIN ───────────
  const otherAdmins = await prisma.user.findMany({
    where: {
      role:  { in: ['ADMIN', 'SUPER_ADMIN'] },
      email: { not: OWNER_EMAIL },
    },
    select: { id: true, email: true, role: true },
  });

  console.log('\n✅  Owner account bootstrapped successfully\n');
  console.log('   ID        :', user.id);
  console.log('   Email     :', user.email);
  console.log('   Role      :', user.role);
  console.log('   Active    :', user.isActive);
  console.log('   Password  : [STORED AS BCRYPT HASH — never logged]');

  if (otherAdmins.length > 0) {
    console.log('\n⚠️   WARNING: The following non-owner accounts have ADMIN/SUPER_ADMIN role:');
    for (const a of otherAdmins) {
      console.log(`     - ${a.email} (${a.role}) — ID: ${a.id}`);
    }
    console.log('   If these are unexpected, revoke them manually.\n');
  } else {
    console.log('\n   ✓ No other accounts have admin privileges\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Sign in at: /admin/sign-in');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

bootstrap()
  .catch((err: Error) => {
    console.error('\n❌  Bootstrap failed:', err.message, '\n');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
