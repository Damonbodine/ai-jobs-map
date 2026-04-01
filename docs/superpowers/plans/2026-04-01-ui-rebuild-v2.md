# UI Rebuild v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Next.js UI with a clean port of the Vite/React SPA, using server components and direct Supabase queries.

**Architecture:** Next.js 15 App Router with server components fetching from Supabase. Client components only where interactivity is required (search autocomplete, factory wizard, theme toggle, animations). No Drizzle ORM, no API routes for reads.

**Tech Stack:** Next.js 15, React 19, Supabase JS client, Tailwind CSS v4, shadcn/ui, Framer Motion, next-themes, Lucide React

**Source reference:** All UI code is ported from `/Users/damonbodine/Desktop/project-7e74da3/src/` (Vite project).

---

## File Map

### Files to CREATE
```
lib/supabase/server.ts          — Server-side Supabase client
lib/supabase/client.ts          — Browser-side Supabase client (anon key)
lib/categories.ts               — 19 category definitions
lib/blueprint.ts                — Client-side blueprint generation
types/index.ts                  — All TypeScript interfaces

components/FadeIn.tsx            — FadeIn, Stagger, StaggerItem (framer-motion)
components/PageTransition.tsx    — Page transition wrapper
components/layout/Header.tsx     — Sticky nav with theme toggle (client)
components/layout/Footer.tsx     — Site footer (server)
components/ui/theme-provider.tsx — next-themes provider

app/layout.tsx                  — Root layout (fonts, theme provider, metadata)
app/globals.css                 — CSS variables (light + dark)
app/page.tsx                    — Landing page (redirect or inline)
app/browse/page.tsx             — Browse grid with filters
app/occupation/[slug]/page.tsx  — Occupation detail
app/category/[category]/page.tsx — Category listing
app/products/page.tsx           — Product tiers
app/factory/page.tsx            — 5-step wizard (client)
app/blueprint/[slug]/page.tsx   — Agent blueprint
app/about/page.tsx              — About page
```

### Files to KEEP (untouched)
```
scripts/*                       — All pipeline scripts
data/*                          — O*NET, BLS, scoring data
drizzle/*                       — Migration history (reference)
bls_occupations.csv             — Source data
docs/*                          — Documentation
```

### Files to DELETE (replaced by new versions)
```
app/ai-jobs/**                  — Old page structure
app/api/**                      — All API routes
app/concepts/**                 — Experimental pages
app/experiments/**              — Experimental pages
app/simple/**                   — Simple pages
app/factory/**                  — Old factory (sub-pages replaced by single wizard)
components/ui/*                 — Old shadcn components (reinstalled fresh)
components/occupation/*         — Old occupation components
components/factory/*            — Old factory components
components/ai-blueprint/*       — Old blueprint components
components/smart-workflows/*    — Old workflow components
components/analytics/*          — Old analytics tracking
lib/db/*                        — Drizzle instance, pool, schema
lib/ai-jobs/*                   — Old domain logic
lib/ai-blueprints/*             — Old blueprint generation
lib/analytics/*                 — Old analytics client
lib/workflows/*                 — Old workflows
lib/orchestration/*             — Old orchestration
lib/agents/*                    — Old agents
lib/smart-workflows/*           — Old smart workflow queries
lib/ai-jobs/recommendations.ts  — Old recommendations
```

---

### Task 1: Clean slate — remove old UI files

**Files:**
- Delete: `app/`, `components/`, `lib/` (everything except `lib/utils.ts`)

- [ ] **Step 1: Remove old app directory**

```bash
rm -rf app/
```

- [ ] **Step 2: Remove old components**

```bash
rm -rf components/
```

- [ ] **Step 3: Remove old lib files (keep scripts, data, drizzle, docs)**

```bash
rm -rf lib/db lib/ai-jobs lib/ai-blueprints lib/analytics lib/workflows lib/orchestration lib/agents lib/smart-workflows lib/ai-jobs/recommendations.ts
```

- [ ] **Step 4: Create fresh directory structure**

```bash
mkdir -p app/browse app/occupation/\[slug\] app/category/\[category\] app/products app/factory app/blueprint/\[slug\] app/about
mkdir -p components/layout components/ui
mkdir -p lib/supabase
mkdir -p types
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: clean slate — remove old UI files for rebuild"
```

---

### Task 2: Dependencies — update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove unused dependencies and add new ones**

```bash
npm uninstall @base-ui/react @chenglou/pretext @floating-ui/react @neondatabase/serverless csv-parse dotenv drizzle-orm pg recharts shadcn xlsx tw-animate-css
npm uninstall -D drizzle-kit @testing-library/dom @testing-library/jest-dom @testing-library/react @vitejs/plugin-react happy-dom jsdom vitest
npm install next-themes @supabase/supabase-js framer-motion lucide-react clsx tailwind-merge class-variance-authority cmdk
npm install -D tailwindcss @tailwindcss/postcss autoprefixer postcss typescript @types/node @types/react @types/react-dom
```

Note: `next`, `react`, `react-dom`, `tailwindcss` should already be installed. The above removes what's no longer needed and ensures new deps are present.

- [ ] **Step 2: Update scripts in package.json**

Keep `dev`, `build`, `start`, `lint`, `type-check`, and all `db:*` / `browse:refresh` scripts. Remove `test` scripts for now (no tests in rebuild scope).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: update dependencies for UI rebuild"
```

---

### Task 3: Foundation — types, utils, categories

**Files:**
- Create: `types/index.ts`
- Create: `lib/utils.ts`
- Create: `lib/categories.ts`

- [ ] **Step 1: Write types/index.ts**

Copy directly from Vite project `/Users/damonbodine/Desktop/project-7e74da3/src/types/index.ts`. This file has all the interfaces: `Occupation`, `AiOpportunity`, `SkillRecommendation`, `MicroTask`, `AutomationProfile`, `TimeRangeByBlock`, `ArchitectureType`, `AutomationTier`, `TaskSpec`, `BlockAgent`, `AgentBlueprint`, `OccupationCategory`, `FactoryWizardData`.

- [ ] **Step 2: Write lib/utils.ts**

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Write lib/categories.ts**

Copy directly from Vite project `/Users/damonbodine/Desktop/project-7e74da3/src/lib/categories.ts`. Has `CATEGORIES` array (19 entries) and helper functions `getCategoryBySlug`, `getCategoryByDbValue`, `getCategorySlug`.

- [ ] **Step 4: Commit**

```bash
git add types/ lib/utils.ts lib/categories.ts
git commit -m "feat: add foundation — types, utils, categories"
```

---

### Task 4: Supabase clients

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`

- [ ] **Step 1: Write server-side client**

```typescript
// lib/supabase/server.ts
import { createClient } from "@supabase/supabase-js"

export function createServerClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }

  return createClient(url, key)
}
```

- [ ] **Step 2: Write browser-side client**

```typescript
// lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export const supabase = createClient(url, key)
```

- [ ] **Step 3: Add env vars to .env.local (template)**

Ensure `.env.local` has (or create `.env.example` with):
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/ .env.example
git commit -m "feat: add Supabase server and client modules"
```

---

### Task 5: Blueprint generation logic

**Files:**
- Create: `lib/blueprint.ts`

- [ ] **Step 1: Write lib/blueprint.ts**

Copy directly from Vite project `/Users/damonbodine/Desktop/project-7e74da3/src/lib/blueprint.ts`. Contains `generateBlueprint()` function with `BLOCK_ROLES`, `BLOCK_TOOLS`, `CATEGORY_TO_BLOCK` mappings, `classifyTier()`, `getBlockForTask()`, `estimateMinutesSaved()`. Imports types from `@/types`.

- [ ] **Step 2: Commit**

```bash
git add lib/blueprint.ts
git commit -m "feat: add client-side blueprint generation"
```

---

### Task 6: CSS + Tailwind config + design tokens

**Files:**
- Create: `app/globals.css`
- Modify: `tailwind.config.js`
- Keep: `postcss.config.js` (already correct for Tailwind v4)

- [ ] **Step 1: Write app/globals.css**

Copy CSS variable system from Vite project `/Users/damonbodine/Desktop/project-7e74da3/src/index.css`. This has `:root` (light) and `.dark` (dark) color tokens plus base styles. Adapt the Tailwind directives for v4:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 40 33% 98%;
    --foreground: 30 10% 12%;
    --card: 0 0% 100%;
    --card-foreground: 30 10% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 30 10% 12%;
    --primary: 30 10% 12%;
    --primary-foreground: 40 33% 98%;
    --secondary: 36 20% 93%;
    --secondary-foreground: 30 10% 12%;
    --muted: 36 20% 93%;
    --muted-foreground: 30 8% 42%;
    --accent: 217 91% 60%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 33 18% 88%;
    --input: 33 18% 85%;
    --ring: 217 91% 60%;
    --radius: 0.625rem;
  }

  .dark {
    --background: 30 10% 8%;
    --foreground: 36 20% 90%;
    --card: 30 8% 11%;
    --card-foreground: 36 20% 90%;
    --popover: 30 8% 11%;
    --popover-foreground: 36 20% 90%;
    --primary: 36 20% 90%;
    --primary-foreground: 30 10% 8%;
    --secondary: 30 8% 15%;
    --secondary-foreground: 36 20% 90%;
    --muted: 30 8% 15%;
    --muted-foreground: 30 10% 55%;
    --accent: 217 91% 65%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 62.8% 40%;
    --destructive-foreground: 210 40% 98%;
    --border: 30 8% 18%;
    --input: 30 8% 18%;
    --ring: 217 91% 65%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-body;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Newsreader', Georgia, serif;
  }
}

@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 2: Update tailwind.config.js**

Copy the theme configuration from Vite project `/Users/damonbodine/Desktop/project-7e74da3/tailwind.config.js`. Key additions: `fontFamily` (heading: Newsreader, body: Manrope), color mappings using `hsl(var(--...))`, border radius, animations. Update content paths for Next.js:

```js
content: [
  './app/**/*.{ts,tsx}',
  './components/**/*.{ts,tsx}',
],
```

Set `darkMode: ['class']` for next-themes compatibility.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css tailwind.config.js
git commit -m "feat: add design tokens — light/dark CSS variables + Tailwind config"
```

---

### Task 7: Shared components — FadeIn, PageTransition, Layout

**Files:**
- Create: `components/FadeIn.tsx`
- Create: `components/PageTransition.tsx`
- Create: `components/ui/theme-provider.tsx`
- Create: `components/layout/Header.tsx`
- Create: `components/layout/Footer.tsx`

- [ ] **Step 1: Write components/FadeIn.tsx**

Copy from Vite project `/Users/damonbodine/Desktop/project-7e74da3/src/components/FadeIn.tsx`. Add `"use client"` directive at top. Contains `FadeIn`, `Stagger`, `StaggerItem` components using framer-motion.

- [ ] **Step 2: Write components/PageTransition.tsx**

Copy from Vite project `/Users/damonbodine/Desktop/project-7e74da3/src/components/PageTransition.tsx`. Add `"use client"` directive at top.

- [ ] **Step 3: Write components/ui/theme-provider.tsx**

```tsx
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ReactNode } from "react"

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
```

- [ ] **Step 4: Write components/layout/Header.tsx**

Port from Vite project `/Users/damonbodine/Desktop/project-7e74da3/src/components/layout/Header.tsx`. Changes needed:
- Add `"use client"` directive
- Replace `import { Link, useLocation } from "react-router-dom"` with `import Link from "next/link"` and `import { usePathname } from "next/navigation"`
- Replace `useLocation().pathname` with `usePathname()`
- Replace `useTheme` custom hook with `import { useTheme } from "next-themes"` — the API is the same (`theme`, `setTheme`) but use `setTheme("dark")` / `setTheme("light")` instead of `toggleTheme`
- Replace `to=` with `href=` on all `Link` components

- [ ] **Step 5: Write components/layout/Footer.tsx**

Port from Vite project `/Users/damonbodine/Desktop/project-7e74da3/src/components/layout/Footer.tsx`. Changes:
- Replace `import { Link } from "react-router-dom"` with `import Link from "next/link"`
- Replace `to=` with `href=` on all `Link` components
- This is a server component — no `"use client"` needed

- [ ] **Step 6: Commit**

```bash
git add components/
git commit -m "feat: add shared components — FadeIn, PageTransition, Header, Footer, ThemeProvider"
```

---

### Task 8: Root layout

**Files:**
- Create: `app/layout.tsx`

- [ ] **Step 1: Write app/layout.tsx**

```tsx
import type { Metadata } from "next"
import { Newsreader, Manrope } from "next/font/google"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import "./globals.css"

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: "AI Jobs Map",
  description:
    "Discover how AI can save time in your specific occupation. Task-level analysis for 800+ roles.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${newsreader.variable} ${manrope.variable} font-body min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on port 3050. Landing page will 404 until we create `app/page.tsx`, but no build errors.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add root layout with fonts, theme provider, header/footer"
```

---

### Task 9: Install shadcn components

**Files:**
- Create: 9 component files in `components/ui/`

- [ ] **Step 1: Install only the shadcn components actually used**

```bash
npx shadcn@latest add button dialog input label separator sheet skeleton sonner tooltip
```

If prompted about config, accept defaults. This creates files in `components/ui/`.

- [ ] **Step 2: Commit**

```bash
git add components/ui/
git commit -m "feat: install shadcn components — button, dialog, input, label, separator, sheet, skeleton, sonner, tooltip"
```

---

### Task 10: Landing page (`/`)

**Files:**
- Create: `app/page.tsx`
- Create: `app/landing-search.tsx` (client component for autocomplete)

- [ ] **Step 1: Write app/landing-search.tsx (client component)**

```tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface SearchResult {
  id: number
  title: string
  slug: string
  major_category: string
}

export function LandingSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("occupations")
        .select("id, title, slug, major_category")
        .or(`title.ilike.%${query}%,major_category.ilike.%${query}%`)
        .order("title")
        .limit(10)
      setResults(data ?? [])
    }, 200)
    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div className="relative max-w-md mx-auto" ref={dropdownRef}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
        onFocus={() => setShowResults(true)}
        placeholder='Try "Software Developer" or "Nurse"'
        className="w-full h-12 pl-11 pr-4 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all shadow-sm"
      />
      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card rounded-xl border border-border shadow-lg overflow-hidden z-50">
          {results.map((occ) => (
            <button
              key={occ.id}
              onClick={() => { router.push(`/occupation/${occ.slug}`); setShowResults(false) }}
              className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-sm font-medium">{occ.title}</div>
                <div className="text-xs text-muted-foreground">{occ.major_category}</div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write app/page.tsx (server component)**

Port from Vite project's `Landing.tsx`. Key changes:
- Server component — fetch category counts from Supabase at the top
- Import `LandingSearch` client component for the interactive search
- Replace `Link` from react-router with `next/link`
- Replace `to=` with `href=`
- Wrap animated sections in client `FadeIn`/`Stagger` components
- Update popular occupations to 10 entries (per spec update)
- Update stats to show 58 avg min (per spec update)
- **Language:** Use "time back" and "reclaimed minutes" phrasing, avoid "automation"

The page fetches `categoryCounts` server-side via:
```typescript
import { createServerClient } from "@/lib/supabase/server"

const supabase = createServerClient()
const { data } = await supabase.from("occupations").select("major_category")
const categoryCounts: Record<string, number> = {}
for (const row of data ?? []) {
  categoryCounts[row.major_category] = (categoryCounts[row.major_category] || 0) + 1
}
```

- [ ] **Step 3: Verify landing page renders**

```bash
npm run dev
```

Visit `http://localhost:3050`. Should see hero, search, popular occupations, stats, categories, CTA, footer.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/landing-search.tsx
git commit -m "feat: add landing page with search, stats, categories"
```

---

### Task 11: Browse page (`/browse`)

**Files:**
- Create: `app/browse/page.tsx`

- [ ] **Step 1: Write app/browse/page.tsx**

Port from Vite project's `Browse.tsx`. This is a **server component** since search params drive the query. Key changes:
- Use `searchParams` prop (Next.js server component pattern): `export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; category?: string }> })`
- Await searchParams: `const params = await searchParams`
- Fetch data server-side using `createServerClient()`
- Query: `occupations` with `occupation_automation_profile(composite_score, time_range_low, time_range_high)` join, paginated by 24, with category filter and sort
- Client-side sort for `time_back` (same as Vite version — sort after fetch since it's in a relation)
- Replace router-based param updates with `<Link>` elements or a small client component for filter controls
- Create a small `"use client"` component inline or as `app/browse/filters.tsx` for the category buttons and sort dropdown (they need `useRouter` to update URL params)
- Replace `to=` with `href=`

Pagination: prev/next links using `<Link href={`/browse?page=${page-1}&sort=${sort}&category=${category}`}>`.

- [ ] **Step 2: Verify browse page**

Visit `http://localhost:3050/browse`. Should show occupation grid with filters.

- [ ] **Step 3: Commit**

```bash
git add app/browse/
git commit -m "feat: add browse page with filters, sort, pagination"
```

---

### Task 12: Occupation detail page (`/occupation/[slug]`)

**Files:**
- Create: `app/occupation/[slug]/page.tsx`

- [ ] **Step 1: Write the occupation detail page**

Port from Vite project's `OccupationDetail.tsx`. This is a **server component**. Key changes:
- Use `params` prop: `export default async function OccupationPage({ params }: { params: Promise<{ slug: string }> })`
- Await params: `const { slug } = await params`
- Fetch all data server-side in parallel:
  ```typescript
  const supabase = createServerClient()
  const { data: occupation } = await supabase.from("occupations").select("*").eq("slug", slug).single()
  const { data: profile } = await supabase.from("occupation_automation_profile").select("*").eq("occupation_id", occupation.id).single()
  const { data: opportunities } = await supabase.from("ai_opportunities").select("*").eq("occupation_id", occupation.id).eq("is_approved", true).order("impact_level", { ascending: false })
  const { data: tasks } = await supabase.from("job_micro_tasks").select("*").eq("occupation_id", occupation.id).order("ai_impact_level", { ascending: false })
  const { data: skills } = await supabase.from("skill_recommendations").select("*").eq("occupation_id", occupation.id).order("priority", { ascending: false })
  const { data: related } = await supabase.from("occupations").select("id, title, slug").eq("major_category", occupation.major_category).neq("slug", slug).limit(4)
  ```
- Port full layout: breadcrumb, header, time-back hero card (with SVG ring), time-by-block chips, two-column (main: tasks + opportunities, sidebar: automatable activities, blockers, skills, category breakdown, related, blueprint CTA)
- Replace `to=` with `href=`, `Link` from next/link
- Wrap sections in `FadeIn`/`Stagger` client components
- Handle `notFound()` from `next/navigation` if occupation is null
- **Language:** Soften terminology per spec — use "time back" instead of "automation", "AI-ready tasks" instead of "automatable"

- [ ] **Step 2: Verify occupation detail**

Visit `http://localhost:3050/occupation/software-developer`.

- [ ] **Step 3: Commit**

```bash
git add app/occupation/
git commit -m "feat: add occupation detail page with time-back, tasks, opportunities, sidebar"
```

---

### Task 13: Category page (`/category/[category]`)

**Files:**
- Create: `app/category/[category]/page.tsx`

- [ ] **Step 1: Write the category page**

Port from Vite project's `Category.tsx`. Server component. Key changes:
- Use `params` prop, await it
- Look up category via `getCategoryBySlug()`
- Fetch occupations with automation profile join server-side
- Same card layout as browse
- Breadcrumb: Home > Browse > {category label}
- Other category pills for navigation
- `notFound()` if category slug doesn't match

- [ ] **Step 2: Verify category page**

Visit `http://localhost:3050/category/management`.

- [ ] **Step 3: Commit**

```bash
git add app/category/
git commit -m "feat: add category page"
```

---

### Task 14: Products page (`/products`)

**Files:**
- Create: `app/products/page.tsx`

- [ ] **Step 1: Write the products page**

Port from Vite project's `Products.tsx`. This is mostly static content — can be a server component with `FadeIn`/`Stagger` client wrappers.
- Copy the 3 tier definitions (Starter Assistant, Workflow Bundle, Ops Layer) with benefits, examples, trust points, engagement
- Replace `to=` with `href=`
- **Language:** Soften — instead of "Single-agent automation" use "Your first AI assistant", instead of "Multi-agent workflows" use "Connected AI team", etc. Keep the content approachable.

- [ ] **Step 2: Verify products page**

Visit `http://localhost:3050/products`.

- [ ] **Step 3: Commit**

```bash
git add app/products/
git commit -m "feat: add products page with 3 tiers"
```

---

### Task 15: Factory wizard (`/factory`)

**Files:**
- Create: `app/factory/page.tsx`

- [ ] **Step 1: Write the factory page**

Port from Vite project's `Factory.tsx`. This is a **client component** (`"use client"`) because it manages multi-step wizard state.

Key changes:
- Add `"use client"` directive
- Replace `useSearchParams` from react-router with `useSearchParams` from `next/navigation`
- Replace `Link` imports, `to=` → `href=`
- Replace `supabase.functions.invoke("submit-config", { body })` with same call using browser client from `@/lib/supabase/client`
- Replace `toast` from sonner import
- Import `useSearchOccupations`-equivalent inline: use the browser supabase client directly for search (same pattern as `LandingSearch`)
- For `useOccupation` and `useMicroTasks`, fetch via browser supabase client with `useEffect` + `useState` (no tanstack-query in this rebuild — keep it simple with raw state)

The 5-step wizard (Role → Agents → Tools → Custom Tasks → Contact) ports directly. All WORK_BLOCKS and TOOLS constants copy as-is.

- [ ] **Step 2: Verify factory wizard**

Visit `http://localhost:3050/factory`. Test stepping through the wizard.

- [ ] **Step 3: Commit**

```bash
git add app/factory/
git commit -m "feat: add factory wizard — 5-step configurator"
```

---

### Task 16: Blueprint page (`/blueprint/[slug]`)

**Files:**
- Create: `app/blueprint/[slug]/page.tsx`

- [ ] **Step 1: Write the blueprint page**

Port from Vite project's `Blueprint.tsx`. This is a **hybrid**: server component fetches data, then a client component runs `generateBlueprint()` and renders the interactive parts.

Create two parts:
1. `app/blueprint/[slug]/page.tsx` (server) — fetches occupation, profile, tasks
2. `app/blueprint/[slug]/blueprint-view.tsx` (client) — receives data as props, runs `generateBlueprint()`, renders architecture diagram + agent cards

Server component:
```typescript
import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { BlueprintView } from "./blueprint-view"

export default async function BlueprintPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServerClient()

  const { data: occupation } = await supabase.from("occupations").select("*").eq("slug", slug).single()
  if (!occupation) notFound()

  const { data: profile } = await supabase.from("occupation_automation_profile").select("*").eq("occupation_id", occupation.id).single()
  const { data: tasks } = await supabase.from("job_micro_tasks").select("*").eq("occupation_id", occupation.id).order("ai_impact_level", { ascending: false })

  return <BlueprintView occupation={occupation} profile={profile} tasks={tasks ?? []} slug={slug} />
}
```

Client component: Port the rendering from Vite's `Blueprint.tsx` — impact summary, architecture diagram (hub-and-spoke/multi-agent/single-agent), agent cards with tasks and tools, human checkpoints, CTA.

- [ ] **Step 2: Verify blueprint page**

Visit `http://localhost:3050/blueprint/software-developer`.

- [ ] **Step 3: Commit**

```bash
git add app/blueprint/
git commit -m "feat: add blueprint page with architecture diagram and agent cards"
```

---

### Task 17: About page (`/about`)

**Files:**
- Create: `app/about/page.tsx`

- [ ] **Step 1: Write the about page**

Port from Vite project's `About.tsx`. Server component with `FadeIn`/`Stagger` client wrappers.
- Replace `Link` imports, `to=` → `href=`
- Copy the 4 info sections (Real Data, Task-Level Analysis, Actionable Blueprints, Human-Centered) and methodology card
- **Language:** Soften where needed — "actionable blueprints" → "practical plans", etc.

- [ ] **Step 2: Verify about page**

Visit `http://localhost:3050/about`.

- [ ] **Step 3: Commit**

```bash
git add app/about/
git commit -m "feat: add about page"
```

---

### Task 18: Final cleanup and verification

**Files:**
- Modify: `next.config.js` (if needed)
- Verify: all pages render without errors

- [ ] **Step 1: Update next.config.js if needed**

Remove unsplash image pattern if no longer used. Keep `reactStrictMode: true`.

- [ ] **Step 2: Full page verification**

Visit each page and verify:
- `/` — Landing with search, stats, categories
- `/browse` — Grid with filters and pagination
- `/occupation/software-developer` — Full detail page
- `/category/management` — Category listing
- `/products` — 3 tiers
- `/factory` — Wizard steps through
- `/blueprint/software-developer` — Architecture + agents
- `/about` — Static content
- Dark mode toggle works on all pages

- [ ] **Step 3: Build check**

```bash
npm run build
```

Fix any type errors or build issues.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete UI rebuild v2 — all 8 pages ported to Next.js App Router"
```
