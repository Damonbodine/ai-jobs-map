-- 2026-04-07-one-pager-requests.sql
-- Stores email-gated "Download One-Pager for your Team" captures from
-- /occupation/[slug] pages. Intentionally separate from
-- contact_messages (contact form) and assistant_inquiries (builder)
-- so CRM reporting can distinguish capture intent by table.

create table if not exists one_pager_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  occupation_slug text not null,
  occupation_title text,
  -- Operational fields
  user_agent text,
  ip_hash text,
  -- Delivery tracking
  pdf_sent_at timestamptz,
  pdf_send_error text
);

create index if not exists one_pager_requests_email_idx
  on one_pager_requests (email);
create index if not exists one_pager_requests_occupation_idx
  on one_pager_requests (occupation_slug);
create index if not exists one_pager_requests_created_at_idx
  on one_pager_requests (created_at desc);

alter table one_pager_requests enable row level security;
-- No policies = service-role writes only.
