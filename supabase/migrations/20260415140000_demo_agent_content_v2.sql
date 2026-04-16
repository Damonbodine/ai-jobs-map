-- supabase/migrations/20260415140000_demo_agent_content_v2.sql
-- v2 table: same structure as demo_agent_content, stores icon-forward short-label content

create table if not exists demo_agent_content_v2 (
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
  constraint uq_demo_content_v2 unique (occupation_id, module_key)
);

create index if not exists idx_demo_agent_content_v2_occupation
  on demo_agent_content_v2 (occupation_id);

alter table demo_agent_content_v2
  add constraint fk_demo_agent_content_v2_occupation
  foreign key (occupation_id) references occupations(id) on delete cascade;

alter table demo_agent_content_v2 enable row level security;
-- No policies = service-role writes only (anon reads blocked).
