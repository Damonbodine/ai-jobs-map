/**
 * Applies supabase/migrations/2026-04-07-department-roi-requests.sql against the
 * live database via the standard `pg` Client + DATABASE_URL pattern used by
 * scripts/seed-occupations.ts.
 *
 * Run with: npx tsx scripts/apply-department-roi-migration.ts
 *
 * This script is idempotent — the migration uses `create table if not exists`
 * and `create index if not exists`, so re-running is safe.
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load .env.local explicitly so this script works the same way `next dev`
// resolves env vars (DATABASE_URL, SUPABASE_*, etc).
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const { Client } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Check .env.local.');
  }

  const migrationPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    '2026-04-07-department-roi-requests.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('Applying migration: 2026-04-07-department-roi-requests.sql');
    await client.query(sql);
    console.log('Migration applied.');

    // Verify the table exists with the expected columns.
    const verify = await client.query(
      `select column_name, data_type, is_nullable
         from information_schema.columns
        where table_schema = 'public'
          and table_name = 'department_roi_requests'
        order by ordinal_position`
    );

    if (verify.rowCount === 0) {
      throw new Error('Verification failed: department_roi_requests not found.');
    }

    console.log(`\nVerified department_roi_requests (${verify.rowCount} columns):`);
    for (const row of verify.rows) {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable=${row.is_nullable})`);
    }

    // Sanity-check RLS is enabled.
    const rls = await client.query(
      `select relrowsecurity
         from pg_class
        where relname = 'department_roi_requests'
          and relnamespace = 'public'::regnamespace`
    );
    console.log(`\nRLS enabled: ${rls.rows[0]?.relrowsecurity === true}`);

    // And confirm a count works (proves service-role access).
    const count = await client.query('select count(*)::int as n from department_roi_requests');
    console.log(`Row count: ${count.rows[0].n}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
