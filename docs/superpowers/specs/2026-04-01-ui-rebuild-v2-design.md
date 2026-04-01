# AI Jobs Map — UI Rebuild v2 Design Spec

> Port the Vite/React SPA (`project-7e74da3`) to Next.js App Router with server-side rendering.
> Data layer untouched — same Supabase database, same pipeline scripts.

## 1. Architecture

- **Framework:** Next.js 15 App Router, server components by default
- **Data:** Direct Supabase client (no Drizzle ORM, no API routes for reads)
- **Styling:** Tailwind CSS v4 + CSS variables (HSL) from Vite project
- **Components:** Fresh shadcn/ui install + custom FadeIn/Stagger/PageTransition
- **Animations:** Framer Motion (page transitions, staggered reveals)
- **Dark mode:** `next-themes` with theme toggle in header
- **Icons:** Lucide React

## 2. Pages

### 2.1 Landing (`/`)
- Hero with autocomplete search (client component for interactivity)
- 6 hardcoded popular occupation cards with min/day
- Stats row: 38 avg min, 12K+ tasks, 847 occupations
- Category pills with counts (server-fetched)
- CTA section with Browse All + Configure System buttons

### 2.2 Browse (`/browse`)
- Server component with search params for page/sort/category
- 24-per-page grid of occupation cards
- Category filter pills (first 10 categories)
- Sort dropdown: A-Z, Time Saved
- Pagination with prev/next
- Each card shows: title, category, mid-range minutes, arrow on hover

### 2.3 Occupation Detail (`/occupation/[slug]`)
- Breadcrumb: Home > Browse > {title}
- Header: category, title, employment, wage
- Time-back hero card: mid minutes, range, readiness ring (SVG), time by block chips
- Two-column layout (main + sidebar):
  - Main: Micro tasks list, AI opportunities list
  - Sidebar: Top automatable activities, blocking abilities, skills, category breakdown, related occupations, blueprint CTA

### 2.4 Category (`/category/[category]`)
- Filtered occupation listing, reuses browse grid layout
- Category title + count header

### 2.5 Products (`/products`)
- 3 product tier cards: Starter Assistant, Workflow Bundle, Ops Layer
- Each with: icon, benefits, examples, trust points, engagement model, CTA
- Workflow Bundle highlighted as "Most Popular"

### 2.6 Factory (`/factory`)
- Client component (multi-step wizard with local state)
- 5 steps: Role → Agents → Tools → Custom Tasks → Contact
- Progress bar at top
- Role step: search occupation, add pain points
- Agents step: 9 work block cards, pre-selected based on tasks
- Tools step: 3 tools per selected agent
- Custom tasks step: add/remove custom tasks
- Contact step: summary + name/email + book-a-call CTA
- Submission: `supabase.functions.invoke("submit-config")`
- Done state: confirmation with navigation links

### 2.7 Blueprint (`/blueprint/[slug]`)
- Impact summary: total minutes, agent count, architecture type, orchestration
- Architecture diagram: hub-and-spoke / multi-agent / single-agent visual
- Agent detail cards: block name, role, tasks with tier badges, tools, minutes saved
- Human checkpoints section
- Configure CTA

### 2.8 About (`/about`)
- Static content page

## 3. Data Layer

### Server-side client (`lib/supabase/server.ts`)
- Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- Used in all server components for data fetching
- Queries: occupations, automation profiles, opportunities, micro tasks, skills, categories

### Browser-side client (`lib/supabase/client.ts`)
- Uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Used only for: search autocomplete (Landing), factory wizard submission

### Key queries (all via Supabase JS client)
- **Search:** `occupations` table, `.ilike()` on title, limit 10
- **Browse:** `occupations` with `occupation_automation_profile` join, paginated, sorted
- **Detail:** Single occupation + profile + opportunities (approved) + micro tasks + skills + related
- **Categories:** Count occupations per `major_category`
- **Blueprint:** Occupation + profile + micro tasks → client-side `generateBlueprint()`

### No API routes for reads
- All read queries happen in server components
- One edge case: search autocomplete needs a client component, but it queries Supabase directly from the browser (same as Vite version)

## 4. Shared Code

### `lib/supabase/server.ts` — Server Supabase client
### `lib/supabase/client.ts` — Browser Supabase client
### `lib/categories.ts` — 19 category definitions with slug/label/dbValue (copy from Vite)
### `lib/blueprint.ts` — Client-side blueprint generation (copy from Vite)
### `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
### `types/index.ts` — All TypeScript interfaces (copy from Vite)

## 5. Components

### Layout
- `components/layout/Header.tsx` — client component (theme toggle, mobile menu, active nav)
- `components/layout/Footer.tsx` — server component

### Animation
- `components/FadeIn.tsx` — FadeIn, Stagger, StaggerItem (copy from Vite)
- `components/PageTransition.tsx` — Framer motion page wrapper

### shadcn/ui (fresh install)
- button, card, skeleton, badge, separator, select, tabs, dialog, sheet, command, input, textarea, form, label, checkbox, tooltip, accordion, sonner (toast)

## 6. Design Tokens (CSS Variables)

Light mode (warm white + blue accent):
```
--background: 40 33% 98%
--foreground: 30 10% 12%
--card: 0 0% 100%
--accent: 217 91% 60%
--border: 33 18% 88%
--muted-foreground: 30 8% 42%
```

Dark mode:
```
--background: 30 10% 8%
--foreground: 36 20% 90%
--card: 30 8% 11%
--accent: 217 91% 65%
--border: 30 8% 18%
```

Fonts: Newsreader (headings), Manrope (body) — loaded via `next/font/google`.

## 7. What Stays Untouched

- `/scripts/*` — all Python/TS pipeline scripts
- `/data/*` — O*NET Excel, BLS CSV, scoring methodology
- `/drizzle/*` — migration history (reference only)
- `bls_occupations.csv` — source data
- Database schema and all data

## 8. What Gets Replaced

- `/app/*` — all pages, layouts, API routes
- `/components/*` — fresh shadcn + ported custom components
- `/lib/*` — simplified to supabase clients, categories, blueprint, utils
- `globals.css` — Vite project's CSS variable system
- `tailwind.config.js` — updated for new content paths
- `package.json` — cleaned up dependencies (remove drizzle, pg, csv-parse, xlsx, etc.)

## 9. What Gets Removed

- `/lib/db/*` — Drizzle instance, pool adapter, schema (keep schema.ts as reference in `/docs`)
- All API routes — replaced by server component queries
- Old components: stat-ring, count-up, pexels-image, category-image, insight-card
- `/app/concepts/*`, `/app/experiments/*`, `/app/simple/*` — experimental pages
- `/app/factory/build|pipeline|audit|skills-browser|case-studies|marketplace|roi/*` — factory sub-pages replaced by single wizard
