-- AI Jobs Map - Initial Schema

-- Occupations table
CREATE TABLE IF NOT EXISTS occupations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  major_category TEXT NOT NULL,
  sub_category TEXT,
  employment BIGINT,
  hourly_wage NUMERIC,
  annual_wage NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for search
CREATE INDEX IF NOT EXISTS occupations_slug_idx ON occupations(slug);
CREATE INDEX IF NOT EXISTS occupations_major_category_idx ON occupations(major_category);
CREATE INDEX IF NOT EXISTS occupations_title_idx ON occupations(title);

-- AI Opportunities table
CREATE TABLE IF NOT EXISTS ai_opportunities (
  id SERIAL PRIMARY KEY,
  occupation_id INTEGER NOT NULL REFERENCES occupations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'task_automation',
    'decision_support',
    'research_discovery',
    'communication',
    'creative_assistance',
    'data_analysis',
    'learning_education'
  )),
  impact_level INTEGER NOT NULL CHECK (impact_level BETWEEN 1 AND 5),
  effort_level INTEGER NOT NULL CHECK (effort_level BETWEEN 1 AND 5),
  is_ai_generated BOOLEAN DEFAULT TRUE NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_opportunities_occupation_idx ON ai_opportunities(occupation_id);
CREATE INDEX IF NOT EXISTS ai_opportunities_category_idx ON ai_opportunities(category);

-- Skill Recommendations table
CREATE TABLE IF NOT EXISTS skill_recommendations (
  id SERIAL PRIMARY KEY,
  occupation_id INTEGER NOT NULL REFERENCES occupations(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  learning_resources TEXT,
  priority INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS skill_recommendations_occupation_idx ON skill_recommendations(occupation_id);

-- Public read policies
ALTER TABLE occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on occupations" ON occupations FOR SELECT USING (true);
CREATE POLICY "Allow public read on ai_opportunities" ON ai_opportunities FOR SELECT USING (true);
CREATE POLICY "Allow public read on skill_recommendations" ON skill_recommendations FOR SELECT USING (true);
