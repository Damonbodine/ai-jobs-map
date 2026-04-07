-- 2026-04-06-contact-messages.sql
-- Stores submissions from the /contact page form.
-- Separate from assistant_inquiries (which is for occupation-builder leads)
-- so the two lead sources stay cleanly partitioned for CRM reporting.

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  source text not null default 'contact-page',
  -- Operational fields
  user_agent text,
  ip_hash text, -- sha256 of IP, never the raw IP
  -- Lifecycle
  responded_at timestamptz,
  responded_by text
);

create index if not exists contact_messages_created_at_idx
  on contact_messages (created_at desc);

create index if not exists contact_messages_email_idx
  on contact_messages (email);

-- RLS: nobody reads from the client; only the server-side service role key
-- (used in /api/contact) writes. Lock it down.
alter table contact_messages enable row level security;

-- No policies = no client access. Intentional.
