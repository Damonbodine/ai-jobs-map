create table if not exists team_inquiry_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_email text not null,
  contact_name text,
  -- Per-role selection: [{slug, count, selectedModules, selectedTaskIds}]
  roles_json jsonb not null,
  team_size text,
  tier text,
  custom_requests jsonb,
  -- Computed totals snapshot
  total_people int,
  total_minutes_per_day int,
  total_annual_value int,
  fte_equivalents numeric(5,1),
  -- Metadata
  user_agent text,
  ip_hash text,
  -- Delivery
  pdf_sent_at timestamptz,
  pdf_send_error text
);

create index if not exists team_inquiry_requests_email_idx
  on team_inquiry_requests (contact_email);
create index if not exists team_inquiry_requests_created_at_idx
  on team_inquiry_requests (created_at desc);

alter table team_inquiry_requests enable row level security;
