-- supabase/migrations/20260415120000_demo_agent_content.sql

create table if not exists demo_agent_content (
  id            bigserial primary key,
  occupation_id bigint not null,
  module_key    text   not null,
  agent_name    text   not null,
  label         text   not null,
  accent_color  text   not null,
  time_of_day   text   not null,
  narrative     text   not null,
  loop_data     jsonb  not null,
  output_data   jsonb  not null,
  created_at    timestamptz not null default now(),
  constraint uq_demo_content unique (occupation_id, module_key)
);

create index if not exists idx_demo_agent_content_occupation
  on demo_agent_content (occupation_id);
