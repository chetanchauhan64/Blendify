// ============================================================
// BLENDIFY — Prisma v7 Configuration
// Connection URLs live here (not in schema.prisma)
//
// NOTE — Prisma 7.8.0 directUrl support:
//   The @prisma/config Datasource type only exposes { url, shadowDatabaseUrl }.
//   There is no directUrl field in defineConfig() for this version.
//
//   DIRECT_URL is therefore passed via the --url flag when running CLI
//   commands that require a direct (non-pooled) connection:
//     npx prisma db push --url "$DIRECT_URL"
//     npx prisma migrate deploy --url "$DIRECT_URL"
//   See scripts/post-generate.ts and package.json db:push-direct script.
//
// Runtime (Vercel / Next.js server):
//   Uses DATABASE_URL → Supabase Transaction Pooler (port 6543)
//   This is set in Vercel environment variables.
//
// CLI / migrations (local machine only):
//   Uses DIRECT_URL → Supabase Direct PostgreSQL (port 5432)
//   This is set in .env.local and NEVER committed to git.
// ============================================================
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    // This url is used by the Prisma CLI for introspection/studio.
    // For db push / migrate, always pass --url "$DIRECT_URL" explicitly.
    url: process.env.DATABASE_URL ?? '',
  },
});
