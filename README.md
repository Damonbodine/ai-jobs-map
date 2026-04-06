# AI Jobs Map

Discover how AI can transform any career. Search 800+ occupations to find AI-powered opportunities and skill recommendations.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (Neon PostgreSQL)
- **ORM**: Drizzle
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### 1. Install dependencies

```bash
cd apps/ai-jobs
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
# Optional: set NEXT_PUBLIC_ENABLE_DARK_MODE=true to re-enable dark mode
```

### 3. Run migrations

```bash
npm run db:push
```

### 4. Seed the database

```bash
npm run db:seed
```

### 5. Start development

```bash
npm run dev
```

## Database Schema

### occupations
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| title | text | Job title |
| slug | text | URL-friendly slug (unique) |
| major_category | text | Top-level category |
| employment | bigint | Number of workers |
| hourly_wage | numeric | Hourly wage |
| annual_wage | numeric | Annual wage |

### ai_opportunities
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| occupation_id | integer | FK to occupations |
| title | text | Opportunity title |
| description | text | Detailed description |
| category | enum | Category (task_automation, etc.) |
| impact_level | integer | 1-5 impact score |
| effort_level | integer | 1-5 effort score |
| is_ai_generated | boolean | Was this AI-generated? |
| is_approved | boolean | Approved for display |

### skill_recommendations
| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| occupation_id | integer | FK to occupations |
| skill_name | text | Skill name |
| skill_description | text | Skill description |
| difficulty | text | beginner/intermediate/advanced |
| learning_resources | text | Link to resources |

## Routes

- `/ai-jobs` - Landing page with search
- `/ai-jobs/[slug]` - Occupation detail page
- `/api/ai-jobs/search?q=` - Search API
- `/api/ai-jobs/[slug]` - Occupation detail API

## AI Opportunity Categories

1. **Task Automation** - Repetitive tasks AI can handle
2. **Decision Support** - AI helps with analysis/judgment
3. **Research & Discovery** - AI accelerates learning
4. **Communication** - Drafts, translations, summarization
5. **Creative Assistance** - Ideation, design suggestions
6. **Data Analysis** - Pattern recognition, insights
7. **Learning & Education** - Personalized learning paths

## Roadmap

- [ ] AI-powered opportunity generation
- [ ] Community contributions
- [ ] Skill learning paths
- [ ] Job comparison tools
- [ ] Career transition mapping
