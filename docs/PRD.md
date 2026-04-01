# AI Jobs Map — Product Requirements Document

> Full inventory of everything built, for a ground-up rebuild.
> Stack: Next.js 15 + Vercel + Supabase (Drizzle ORM)

---

## 1. What the App Does

AI Jobs Map helps users discover how AI can save time in their specific occupation. Users search from 800+ BLS occupations, see a breakdown of automatable tasks, get a "time-back" estimate (minutes/day AI could save), and optionally configure a multi-agent system tailored to their role.

**Core loop:** Search job → See time-back estimate → Explore agent blueprint → Configure products → Contact

---

## 2. Pages & Routes

### 2.1 Landing / Search (`/ai-jobs`)
- Hero section with autocomplete search (fetches `/api/ai-jobs/search`)
- Quick-start cards for popular occupations
- Category badges linking to `/ai-jobs/category/[category]`
- CTAs to Browse and Products

### 2.2 Browse (`/ai-jobs/browse`)
- Paginated grid of 800+ occupation cards (24/page)
- Sort by: time_back, title, ai_opportunities, coverage
- Filter by major category (19 categories)
- Each card shows: title, category, estimated minutes saved, Pexels photo (with color fallback)

### 2.3 Occupation Detail (`/ai-jobs/[slug]`)
- Largest page (~20K tokens of content)
- Time-back visualization (conservative/optimistic range)
- Micro-tasks list with AI applicability ratings
- O*NET tasks with automation scores
- AI opportunities (approved only) with impact/effort
- Skill recommendations
- Related occupations
- Readiness score + category breakdown
- CTA to products/factory

### 2.4 Category Listing (`/ai-jobs/category/[category]`)
- Filtered occupation grid scoped to one major category

### 2.5 About (`/ai-jobs/about`)
- Static about page

### 2.6 Products (`/products`)
- Three product tiers:
  - **Starter Assistant** — single-agent, basic automation
  - **Workflow Bundle** — multi-agent workflows
  - **Ops Layer** — full orchestration system
- Each tier shows: benefits, examples, trust points, engagement model
- CTAs to factory configurator

### 2.7 Factory / Configurator (`/factory`)
- **Two flows:**
  1. **Generic Wizard** — Role → Pain points → Contact info
  2. **Product Configurator** — Occupation-based: select agents by work block → pick tools → add custom tasks → contact
- Multi-step wizard with progress bar, framer-motion transitions
- Sub-pages:
  - `/factory/build` — Build-specific page
  - `/factory/pipeline` — Pipeline visualization
  - `/factory/audit` — Audit interface
  - `/factory/skills-browser` — Skills discovery
  - `/factory/case-studies` — Case studies
  - `/factory/marketplace` — AI tools/workflows marketplace
  - `/factory/roi` — ROI calculator

### 2.8 Concepts (Experimental)
- `/concepts/dawn` — Dawn concept
- `/concepts/pretext` — Pretext format renderer (uses `@chenglou/pretext`)
- `/concepts/horizon` — Horizon concept

### 2.9 Simple Pages
- `/simple/[slug]` — Dynamic minimal pages with `ZeroBaseClient` component

### 2.10 Root
- `/` redirects to `/ai-jobs`

---

## 3. API Routes

### 3.1 Search (`GET /api/ai-jobs/search`)
- Query params: `q` (search term), `limit`, `offset`, `category`
- Full-text search ranked: exact match → prefix → fuzzy
- Returns: `{ id, title, slug, major_category }`

### 3.2 Browse (`GET /api/ai-jobs/browse`)
- Query params: `page`, `sort`, `category`
- 3-tier fallback query strategy:
  1. `browse_metrics` materialized table
  2. `occupation_coverage` + `automation_profile` join
  3. Calculated fallback from microtask model
- Returns paginated occupation cards with `browse_estimated_minutes`

### 3.3 Occupation Detail (`GET /api/ai-jobs/[slug]`)
- Fetches: occupation data, AI opportunities (approved only), skill recommendations
- Computes: `readinessScore`, category breakdown
- Returns full occupation profile

### 3.4 Autocomplete (`GET /api/ai-jobs/autocomplete`)
- Lightweight prefix search for search input

### 3.5 Compare (`GET /api/ai-jobs/compare`)
- Compare multiple occupations side-by-side

### 3.6 Blueprint (`GET /api/blueprint/[slug]`)
- Generates `AgentBlueprint` for an occupation:
  1. Fetches micro-tasks, O*NET tasks, automation profile
  2. Groups tasks into work blocks (intake, analysis, documentation, coordination, exceptions, learning, research, compliance, communication, data_reporting)
  3. Creates `BlockAgent` per block with tasks, tools, minutes saved
  4. Determines architecture type (single-agent / multi-agent / hub-and-spoke)
  5. Returns `{ occupation, blueprint }` with agents sorted by impact

### 3.7 Factory APIs
- `POST /api/factory/build` — Build/generate a configuration
- `POST /api/factory/recommend` — Generate recommendations
- `GET /api/factory/packages` — Package suggestions
- `POST /api/factory/audit` — Audit/analysis
- `POST /api/factory/orchestrate` — Orchestration endpoint
- `GET /api/factory/skills` — Skills data
- `POST /api/factory/quote` — Generate quotes
- `GET /api/factory/workflows` — Workflow templates

### 3.8 Images
- `GET /api/images/pexels` — Pexels photo search for occupations
- `POST /api/images/generate` — Image generation

### 3.9 Smart Workflows (`GET /api/smart-workflows`)
- Pre-built automation templates mapped to occupations

### 3.10 Analytics (`POST /api/analytics`)
- Tracks funnel events: `landing_viewed`, `role_selected`, `browse_clicked`, `factory_started`, `factory_completed`, etc.
- Creates `ai_funnel_events` table on demand
- Stores: event_name, session_id, path, properties (JSONB)

---

## 4. Database Schema (Drizzle ORM → Supabase PostgreSQL)

### 4.1 Core Tables

#### `occupations`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| title | text | Job title |
| slug | text, unique | URL slug |
| major_category | text | 22 categories |
| sub_category | text? | |
| employment | int? | Worker count |
| hourly_wage | int? | |
| annual_wage | int? | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### `ai_opportunities`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| occupation_id | int FK → occupations | |
| title | text | |
| description | text | |
| category | enum | task_automation, decision_support, research_discovery, communication, creative_assistance, data_analysis, learning_education |
| impact_level | int 1-5 | |
| effort_level | int 1-5 | |
| is_ai_generated | bool | default true |
| is_approved | bool | default false |
| source | text? | |

#### `skill_recommendations`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| occupation_id | int FK | |
| skill_name | text | |
| skill_description | text | |
| difficulty | text | beginner/intermediate/advanced |
| learning_resources | text? | |
| priority | int | default 0 |

#### `job_micro_tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| occupation_id | int FK | |
| task_name | text | |
| task_description | text | |
| frequency | text | daily/weekly/monthly/as-needed |
| ai_applicable | bool | default true |
| ai_how_it_helps | text? | |
| ai_impact_level | int 1-5? | |
| ai_effort_to_implement | int 1-5? | |
| ai_category | enum? | Same as ai_opportunities.category |
| ai_tools | text? | JSON array of tool names |

### 4.2 O*NET Tables

#### `onet_tasks`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| onet_soc_code | text | SOC code |
| task_id | text | |
| task_title | text | |
| task_description | text | |
| task_type | text | Core / Supplemental |
| occupation_id | int FK? | |
| ai_automatable | bool? | |
| ai_automation_score | int 0-100? | |
| ai_difficulty | text | easy/medium/hard |
| estimated_time_saved_percent | int 0-100 | |
| ai_tools | text? | JSON array |
| dwa_id | text? | Detailed Work Activity ID |
| dwa_title | text | |
| iwa_id | text? | Intermediate Work Activity |
| gwa_title | text? | General Work Activity |

#### `onet_abilities`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| onet_soc_code | text | |
| element_id | text | |
| element_name | text | |
| importance | real | IM scale 1-5 |
| level | real | LV scale 0-7 |
| occupation_id | int FK? | |

#### `onet_knowledge`
Same structure as `onet_abilities`.

#### `onet_work_activities`
Same structure as `onet_abilities`.

#### `detailed_work_activities`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| dwa_id | text, unique | |
| dwa_title | text | |
| iwa_id | text? | |
| iwa_title | text? | |
| gwa_title | text? | |
| automation_template | text? | JSON |
| applicable_tools | text? | JSON array |
| occupation_count | int | default 0 |
| avg_automation_score | int? | |

#### `tasks_to_dwas` (mapping)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| task_id | text | |
| onet_soc_code | text | |
| dwa_id | text | |
| occupation_id | int FK? | |

### 4.3 Automation Profiles

#### `occupation_automation_profile`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| occupation_id | int FK, unique | |
| composite_score | real 0-100 | |
| ability_automation_potential | real 0-1? | |
| work_activity_automation_potential | real 0-1 | |
| keyword_score | real 0-1 | |
| knowledge_digital_readiness | real 0-1 | |
| task_frequency_weight | real 0-1 | |
| physical_ability_avg | real? | |
| cognitive_routine_avg | real? | |
| cognitive_creative_avg | real? | |
| top_automatable_activities | text | JSON array |
| top_blocking_abilities | text | JSON array |
| time_range_low | int | Minutes/day conservative |
| time_range_high | int | Minutes/day optimistic |
| time_range_by_block | text | JSON: `{intake: {low, high}, analysis: {low, high}, ...}` |

#### `automation_benchmarks`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| occupation_id | int FK? | |
| source | text | frey_osborne_2017, oecd_2019, mckinsey_2017 |
| external_score | real 0-1 | Probability of automation |
| soc_code | text? | |
| notes | text? | |

### 4.4 AI Tools & Workflows

#### `ai_tools`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| tool_name | text | |
| vendor | text? | |
| category | text | document_ai, analytics, communication, etc. |
| capabilities | text | JSON array |
| pricing_model | text | free/freemium/subscription/usage |
| monthly_cost_low | int? | |
| monthly_cost_high | int? | |
| url | text? | |
| dwa_categories | text | JSON: which GWA categories served |

#### `smart_workflows`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| source_template_id | text, unique | |
| name | text | |
| description | text | |
| source_url | text? | |
| category | text | |
| tags | text | JSON array |
| integrations | text | JSON array |
| integration_count | int | default 0 |
| trigger_type | text | webhook/schedule/manual/email |
| complexity | text | beginner/intermediate/advanced |
| estimated_hours_saved | real? | |
| is_active | bool | default true |

#### `smart_workflow_occupation_mappings`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| workflow_id | int FK | |
| occupation_id | int FK? | |
| major_category | text? | |
| skill_code_prefix | text? | |
| automation_solution_key | text | intake/analysis/documentation/coordination/exceptions |
| relevance_score | real | default 0.5 |
| mapping_source | text | default auto_keyword |

#### `smart_workflow_internal_mappings`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| workflow_id | int FK | |
| internal_workflow_code | text | |
| relationship | text | reference/alternative/extension |

### 4.5 Metadata

#### `pipeline_runs`
Tracks ETL/script execution: stage, status (running/completed/failed), records_processed, error_message, timestamps.

#### `data_versions`
Tracks data source versions: source name, version string, import date, record_count, checksum.

#### `ai_funnel_events` (created on demand)
Analytics events: event_name, session_id, path, properties (JSONB), timestamp.

---

## 5. Domain Logic (lib/)

### 5.1 Occupation Archetypes (`lib/ai-jobs/archetypes.ts`)
Classifies occupations by physical demands:
- **desk_digital** — timeBackMultiplier: 1.0 (full AI potential)
- **mixed** — timeBackMultiplier: 0.6
- **physical** — timeBackMultiplier: 0.3
- **unknown** — timeBackMultiplier: 0.5

Uses `physical_ability_avg` from automation profile to classify.

### 5.2 Time-Back Calculation (`lib/ai-jobs/timeback.ts`)
- `deriveBlendedTimeBack()` — Blends signals from O*NET, workflows, micro-tasks, and blueprints into `displayMinutes`, `rangeLow`, `rangeHigh`
- `deriveBlockMidpointRange()` — Per-block time estimates

### 5.3 Categories (`lib/ai-jobs/categories.ts`)
- 19 occupation categories with slugs, DB values, and display labels
- `normalizeOccupationCategory()` — Maps raw BLS categories to normalized slugs

### 5.4 Blueprint Generation (`lib/ai-blueprints/`)

#### Types
- `ArchitectureType`: single-agent | multi-agent | hub-and-spoke
- `AiPattern`: autonomous-agent | rag-system | structured-output | multimodal | scheduled-monitor | workflow-orchestrator
- `AutomationTier`: automated | assisted | human-only
- `TaskSpec`, `BlockAgent`, `AgentBlueprint`

#### Generation Pipeline (`generate-blueprint.ts`)
1. Add universal quick-wins if < 3 AI-applicable tasks (email, meetings, docs, scheduling, research)
2. Enrich with O*NET tasks (automation_score >= 40)
3. Classify each task tier (automated / assisted / human-only)
4. Group into 10 work blocks: intake, analysis, documentation, coordination, exceptions, learning, research, compliance, communication, data_reporting
5. Build `BlockAgent` per block with minutesSaved, toolAccess, taskSpecs
6. Determine architecture (single/multi/hub-and-spoke by agent count)
7. Determine orchestration pattern (event-driven / scheduled / parallel) + human checkpoints
8. Compute total impact
9. Return `AgentBlueprint`

#### Constants (`constants.ts`)
- Category → AI pattern mappings
- Block → default pattern fallbacks
- Tool normalization (ChatGPT→LLM, Outlook→Email, etc.)
- Block → role description templates
- Block → pain point ID mappings

### 5.5 Analytics (`lib/analytics/client.ts`)
- `trackEvent(eventName, properties)` — POSTs to `/api/analytics`
- Session ID via sessionStorage (random UUID)
- Uses `navigator.sendBeacon` with fetch fallback

### 5.6 Database Connection (`lib/db/`)
- `pool.ts` — Custom adapter: uses Supabase `exec_sql` RPC on Vercel, raw `pg` Pool locally
- `index.ts` — Drizzle instance with full schema
- `schema.ts` — All table definitions (30+ tables)

---

## 6. Components

### 6.1 UI Primitives (shadcn-based)
- `button` — Variants: primary, secondary, ghost, etc.
- `card` — Container with padding/border
- `input` / `input-group` / `textarea` — Form inputs
- `badge` — Pill/tag
- `separator` — Divider
- `select` / `native-select` — Dropdowns
- `tabs` — Tab navigation
- `dialog` — Modal
- `sheet` — Side panel
- `command` — Command palette (cmdk)
- `skeleton` — Loading placeholder
- `stat-card` / `stat-ring` — Data display
- `count-up` — Animated number counter
- `page-header` — Page title section
- `header` — Sticky nav (Map / Products / About / Browse)
- `footer` — Site footer
- `fade-in` — Framer-motion fade animation
- `insight-card` — Information card

### 6.2 Media
- `category-image` — Category-specific image
- `pexels-image` — Pexels API photo with generated-color fallback

### 6.3 Occupation Feature Components
- `time-back-chart` — Time savings visualization
- `day-chart` — Daily breakdown chart
- `day-value-map` — Value-mapped day view
- `roi-calculator` — ROI calculation interface

### 6.4 Factory Components
- `agent-selector` — Select/deselect agents by work block
- `tool-picker` — Choose tools per agent
- `custom-tasks` — Add custom task inputs

### 6.5 Blueprint Components
- `impact-summary` — Total agent impact / time-back summary
- `agent-card` — Single agent detail card
- `architecture-overview` — Multi-agent architecture diagram
- `blueprint-section` — Section wrapper

### 6.6 Smart Workflows
- `workflow-card` — Workflow template display card

### 6.7 Analytics
- `track-page-view` — Server component, tracks page views
- `tracked-link` — Link wrapper that fires analytics events

---

## 7. Design System

### Fonts
- **Heading:** Newsreader (serif)
- **Body:** Manrope (sans-serif)

### Color System (CSS Variables)
- `--surface` — Warm white background
- `--ink` — Text color
- `--edge` — Borders
- `--panel` — Card/panel backgrounds
- `--accent` — Blue accent color
- Theme name: "Recovery Ink"

### Animation
- Framer Motion for page transitions, staggered reveals, fade-ins

### Styling
- Tailwind CSS v4 with `@tailwindcss/postcss`
- `tw-animate-css` for animation utilities
- `class-variance-authority` for component variants
- `clsx` + `tailwind-merge` via `cn()` utility

---

## 8. Data Sources

### 8.1 BLS (Bureau of Labor Statistics)
- **File:** `bls_occupations.csv`
- **Columns:** id, major_category, occupation, ai_opportunities, ai_readiness, notes
- **Records:** 800+ occupations
- **Contains:** Job titles, 22 major categories, wage data, employment counts
- **Ingested by:** `scripts/seed-occupations.ts` (parses CSV, slugifies titles, upserts)

### 8.2 O*NET (Occupational Information Network)
Source: [O*NET OnLine](https://www.onetonline.org/) — U.S. Department of Labor

**Excel files in `data/onet/`:**

| File | Target Table | What It Contains |
|------|-------------|------------------|
| `Abilities.xlsx` | `onet_abilities` | 52 abilities per occupation with Importance (1-5) + Level (0-7) scales |
| `Knowledge.xlsx` | `onet_knowledge` | Knowledge domains per occupation with Importance + Level |
| `Work_Activities.xlsx` | `onet_work_activities` | Generalized Work Activities (GWAs) per occupation |
| `Skills.xlsx` | `onet_skills` | Skills data (Importance scale) |
| `Tasks_to_DWAs.xlsx` | `tasks_to_dwas` | Maps task statements → Detailed Work Activities |

**Scraped from O*NET OnLine:**
- Task statements per occupation (Core + Supplemental) — scraped via `scripts/import-onet-tasks.py` and `scripts/scrape-onet-tasks.py`
- URL pattern: `https://www.onetonline.org/link/summary/{soc_code}`
- Slug-to-SOC-code mapping maintained in scripts

### 8.3 Automation Benchmarks (Academic Research)
Seeded via `scripts/seed_benchmarks.py` from published studies:

| Source | What | Format |
|--------|------|--------|
| **Frey & Osborne (2017)** — "The Future of Employment" | Probability of computerisation (0-1) per occupation | Hardcoded lookup table |
| **OECD (2019)** | Automation risk scores | Hardcoded lookup table |

Used as **calibration signals** — if the app's composite score diverges significantly from published research, the occupation gets flagged for review.

### 8.4 Scoring Methodology (`data/scoring-methodology.json`)
Configuration for the composite automation scoring engine:

**Dimension weights:**
| Dimension | Weight |
|-----------|--------|
| Ability (O*NET abilities × AI performance scores) | 0.30 |
| Work Activity (GWA automation potential) | 0.25 |
| Keyword (title/description keyword matching) | 0.20 |
| Knowledge (digital readiness of knowledge domains) | 0.15 |
| Frequency (task frequency weighting) | 0.10 |

**AI ability scores:** Maps each O*NET ability element ID (e.g., `1.A.1.a.1` = Oral Comprehension → 0.80) to an AI performance score (0-1) with rationale. Covers:
- Cognitive verbal, reasoning, quantitative, memory, perceptual, spatial, attention
- Psychomotor abilities (generally low AI scores)
- Physical abilities (near-zero AI scores)

---

## 9. Data Pipeline

### 9.1 Pipeline Orchestrator (`scripts/pipeline/orchestrator.py`)
Single entry point for the entire data pipeline with stage-based DAG execution:

```
python scripts/pipeline/orchestrator.py              # Full pipeline
python scripts/pipeline/orchestrator.py --stage score # From 'score' forward
python scripts/pipeline/orchestrator.py --validate    # Validators only
python scripts/pipeline/orchestrator.py --dry-run     # Show what would run
```

**Pipeline DAG (dependency order):**

```
seed (BLS CSV → occupations table)
  ├── import_abilities    ─┐
  ├── import_knowledge     ├─ parallel_group: 'import'
  ├── import_work_activities│
  ├── import_skills        │
  └── import_tasks        ─┘
         │
         ▼
      score (composite automation scores)
         │
         ├── generate_factory (actions, workflows, packages from DWA patterns)
         │      │
         │      └── calculate_coverage (occupation coverage metrics)
         │
         └── validate (data quality checks)
```

Each stage is recorded in `pipeline_runs` table (status: running/completed/failed).

### 9.2 Pipeline Infrastructure (`scripts/pipeline/`)

| File | Purpose |
|------|---------|
| `orchestrator.py` | DAG runner with stage dependencies, dry-run, resume from stage |
| `db.py` | Shared DB connection, `get_occupation_lookup()`, `match_occupation()` |
| `import_onet_dimension.py` | Generic importer for O*NET Excel files (abilities/knowledge/work activities) |
| `validators.py` | Data quality checks post-pipeline |
| `__init__.py` | Package init |

### 9.3 All Scripts

#### Seeding & Import (TypeScript)
| Script | Purpose |
|--------|---------|
| `seed-occupations.ts` | Parse `bls_occupations.csv`, upsert 800+ occupations with slugs |
| `generate-microtasks.ts` | Generate `job_micro_tasks` per occupation (AI-generated) |
| `generate-ai-opportunities.ts` | Generate `ai_opportunities` per occupation (AI-generated) |
| `generate-skill-recommendations.ts` | Generate `skill_recommendations` (AI-generated) |
| `fetch-smart-workflows.ts` | Fetch external workflow templates into `smart_workflows` |
| `seed-occupation-images.ts` | Seed Pexels images for occupation cards |
| `refresh-browse-metrics.ts` | Refresh materialized browse metrics for fast pagination |

#### O*NET Import & Scoring (Python)
| Script | Purpose |
|--------|---------|
| `import_onet_abilities.py` | Import Abilities.xlsx → `onet_abilities` |
| `import_onet_knowledge.py` | Import Knowledge.xlsx → `onet_knowledge` |
| `import_onet_work_activities.py` | Import Work_Activities.xlsx → `onet_work_activities` |
| `import_onet_skills.py` | Import Skills.xlsx → skills tables |
| `import-onet-tasks.py` | Scrape O*NET OnLine tasks + AI-score them |
| `import_onet_dwas.py` | Import Detailed Work Activities mappings |
| `scrape-onet-tasks.py` | Earlier/alternate O*NET task scraper with SOC code mappings |
| `calculate_composite_scores.py` | Calculate `occupation_automation_profile` composite scores using `scoring-methodology.json` weights |
| `calculate_time_ranges.py` | Calculate O*NET-grounded time ranges (conservative/optimistic min/day) per occupation |
| `calculate_coverage.py` | Calculate occupation coverage metrics |

#### Factory & Enhancement (Python)
| Script | Purpose |
|--------|---------|
| `generate_factory.py` | Generate actions, workflows, packages from DWA patterns |
| `populate-factory.py` | Populate factory data based on O*NET DWA automation patterns |
| `generate_enhanced_tasks.py` | Enrich O*NET tasks with DWA mappings, automation approaches, tool suggestions |
| `decompose_tasks.py` | Decompose tasks into sub-steps |
| `decompose_tasks_v2.py` | V2 task decomposition |
| `map_tasks_to_actions.py` | Map O*NET tasks to automation actions |
| `aggregate_skill_profiles.py` | Aggregate skill data into occupation profiles |
| `seed_ai_tools.py` | Seed `ai_tools` table with tool catalog |
| `seed_benchmarks.py` | Seed Frey & Osborne / OECD benchmark data |
| `self_healing_bot.py` | Data quality auto-fixer |

#### Shell
| Script | Purpose |
|--------|---------|
| `run_full_decomposition.sh` | Run full task decomposition pipeline end-to-end |
| `preview-fresh.sh` | Clean preview build on specified port |

---

## 10. Third-Party Integrations

| Service | Usage |
|---------|-------|
| **Supabase** | PostgreSQL hosting, `exec_sql` RPC for Vercel IPv4 compat |
| **Pexels API** | Occupation photos with fallback colors |
| **Vercel** | Deployment, environment variables, edge network |
| **Drizzle ORM** | Type-safe database queries + migrations |
| **OpenRouter** | AI generation (referenced in `.env.example` as `OPENROUTER_API_KEY`) |

---

## 11. Auth & Access Control

**None.** All pages and APIs are publicly accessible. The factory wizard collects email at the end as a lead-capture step, but there are no protected routes or user accounts.

---

## 12. Analytics & Funnel

Tracked events:
- `landing_viewed`
- `role_selected`
- `browse_clicked`
- `factory_started`
- `factory_completed`
- (and others)

Session-based (anonymous UUID in sessionStorage), stored in `ai_funnel_events` table.

---

## 13. Testing

- **Framework:** Vitest + @testing-library/react + jsdom/happy-dom
- **Test locations:**
  - `lib/workflows/__tests__/workflows.test.ts`
  - `lib/agents/__tests__/agents.test.ts`
  - `lib/orchestration/__tests__/skill-mapper.test.ts`
  - `app/api/factory/build/__tests__/route.test.ts`

---

## 14. Dependencies (package.json)

### Runtime
| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.5.14 | Framework |
| react / react-dom | 19.2.4 | UI |
| drizzle-orm | 0.38.4 | ORM |
| pg | 8.20.0 | PostgreSQL driver |
| @neondatabase/serverless | 0.10.4 | Serverless PG (fallback) |
| @supabase/supabase-js | 2.101.1 | Supabase client |
| tailwindcss | 4.2.2 | Styling |
| framer-motion | 12.38.0 | Animations |
| lucide-react | 1.7.0 | Icons |
| recharts | 3.8.1 | Charts |
| shadcn | 4.1.1 | Component CLI |
| cmdk | 1.1.1 | Command palette |
| @base-ui/react | 1.3.0 | Base UI primitives |
| @floating-ui/react | 0.27.19 | Positioning |
| csv-parse | 5.6.0 | CSV parsing |
| xlsx | 0.18.5 | Excel parsing |
| class-variance-authority | 0.7.1 | Component variants |
| clsx | 2.1.1 | Class merging |
| tailwind-merge | 3.5.0 | Tailwind class dedup |
| tw-animate-css | 1.4.0 | Animation utilities |
| @chenglou/pretext | 0.0.3 | Pretext rendering |

### Dev
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.9.3 | Type checking |
| tsx | 4.21.0 | Script runner |
| drizzle-kit | 0.30.6 | DB migrations |
| vitest | 4.1.2 | Testing |
| @testing-library/* | various | Component testing |
| jsdom / happy-dom | various | Test DOM |

---

## 15. Config Files

| File | Purpose |
|------|---------|
| `next.config.js` | Remote image patterns (unsplash), strict mode |
| `tailwind.config.js` | Content paths for purging |
| `postcss.config.js` | `@tailwindcss/postcss` plugin |
| `tsconfig.json` | Strict TS, `@/*` path alias, ES2017 target |
| `drizzle.config.ts` | Schema path, PostgreSQL dialect, `DATABASE_URL` |
| `components.json` | shadcn config: base-nova style, RSC enabled |

---

## 16. Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `OPENROUTER_API_KEY` | AI generation via OpenRouter |
| `PEXELS_API_KEY` | Occupation photos (implied) |
| `SUPABASE_URL` | Supabase project URL (implied) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (implied) |

---

## 17. User Flow Summary

```
Landing Page (/ai-jobs)
  ├── Search → Occupation Detail (/ai-jobs/[slug])
  │     ├── View time-back, tasks, opportunities
  │     └── CTA → Products or Factory
  ├── Browse → Grid (/ai-jobs/browse)
  │     └── Click card → Occupation Detail
  └── Category → Filtered grid (/ai-jobs/category/[cat])

Products (/products)
  └── Pick tier → Factory

Factory (/factory)
  ├── Generic Wizard: Role → Pain points → Contact
  └── Configurator: Select agents → Pick tools → Custom tasks → Contact
```
