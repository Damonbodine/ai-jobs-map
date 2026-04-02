-- Module Capabilities - the bridge between modules and specific deliverables

CREATE TABLE IF NOT EXISTS module_capabilities (
  id SERIAL PRIMARY KEY,
  module_key TEXT NOT NULL,
  capability_key TEXT NOT NULL UNIQUE,
  capability_name TEXT NOT NULL,
  description TEXT NOT NULL,
  example_tasks TEXT[] NOT NULL DEFAULT '{}',
  likely_systems TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS module_capabilities_module_key_idx ON module_capabilities(module_key);

-- Task-to-capability mappings
CREATE TABLE IF NOT EXISTS task_capability_mappings (
  id SERIAL PRIMARY KEY,
  micro_task_id INTEGER NOT NULL REFERENCES job_micro_tasks(id) ON DELETE CASCADE,
  capability_key TEXT NOT NULL REFERENCES module_capabilities(capability_key) ON DELETE CASCADE,
  confidence REAL NOT NULL DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(micro_task_id, capability_key)
);

CREATE INDEX IF NOT EXISTS task_capability_mappings_task_idx ON task_capability_mappings(micro_task_id);
CREATE INDEX IF NOT EXISTS task_capability_mappings_capability_idx ON task_capability_mappings(capability_key);
