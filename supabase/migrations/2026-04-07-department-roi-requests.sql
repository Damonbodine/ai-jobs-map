-- 2026-04-07-department-roi-requests.sql
-- Stores email-gated PDF download captures from /build-a-team.
-- Separate from contact_messages, assistant_inquiries, and
-- one_pager_requests so CRM reporting can attribute revenue to
-- the four lead sources independently.

create table if not exists department_roi_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  team_label text,
  -- The cart at submission time, stored as JSONB for ad-hoc analysis.
  -- Shape: [{ "slug": "registered-nurses", "count": 3 }, ...]
  cart jsonb not null,
  -- Snapshot of the computed totals so we don't have to recompute
  -- when reviewing leads.
  total_people int,
  total_minutes_per_day int,
  total_annual_value int,
  fte_equivalents numeric(5,1),
  -- Operational fields
  user_agent text,
  ip_hash text,
  -- Delivery tracking
  pdf_sent_at timestamptz,
  pdf_send_error text
);

create index if not exists department_roi_requests_email_idx
  on department_roi_requests (email);
create index if not exists department_roi_requests_created_at_idx
  on department_roi_requests (created_at desc);

alter table department_roi_requests enable row level security;
-- No policies = service-role writes only.
