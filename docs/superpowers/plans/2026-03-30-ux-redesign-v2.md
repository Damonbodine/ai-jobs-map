# UX Redesign v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip the AI Jobs Map to a search-first landing, three-beat occupation page, and simplified browse — shippable today.

**Architecture:** Rewrite 3 pages (landing, occupation detail, browse) in place. Keep all data queries and API routes unchanged. Reduce information per page dramatically — progressive disclosure via collapsed `<details>` sections.

**Tech Stack:** Next.js 15, Tailwind CSS 4.2, Framer Motion, shadcn/ui, existing Recovery Ink design tokens.

---

### Task 1: Rewrite Landing Page — Search-First Minimal

**Files:**
- Modify: `app/ai-jobs/page.tsx` (full rewrite, currently 297 lines → ~120 lines)

- [ ] **Step 1: Rewrite the landing page**

Replace the entire content of `app/ai-jobs/page.tsx` with:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
}

interface SearchResponse {
  results: Occupation[];
  total: number;
}

const quickStarts = [
  { label: 'Accountants', slug: 'accountants' },
  { label: 'Software Developers', slug: 'software-developers' },
  { label: 'Registered Nurses', slug: 'registered-nurses' },
  { label: 'Project Managers', slug: 'management-analysts' },
  { label: 'Paralegals', slug: 'paralegals-and-legal-assistants' },
  { label: 'Electricians', slug: 'electricians' },
];

export default function AIJobsLanding() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Occupation[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setTotal(0); setSearched(false); return; }
    setSearching(true); setSearched(true);
    try {
      const res = await fetch(`/api/ai-jobs/search?q=${encodeURIComponent(q)}&limit=6`);
      const data: SearchResponse = await res.json();
      setResults(data.results || []); setTotal(data.total || 0);
    } catch { setResults([]); setTotal(0); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [search, query]);

  return (
    <div className="app-shell flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-5">
      <div className="w-full max-w-2xl text-center">
        {/* Headline */}
        <h1
          className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.1] tracking-tight text-ink"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          How many minutes could you get&nbsp;back?
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-secondary">
          Search your job title to see where routine work is quietly stealing your time.
        </p>

        {/* Search */}
        <form action="/ai-jobs/browse" className="relative mx-auto mt-8 max-w-xl">
          <div className="flex items-center rounded-lg border border-edge bg-surface-raised shadow-sm transition-all focus-within:shadow-md focus-within:border-edge-strong">
            <Search className="ml-4 h-5 w-5 shrink-0 text-ink-tertiary" />
            <input
              type="text"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your job title..."
              className="w-full bg-transparent px-3 py-3.5 text-base text-ink placeholder:text-ink-tertiary focus:outline-none"
              autoComplete="off"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="mr-3 rounded p-1 text-ink-tertiary hover:text-ink" aria-label="Clear">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          <AnimatePresence>
            {query.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-[20rem] overflow-y-auto rounded-lg border border-edge bg-surface-raised shadow-md"
              >
                {searching ? (
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-2/3" />
                  </div>
                ) : results.length > 0 ? (
                  <>
                    {results.map((o) => (
                      <Link
                        key={o.id}
                        href={`/ai-jobs/${o.slug}`}
                        className="flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface-sunken border-b border-edge last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">{o.title}</p>
                          <p className="text-xs text-ink-tertiary">{o.major_category}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-ink-tertiary" />
                      </Link>
                    ))}
                    {total > 6 && (
                      <Link
                        href={`/ai-jobs/browse?q=${encodeURIComponent(query)}`}
                        className="block border-t border-edge px-4 py-2.5 text-center text-sm font-medium text-accent-blue hover:bg-accent-blue-subtle"
                      >
                        View all {total} results
                      </Link>
                    )}
                  </>
                ) : searched ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm font-medium text-ink">No matches found</p>
                    <p className="mt-1 text-xs text-ink-tertiary">Try "engineer", "analyst", or "manager"</p>
                  </div>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Quick starts */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {quickStarts.map((qs) => (
            <Link
              key={qs.slug}
              href={`/ai-jobs/${qs.slug}`}
              className="rounded-full border border-edge bg-surface-raised px-3.5 py-1.5 text-sm text-ink-secondary transition-colors hover:border-edge-strong hover:text-ink"
            >
              {qs.label}
            </Link>
          ))}
        </div>

        {/* Proof line */}
        <p className="mt-10 text-sm text-ink-tertiary">
          Mapped across 800+ occupations from the U.S. Bureau of Labor Statistics
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/ai-jobs/page.tsx
git commit -m "feat: search-first minimal landing page"
```

---

### Task 2: Rewrite Occupation Page — Three-Beat Scroll

**Files:**
- Modify: `app/ai-jobs/[slug]/page.tsx` (rewrite render section, keep data logic — currently 511 lines → ~400 lines)

The data fetching functions (lines 1-170) and computation logic stay identical. Only the JSX render changes.

- [ ] **Step 1: Rewrite the occupation page**

Keep everything from the top of the file through the computation section (all imports, configs, utilities, data fetching, `generateMetadata`, and the data processing inside `OccupationPage` up through `const automationSolutions`). Replace only the `return (...)` JSX with the three-beat layout:

**Beat 1 — The Reveal**: job title + the big number + progress bar. Nothing else above the fold.

**Beat 2 — What's Eating Your Time**: section header + exactly 3 cards (from `priorityTasks`) showing task name, frequency, minutes, and a simple width-proportional bar.

**Beat 3 — Your Next Step**: one solution card (from `automationSolutions[0]`) + bridge CTA to factory.

**Below the fold**: collapsible `<details>` for day architecture, all routines, evidence, human edge, upskilling.

Full replacement JSX (replaces everything from `return (` to end of function):

```tsx
  const maxMinutes = Math.max(...priorityTasks.map((t: any) => t.lens.modeledMinutesPerDay), 1);

  return (
    <div className="app-shell">
      {/* ── Beat 1: The Reveal ── */}
      <section className="page-container pb-10 pt-10 md:pt-14">
        <Link href="/ai-jobs" className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to search
        </Link>

        <span className="eyebrow">{occupation.major_category}</span>
        <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-ink" style={{ fontFamily: 'var(--font-heading)' }}>
          {occupation.title}
        </h1>
        {occupation.employment && (
          <p className="mt-2 text-sm text-ink-tertiary">{Number(occupation.employment).toLocaleString()} workers in the US</p>
        )}

        <div className="mt-8 max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-tertiary">Recoverable time per day</p>
          <p className="mt-2 text-[4.5rem] font-bold leading-none tracking-tight text-ink">{displayedMinutes}<span className="ml-1 text-2xl font-medium text-ink-tertiary">min</span></p>
          <p className="mt-2 text-sm text-ink-secondary">of routine work that could be lightened with the right support</p>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${oneHourProgress}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-ink-tertiary">{Math.min(displayedMinutes, 60)} of 60 min/day target</p>
        </div>
      </section>

      <main className="page-container space-y-16 pb-20">
        {/* ── Beat 2: What's Eating Your Time ── */}
        {priorityTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>Where your time goes</h2>
            <p className="mt-1 text-sm text-ink-secondary">The top routines with the clearest time-back potential.</p>

            <div className="mt-6 space-y-3">
              {priorityTasks.map((task: any) => (
                <div key={task.id} className="rounded-lg border border-edge bg-surface-raised p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-ink">{task.task_name}</h3>
                        <span className="shrink-0 rounded-sm bg-surface-sunken px-1.5 py-0.5 text-[11px] text-ink-tertiary">{task.lens.label}</span>
                      </div>
                      {task.task_description && (
                        <p className="mt-1 text-sm leading-relaxed text-ink-secondary line-clamp-2">{task.task_description}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-semibold tracking-tight text-ink">{task.lens.modeledMinutesPerDay}<span className="ml-0.5 text-xs font-normal text-ink-tertiary">m</span></p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.round((task.lens.modeledMinutesPerDay / maxMinutes) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Beat 3: Your Next Step ── */}
        {automationSolutions.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-ink" style={{ fontFamily: 'var(--font-heading)' }}>The best place to start</h2>
            <p className="mt-1 text-sm text-ink-secondary">One support path tied to your strongest routine cluster.</p>

            {automationSolutions.map((sol) => (
              <div key={sol.name} className="mt-6 rounded-lg border border-edge bg-surface-raised p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{sol.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{sol.strapline}</p>
                  </div>
                  <div className="shrink-0 rounded-md bg-accent-blue-subtle px-3 py-2 text-center">
                    <p className="text-xl font-semibold text-ink">{sol.totalMinutes}m</p>
                    <p className="text-[10px] text-ink-tertiary">per day</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {sol.matchedBlocks.map((b) => (
                    <span key={b} className="rounded-sm bg-surface-sunken px-2 py-0.5 text-xs text-ink-tertiary">{b}</span>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-6">
              <Link
                href="/factory"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Build your toolkit
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </section>
        )}

        {/* ── Expanded Content (collapsed) ── */}
        <div className="space-y-3 border-t border-edge pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-tertiary">Detailed breakdown</p>

          {summaryBlocks.length > 0 && (
            <details className="group rounded-lg border border-edge bg-surface-raised shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between p-5 marker:content-none list-none">
                <h3 className="text-sm font-semibold text-ink">Day architecture</h3>
                <span className="text-xs text-ink-tertiary transition-transform group-open:rotate-180">&#x25BC;</span>
              </summary>
              <div className="border-t border-edge p-5">
                <div className="grid gap-3 md:grid-cols-3">
                  {summaryBlocks.map((block: any) => (
                    <div key={block.key} className="rounded-md border-l-4 border-l-primary bg-surface-sunken p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-tertiary">{block.label}</p>
                      <p className="mt-1 text-xl font-semibold text-ink">{block.aiMinutes} min/day</p>
                      <p className="mt-1 text-sm text-ink-secondary">{block.posture}</p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}

          {recommendationSnapshot.topActions.length > 0 && (
            <details className="group rounded-lg border border-edge bg-surface-raised shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between p-5 marker:content-none list-none">
                <h3 className="text-sm font-semibold text-ink">Evidence &amp; action patterns</h3>
                <span className="text-xs text-ink-tertiary transition-transform group-open:rotate-180">&#x25BC;</span>
              </summary>
              <div className="border-t border-edge p-5 space-y-2">
                {recommendationSnapshot.topActions.slice(0, 5).map((a) => (
                  <div key={a.code} className="flex items-center justify-between rounded-md border border-edge px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-ink-tertiary">{a.taskCount} tasks &middot; {Math.round(a.confidence * 100)}% confidence</p>
                    </div>
                    <span className="text-xs text-ink-tertiary">{a.code}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {visibleSkillSummary.length > 0 && (
            <details className="group rounded-lg border border-edge bg-surface-raised shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between p-5 marker:content-none list-none">
                <h3 className="text-sm font-semibold text-ink">Human edge &amp; skills</h3>
                <span className="text-xs text-ink-tertiary transition-transform group-open:rotate-180">&#x25BC;</span>
              </summary>
              <div className="border-t border-edge p-5">
                <p className="text-sm leading-relaxed text-ink-secondary">
                  The goal is not to automate judgment — it&apos;s to remove repetitive setup so the person stays with context, edge cases, and final decisions.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {visibleSkillSummary.map((s) => (
                    <div key={s.label} className="rounded-md bg-surface-sunken p-3">
                      <p className="text-xs text-ink-tertiary">{s.label}</p>
                      <p className="mt-1 text-lg font-semibold text-ink">{s.value}</p>
                    </div>
                  ))}
                </div>
                {humanEdgeNotes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {humanEdgeNotes.map((n) => <span key={n} className="rounded-sm bg-surface-sunken px-2 py-0.5 text-xs text-ink-secondary">{n}</span>)}
                  </div>
                )}
              </div>
            </details>
          )}

          {skills.length > 0 && (
            <details className="group rounded-lg border border-edge bg-surface-raised shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between p-5 marker:content-none list-none">
                <h3 className="text-sm font-semibold text-ink">Upskilling recommendations</h3>
                <span className="text-xs text-ink-tertiary transition-transform group-open:rotate-180">&#x25BC;</span>
              </summary>
              <div className="border-t border-edge p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  {skills.slice(0, 4).map((skill: any) => (
                    <div key={skill.id} className="rounded-md border border-edge p-4">
                      <h4 className="text-sm font-semibold text-ink">{skill.skill_name}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{skill.skill_description}</p>
                      {skill.learning_resources && (
                        <a href={skill.learning_resources} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-accent-blue hover:text-accent-blue-hover">
                          Learning resources &rarr;
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/ai-jobs/[slug]/page.tsx"
git commit -m "feat: three-beat occupation page with progressive disclosure"
```

---

### Task 3: Simplify Browse Page Cards

**Files:**
- Modify: `app/ai-jobs/browse/page.tsx` (simplify card rendering — currently 331 lines → ~280 lines)

- [ ] **Step 1: Simplify the occupation cards in the browse page**

In `app/ai-jobs/browse/page.tsx`, replace the occupation card rendering block (inside the `motion.div` grid) with minimal cards: title + category + one number.

Find the current `{occupations.map((occupation) => {` block and replace it with:

```tsx
            {occupations.map((occupation) => {
              const story = getOccupationStory(occupation);
              return (
                <Link
                  key={occupation.id}
                  href={`/ai-jobs/${occupation.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-lg border border-edge bg-surface-raised px-5 py-4 shadow-sm transition-all hover:shadow-md hover:border-edge-strong"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-tertiary">
                      {getOccupationCategoryLabel(occupation.major_category)}
                    </p>
                    <h2 className="mt-1 text-base font-semibold text-ink group-hover:text-accent-blue transition-colors">
                      {occupation.title}
                    </h2>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-semibold tracking-tight text-ink">{story.estimatedMinutes}<span className="ml-0.5 text-xs font-normal text-ink-tertiary">m</span></p>
                  </div>
                </Link>
              );
            })}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/ai-jobs/browse/page.tsx
git commit -m "feat: simplified browse cards — title, category, one number"
```

---

### Task 4: Build Verification

- [ ] **Step 1: Full build check**

Run: `npx next build`
Expected: clean build, all pages compile

- [ ] **Step 2: Dev server test**

Run: `pkill -f "next dev" 2>/dev/null; sleep 1; npm run dev &`

Open and verify:
- `http://localhost:3050/ai-jobs` — centered search, quick-start pills, minimal
- `http://localhost:3050/ai-jobs/browse` — simplified cards with one number each
- `http://localhost:3050/ai-jobs/about` — clean editorial layout

- [ ] **Step 3: Final commit with all changes**

```bash
git add -A
git commit -m "feat: UX redesign v2 — search-first landing, three-beat occupation, simplified browse"
```
