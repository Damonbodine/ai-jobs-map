/**
 * Creates the demo_generations table and adds demo_leads.generation_id.
 *
 * Run with: npx tsx scripts/apply-demo-generations-migration.ts
 *
 * Idempotent — uses IF NOT EXISTS throughout, so re-running is safe.
 */
import path from 'path';
import pg from 'pg';

// Load .env.local explicitly so this script works the same way `next dev`
// resolves env vars.
process.loadEnvFile(path.join(process.cwd(), '.env.local'));

const { Client } = pg;

const SQL = `
create table if not exists demo_generations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  task_description text not null,
  occupation_context text,
  generated_role jsonb,
  success boolean not null,
  error text,
  ip_hash text
);

create index if not exists idx_demo_generations_created_at
  on demo_generations (created_at desc);

alter table demo_leads add column if not exists generation_id uuid;
`;

async function main() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Check .env.local.');
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(SQL);
    const check = await client.query(
      `select column_name from information_schema.columns
       where table_name in ('demo_generations', 'demo_leads')
       order by table_name, ordinal_position`
    );
    console.log('Migration applied. Columns:');
    for (const row of check.rows) console.log(' -', row.column_name);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
