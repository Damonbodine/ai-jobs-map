-- Structured assistant inquiry capture
-- Replaces the thin submit-config payload with full module diff tracking

CREATE TABLE IF NOT EXISTS assistant_inquiries (
  id SERIAL PRIMARY KEY,
  occupation_id INTEGER REFERENCES occupations(id),
  occupation_title TEXT,
  occupation_slug TEXT,
  recommended_modules TEXT[] NOT NULL DEFAULT '{}',
  selected_modules TEXT[] NOT NULL DEFAULT '{}',
  added_modules TEXT[] NOT NULL DEFAULT '{}',
  removed_modules TEXT[] NOT NULL DEFAULT '{}',
  selected_capabilities TEXT[] NOT NULL DEFAULT '{}',
  custom_requests TEXT[] NOT NULL DEFAULT '{}',
  pain_points TEXT[] NOT NULL DEFAULT '{}',
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  tier TEXT,
  source TEXT NOT NULL DEFAULT 'blueprint',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS assistant_inquiries_occupation_idx ON assistant_inquiries(occupation_id);
CREATE INDEX IF NOT EXISTS assistant_inquiries_created_idx ON assistant_inquiries(created_at DESC);
