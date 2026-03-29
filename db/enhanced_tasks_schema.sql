-- Enhanced Task Data Structure for AI Opportunity Audit
-- This adds business context, proof points, and task characteristics

-- 1. Task Categories (for grouping and filtering)
CREATE TABLE IF NOT EXISTS task_categories (
  id SERIAL PRIMARY KEY,
  category_code TEXT NOT NULL UNIQUE,
  category_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Enhanced Tasks (granular, business-focused tasks)
CREATE TABLE IF NOT EXISTS enhanced_tasks (
  id SERIAL PRIMARY KEY,
  task_code TEXT NOT NULL UNIQUE,
  task_name TEXT NOT NULL,
  task_description TEXT,
  occupation_id INTEGER REFERENCES occupations(id),
  category_id INTEGER REFERENCES task_categories(id),
  
  -- Business Context
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'as_needed')),
  time_per_occurrence_hours DECIMAL(5,2),
  occurrences_per_week DECIMAL(5,2),
  weekly_hours DECIMAL(5,2),
  
  -- Risk & Sensitivity
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  data_sensitivity TEXT CHECK (data_sensitivity IN ('public', 'internal', 'confidential', 'restricted')),
  requires_human_judgment BOOLEAN DEFAULT false,
  has_legal_implications BOOLEAN DEFAULT false,
  
  -- Business Impact
  impact_revenue BOOLEAN DEFAULT false,
  impact_cost BOOLEAN DEFAULT false,
  impact_risk BOOLEAN DEFAULT false,
  impact_quality BOOLEAN DEFAULT false,
  impact_scalability BOOLEAN DEFAULT false,
  
  -- Automation Profile
  automation_readiness TEXT CHECK (automation_readiness IN ('ready_now', 'ready_soon', 'needs_review', 'not_ready')),
  automation_difficulty TEXT CHECK (automation_difficulty IN ('trivial', 'easy', 'moderate', 'hard', 'expert')),
  automation_confidence DECIMAL(3,2) CHECK (automation_confidence >= 0 AND automation_confidence <= 1),
  
  -- Estimated ROI
  estimated_weekly_savings_hours DECIMAL(5,2),
  estimated_weekly_savings_dollars DECIMAL(10,2),
  estimated_monthly_savings_dollars DECIMAL(10,2),
  estimated_annual_savings_dollars DECIMAL(10,2),
  
  -- Dependencies
  prerequisite_task_ids INTEGER[],
  dependent_task_ids INTEGER[],
  
  -- Metadata
  is_core_task BOOLEAN DEFAULT false,
  is_high_value BOOLEAN DEFAULT false,
  sort_priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Task Proof Points (evidence of automation)
CREATE TABLE IF NOT EXISTS task_proof_points (
  id SERIAL PRIMARY KEY,
  enhanced_task_id INTEGER REFERENCES enhanced_tasks(id),
  proof_type TEXT CHECK (proof_type IN ('tool', 'case_study', 'demo', 'testimonial', 'research')),
  
  -- Tool Proof
  tool_name TEXT,
  tool_url TEXT,
  tool_pricing TEXT,
  tool_setup_time TEXT,
  
  -- Case Study Proof
  company_name TEXT,
  company_size TEXT,
  industry TEXT,
  results_description TEXT,
  time_saved_hours DECIMAL(5,2),
  cost_saved_dollars DECIMAL(10,2),
  error_reduction_percent INTEGER,
  
  -- General
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  credibility_score INTEGER CHECK (credibility_score >= 1 AND credibility_score <= 5),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Audit Sessions (track user audits)
CREATE TABLE IF NOT EXISTS audit_sessions (
  id SERIAL PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  
  -- User Info
  email TEXT,
  occupation_id INTEGER REFERENCES occupations(id),
  job_title TEXT,
  industry TEXT,
  company_size TEXT,
  hourly_rate DECIMAL(10,2),
  
  -- Audit Results
  automation_score INTEGER,
  total_weekly_hours DECIMAL(5,2),
  automatable_hours DECIMAL(5,2),
  total_annual_savings DECIMAL(10,2),
  
  -- Selected Tasks
  selected_task_ids INTEGER[],
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Task Automation History (track what's changed)
CREATE TABLE IF NOT EXISTS task_automation_history (
  id SERIAL PRIMARY KEY,
  enhanced_task_id INTEGER REFERENCES enhanced_tasks(id),
  
  -- What changed
  change_type TEXT CHECK (change_type IN ('new_capability', 'improved', 'new_tool', 'case_study_added')),
  change_description TEXT,
  previous_readiness TEXT,
  new_readiness TEXT,
  previous_confidence DECIMAL(3,2),
  new_confidence DECIMAL(3,2),
  
  -- Source
  source_url TEXT,
  source_date DATE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_occupation ON enhanced_tasks(occupation_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_category ON enhanced_tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_readiness ON enhanced_tasks(automation_readiness);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_frequency ON enhanced_tasks(frequency);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_risk ON enhanced_tasks(risk_level);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_savings ON enhanced_tasks(estimated_annual_savings_dollars DESC);
CREATE INDEX IF NOT EXISTS idx_proof_points_task ON task_proof_points(enhanced_task_id);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_occupation ON audit_sessions(occupation_id);

-- Insert task categories
INSERT INTO task_categories (category_code, category_name, description, icon, sort_order) VALUES
('communication', 'Communication', 'Email, messaging, meetings, presentations', '💬', 1),
('analysis', 'Analysis & Research', 'Data analysis, research, reporting', '📊', 2),
('writing', 'Writing & Content', 'Documents, reports, proposals, content creation', '✍️', 3),
('planning', 'Planning & Scheduling', 'Calendar, project planning, scheduling', '📅', 4),
('data_entry', 'Data Entry & Processing', 'Forms, records, data input', '📝', 5),
('finance', 'Finance & Accounting', 'Budgeting, invoicing, financial analysis', '💰', 6),
('sales', 'Sales & Marketing', 'Lead gen, proposals, campaigns', '📈', 7),
('hr', 'HR & People', 'Hiring, onboarding, performance reviews', '👥', 8),
('operations', 'Operations', 'Process management, quality control', '⚙️', 9),
('compliance', 'Compliance & Legal', 'Documentation, audits, regulations', '📋', 10)
ON CONFLICT (category_code) DO NOTHING;
