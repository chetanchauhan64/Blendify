// ============================================================
// BLENDIFY — scripts/post-generate.ts
// Post-generate hook: runs after `prisma generate` during build.
//
// DATABASE OPERATIONS (db push, admin bootstrap) are intentionally
// SKIPPED on Vercel builds. Vercel's build environment cannot reach
// the Supabase direct PostgreSQL endpoint (port 5432 is firewalled).
//
// To run schema sync + bootstrap manually against production:
//   BLENDIFY_RUN_DB_SYNC=true npm run build
// or just:
//   npm run db:push          (uses DIRECT_URL if set, else DATABASE_URL)
//   npm run admin:bootstrap  (uses DIRECT_URL if set, else DATABASE_URL)
// ============================================================
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

// Vercel automatically sets VERCEL=1 in all build/runtime environments.
// We use this to detect a Vercel build and skip DB operations that
// require direct PostgreSQL access (unreachable from Vercel's build sandbox).
const IS_VERCEL = process.env.VERCEL === '1';
const DATABASE_URL = process.env.DATABASE_URL;
const DIRECT_URL   = process.env.DIRECT_URL; // preferred for CLI ops
const RUN_DB_SYNC  = process.env.BLENDIFY_RUN_DB_SYNC === 'true';

if (IS_VERCEL) {
  // ── Vercel build detected — skip all database operations ──────────
  // Vercel cannot reach the Supabase direct PostgreSQL endpoint.
  // Schema synchronization and admin bootstrap must be run separately
  // from an environment with direct database access (e.g. your local machine).
  console.log(
    '\nℹ️  Vercel deployment detected — skipping production DB synchronization' +
    ' and owner bootstrap.\n' +
    '   Run these separately from your local machine:\n' +
    '   • npm run db:push          (sync schema via DIRECT_URL)\n' +
    '   • npm run admin:bootstrap  (create/update owner account)\n'
  );
  process.exit(0);
}

if (!DATABASE_URL || DATABASE_URL.startsWith('REPLACE')) {
  console.log('\nℹ️  DATABASE_URL not set — skipping DB push and admin bootstrap.\n');
  process.exit(0);
}

if (!RUN_DB_SYNC) {
  // Not on Vercel but no explicit opt-in — skip silently so normal
  // `npm run dev` and CI builds are not affected.
  console.log(
    '\nℹ️  BLENDIFY_RUN_DB_SYNC not set — skipping DB push and admin bootstrap.\n' +
    '   To run these operations set BLENDIFY_RUN_DB_SYNC=true.\n'
  );
  process.exit(0);
}

// ── Manual DB sync mode (BLENDIFY_RUN_DB_SYNC=true) ───────────────────
// Use DIRECT_URL for prisma db push when available — it bypasses pgBouncer
// and is required for DDL operations. Fall back to DATABASE_URL.
const pushUrl = DIRECT_URL || DATABASE_URL;

console.log('\n🔄 BLENDIFY_RUN_DB_SYNC=true — synchronizing Prisma schema to PostgreSQL...');
console.log(`   Connection: ${DIRECT_URL ? 'DIRECT_URL (direct)' : 'DATABASE_URL (pooler/fallback)'}`);
try {
  execSync(`npx prisma db push --url "${pushUrl}" --accept-data-loss`, { stdio: 'inherit' });
  console.log('✅ Schema synchronized.\n');
} catch (err) {
  console.error('\n❌ prisma db push FAILED. Aborting.\n', err);
  process.exit(1);
}

if (process.env.OWNER_ADMIN_EMAIL && process.env.OWNER_ADMIN_PASSWORD) {
  console.log('🔐 Bootstrapping owner admin account...');
  try {
    execSync('npx tsx scripts/admin-bootstrap.ts', { stdio: 'inherit' });
    console.log('✅ Admin bootstrap complete.\n');
  } catch (err) {
    console.error('\n❌ admin:bootstrap FAILED. Aborting.\n', err);
    process.exit(1);
  }
} else {
  console.log(
    '\n⚠️  OWNER_ADMIN_EMAIL or OWNER_ADMIN_PASSWORD not set — skipping admin bootstrap.\n' +
    '   Run npm run admin:bootstrap separately when credentials are configured.\n'
  );
}
