-- Add FK constraint and enable RLS on demo_agent_content
-- (Missed in the initial migration)

alter table demo_agent_content
  add constraint fk_demo_agent_content_occupation
  foreign key (occupation_id) references occupations(id) on delete cascade;

alter table demo_agent_content enable row level security;
-- No policies = service-role writes only (anon reads blocked).
