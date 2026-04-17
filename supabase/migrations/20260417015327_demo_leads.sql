-- supabase/migrations/20260417015327_demo_leads.sql
-- Leads captured from the /demo/try page. Each row is a prospect who ran
-- a custom-task demo and optionally shared an email for a PDF follow-up.

create table if not exists demo_leads (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  email               text,
  task_description    text not null,
  occupation_context  text,
  ip_hash             text
);

create index if not exists idx_demo_leads_created_at
  on demo_leads (created_at desc);

alter table demo_leads enable row level security;
-- No policies = service-role writes only. Anon/public cannot read the list.
