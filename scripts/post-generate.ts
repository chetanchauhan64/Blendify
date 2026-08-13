// ============================================================
// BLENDIFY — scripts/post-generate.ts
// Runs schema sync & admin bootstrap automatically during deployment
// if DATABASE_URL and owner credentials are provided.
// ============================================================
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const DATABASE_URL = process.env.DATABASE_URL;

if (DATABASE_URL && !DATABASE_URL.startsWith('REPLACE')) {
  console.log('\n🔄 DATABASE_URL detected. Synchronizing Prisma schema to PostgreSQL...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Schema synchronized.\n');
  } catch (err) {
    console.error('⚠️  prisma db push encountered an issue:', err);
  }

  if (process.env.OWNER_ADMIN_EMAIL && process.env.OWNER_ADMIN_PASSWORD) {
    console.log('🔐 Bootstrapping owner admin account...');
    try {
      execSync('npx tsx scripts/admin-bootstrap.ts', { stdio: 'inherit' });
    } catch (err) {
      console.error('⚠️  admin:bootstrap encountered an issue:', err);
    }
  }
} else {
  console.log('\nℹ️  DATABASE_URL not set — skipping DB push and admin bootstrap.\n');
}
