# Supabase → Neon Migration — Design

**Date:** 2026-07-03
**Goal:** Move the app's Postgres backend from Supabase (hosted project `nhjwpmfcpbfbzcaookkw` + local Docker stack) to Neon, so the Supabase project can be deleted.

## Current state (verified)

- App code is already migrated to Drizzle ORM over plain `pg` (`lib/db/client.ts`, `lib/db/schema.ts`), uncommitted in the working tree. `lib/supabase/*` is deleted. All 8 API routes and 7 pages use Drizzle.
- The Drizzle schema models all 27 hosted tables plus `demo_leads`.
- `DATABASE_URL` in `.env.local` points at the local Supabase Docker stack (`127.0.0.1:54322`), which is nearly empty.
- The **hosted Supabase DB is the source of truth**: 27 tables in `public`, ~44 MB, ~146k rows — O*NET/BLS reference data (`onet_abilities` 31k, `onet_work_activities` 25k, `onet_knowledge` 20k, `tasks_to_dwas` 16k, `onet_tasks` 15k, …) plus real form submissions (7 `contact_messages`, 6 `team_inquiry_requests`, 6 `one_pager_requests`).
- Reachable via pooler: `aws-1-us-east-1.pooler.supabase.com:6543`, user `postgres.nhjwpmfcpbfbzcaookkw`, password = `SUPABASE_PASSWORD` in `.env.local`.
- Remaining Supabase ties: `@supabase/supabase-js` dependency; 9 scripts in `scripts/` importing it; `.env` examples; privacy/security page copy naming Supabase as sub-processor; stale comments in two routes.

## Approach (chosen)

**Vercel Marketplace Neon (Free plan) + `pg_dump`/restore.**

- Free plan fits: 44 MB ≪ 0.5 GB storage limit; scale-to-zero suits a read-mostly ISR site. $0 unless upgraded.
- Alternatives rejected: direct neon.tech account (extra account to manage, no benefit here); re-seeding from pipeline scripts (riskier than a faithful dump).

## Steps

1. **Provision** Neon via Vercel Marketplace (Free plan), connect to the ai-jobs-map Vercel project (auto-injects `DATABASE_URL`), pull connection string locally.
2. **Migrate data**: `pg_dump` hosted Supabase `public` schema (schema + data, no Supabase-specific schemas/roles) → restore into Neon. Verify per-table row counts match across all 27 tables.
3. **Point app at Neon**: update `.env.local` `DATABASE_URL`; smoke-test `/browse`, `/occupation/[slug]`, `/demo`, and one form write locally.
4. **Code cleanup**: port the 9 `scripts/*.ts` supabase-js scripts to Drizzle/pg; remove `@supabase/supabase-js`; update `.env.local.example` / `.env.example`; fix stale comments in `app/api/contact/route.ts` and `app/api/demo/lead/route.ts`.
5. **Legal copy**: update `app/privacy/page.tsx` and `app/security/page.tsx` to name Neon instead of Supabase.
6. **Commit + deploy**: commit the working-tree migration + this work; remove Supabase env vars from Vercel; verify production deploy against Neon.
7. **Decommission**: keep a final `pg_dump` backup file; user deletes the Supabase project from the dashboard (manual, user-owned).

## Error handling / verification

- Row-count parity check across all tables after restore; spot-check a few content rows.
- Existing test suite (`pnpm test`) + `pnpm build` must pass before commit.
- Keep the dump file until the user confirms production works and deletes Supabase.

## Out of scope

- Pushing the 35 unpushed local commits (user decision).
- Any schema redesign; this is a lift-and-shift.
