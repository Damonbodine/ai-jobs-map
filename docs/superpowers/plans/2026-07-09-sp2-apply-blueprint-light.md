# SP2 — Apply Blueprint Light Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every user-facing Timeback surface (header/footer, all pages, all charts) to the Blueprint Light design system — CRL's grammar rendered ink-on-ice — replacing the residual "Recovery Ink" look and all 58 scattered rainbow hex literals.

**Architecture:** SP1 already moved the tokens (`app/globals.css` `@theme` + `lib/brand.ts` + lockstep test), so most `bg-card`/`text-accent`-style classes already render Blueprint values. SP2 adds the *grammar*: mono-uppercase eyebrows and CTAs, hairlines, radius-0 everywhere, a single `DATA_SERIES`-derived module-accent map consumed by all charts, terminal panels as literal CRL-dark islands, and deletion of every `dark:` class and rainbow utility.

**Tech Stack:** Next.js 15 App Router, Tailwind v4 (`@theme` in `app/globals.css`), vitest (`npm test`), Playwright (port 3070, four local specs only).

**Branch:** `feature/sp2-apply-blueprint-light` (created in Task 1, off `main`).

## Global Constraints

Every task's requirements implicitly include ALL of these. Violating the ops rules has already caused real failures in SP1.

- **NEVER `git add -A` or `git add .`** — untracked QA screenshots and `.env.local`/`.env.production.local` sit at repo root. `git add` explicit paths only.
- **NEVER run `tests/e2e/live-qa.spec.ts`** — it submits REAL forms to production. Local e2e is exactly: `npx playwright test tests/e2e/build-a-team.spec.ts tests/e2e/contact-form.spec.ts tests/e2e/funnel-realness.spec.ts tests/e2e/occupation-inline-builder.spec.ts`. E2E baseline is **12 passed / 3 pre-existing failures** (2 in build-a-team, 1 in occupation-inline-builder); acceptance = "no NEW failures", not "all green".
- npm installs need `--force`, NOT `--legacy-peer-deps` (the latter silently drops `@testing-library/dom`). You should not need to install anything in SP2.
- `npm run lint` does not work (ESLint never configured — do NOT bootstrap it). Gates are: `npm run type-check`, `npm test` (52 unit tests), `npm run build`.
- Do not touch: `lib/site.ts` (AGENCY constants), `lib/analytics.ts` GA4 event names/payloads, `app/api/**`, `lib/pricing.ts` math, DB/Neon, Next.js version, `lib/pdf/**` (SP3), email templates (SP3), `app/opengraph-image.tsx` (SP3).
- Do not change any `data-testid`, `aria-label`, form field names, or link `href`s — e2e and analytics depend on them. Copy (visible text) changes only where a task explicitly says so.
- The lockstep test (`tests/unit/brand-lockstep.test.ts`) must stay green. SP2 adds NO new color tokens — if you think you need one, stop and report instead of inventing.
- Palette is contract-locked (`docs/brand-contract.md`). Chart/data colors come ONLY from `DATA_SERIES` in `lib/brand.ts`. Accessibility relief for the light ramp steps (they sit below 3:1 on white — this is accepted): fills always get a 2px surface gap or hairline border, identity always has an icon or text label beside the color, and **text never wears a series color** — numbers and headings stay in `text-foreground`/tokens.
- Delete every `dark:` class you encounter in files you touch (they are inert — class-gated with nothing applying `.dark`). Never add new ones.
- `rounded-*` classes through `rounded-lg` are already square (tokens are 0rem). Task 1 zeroes `xl`–`4xl` too. When editing a line anyway, you may drop now-inert `rounded-*` classes; do not do whole-file hunts for them. `rounded-full`: remove from pills/chips/badges (anything containing text); tiny decorative dots (≤ 8px, no text) may stay round.
- **CTA grammar** (from `docs/brand-contract.md`): primary = `bg-cyan text-foreground` + `font-mono text-xs font-semibold uppercase tracking-[0.14em]`, hover `hover:bg-cyan/80`; secondary = transparent + `border border-border` + same mono treatment, hover `hover:bg-secondary`. This applies to page-level CTAs (hero, sticky bars, CTA sections, header). Small in-card controls (Add, Select, Include-assistant toggles) keep sentence case and token colors — square, but not mono-uppercase.
- **Eyebrow style**: use the `.eyebrow` utility (Task 1) — mono 11px uppercase tracking 0.18em muted. Replace ad-hoc `text-[10px] font-medium uppercase tracking-wide` label patterns with it in files you touch.
- Numbers that carry data (minutes, hours, counts, stats) get `font-mono tabular-nums` (or keep existing `tabular-nums` and add `font-mono`).
- Shadows: delete `shadow-sm`/`shadow-md`/`shadow-lg`/`hover:shadow-*` in files you touch — hairlines carry depth in this system. (Exception: the occupation builder's sticky bar keeps its shadow — it must float above content; see Task 7.)
- Rainbow Tailwind utilities (`bg-green-100`, `text-indigo-500`, etc.) are always wrong. Standard translations: success/automated states → `bg-success/10 text-success border border-success/20`; info/assisted states → `bg-accent/10 text-accent border border-accent/20`; neutral chips → `bg-secondary/60 text-foreground border border-border`; gradients → flat `bg-card` or `bg-secondary/40`.
- After completing your task: run `npm run type-check && npm test && npm run build`, commit ONLY the files your task names, and report the diff summary + gate output. Do not push.

### The module-accent assignment (used by Tasks 2, 3, 7, 8, 10)

Fixed, stable identity — the same module is the same color everywhere in the app, forever. 10 modules on the 6-value `DATA_SERIES` ramp means four documented repeats; identity is never color-alone (icon + label always present).

| Module key | Hex | DATA_SERIES slot |
|---|---|---|
| intake | `#0f7fa8` | 0 (deep cyan) |
| analysis | `#47586b` | 3 (slate) |
| documentation | `#6fd4ec` | 1 (cyan) |
| coordination | `#0a1420` | 2 (ink) |
| exceptions | `#8fb4c9` | 4 (mist) |
| learning | `#c9dbe8` | 5 (pale ice) |
| research | `#0f7fa8` | 0 — repeat of intake |
| compliance | `#47586b` | 3 — repeat of analysis |
| communication | `#6fd4ec` | 1 — repeat of documentation |
| data_reporting | `#0a1420` | 2 — repeat of coordination |

---

### Task 1: Branch + foundation utilities (radius kill-switch, bg-grid, eyebrow)

**Files:**
- Modify: `app/globals.css`
- Test: `npm run build` + existing `tests/unit/brand-lockstep.test.ts` (must stay green — no color tokens change)

**Interfaces:**
- Produces: `.bg-grid` and `.eyebrow` utility classes; `rounded-xl`/`rounded-2xl`/`rounded-3xl` render square sitewide. Later tasks use `className="eyebrow"` and `className="bg-grid"`.

- [ ] **Step 1: Create the branch**

```bash
git checkout main && git pull && git checkout -b feature/sp2-apply-blueprint-light
```

- [ ] **Step 2: Zero the remaining radius tokens**

In `app/globals.css`, inside the existing `@theme` block, replace:

```css
  /* radius 0 — the engineering-drawing edge (2px exceptions must be logged
     in docs/brand-contract.md) */
  --radius-lg: 0rem;
  --radius-md: 0rem;
  --radius-sm: 0rem;
```

with:

```css
  /* radius 0 — the engineering-drawing edge (2px exceptions must be logged
     in docs/brand-contract.md). xl–4xl are zeroed too so the ~150 legacy
     rounded-xl/2xl call sites render square without editing each one. */
  --radius-lg: 0rem;
  --radius-md: 0rem;
  --radius-sm: 0rem;
  --radius-xl: 0rem;
  --radius-2xl: 0rem;
  --radius-3xl: 0rem;
  --radius-4xl: 0rem;
```

- [ ] **Step 3: Add the two grammar utilities**

In `app/globals.css`, replace the existing `@layer utilities` block:

```css
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

with:

```css
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  /* Faint engineering-grid motif (CRL uses ice-on-ink; here ink-on-ice). */
  .bg-grid {
    background-image:
      linear-gradient(to right, rgb(10 20 32 / 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgb(10 20 32 / 0.05) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  /* Mono uppercase section label — the CRL eyebrow. */
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-muted-foreground);
  }
}
```

- [ ] **Step 4: Verify gates**

Run: `npm run type-check && npm test && npm run build`
Expected: type-check clean; 52 tests pass (lockstep untouched — no `--color-*` values changed); build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat(sp2): radius-0 for xl+ tokens; bg-grid + eyebrow utilities"
```

---

### Task 2: One module-accent map — `lib/modules.ts` + rewire three chart files

**Files:**
- Modify: `lib/modules.ts`
- Modify: `components/TimeDonut.tsx:7-32` (delete local maps, import shared)
- Modify: `app/occupation/[slug]/occupation-builder.tsx:44-55,280` (delete local map, import shared)
- Modify: `app/build-a-team/role-builder.tsx:8-19,85` (delete local map, import shared)
- Create: `tests/unit/module-accents.test.ts`

**Interfaces:**
- Consumes: `DATA_SERIES` from `lib/brand.ts` (readonly tuple of 6 hex strings).
- Produces: `export const MODULE_ACCENTS: Record<ModuleKey, string>` from `lib/modules.ts` (values per the assignment table in Global Constraints); `MODULE_REGISTRY[*].color` becomes the uniform chip string `"border-border bg-secondary/60 text-foreground"`. Tasks 3, 7, 8, 10 import `MODULE_ACCENTS` from `@/lib/modules`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/module-accents.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { MODULE_ACCENTS, MODULE_KEYS, MODULE_REGISTRY } from "@/lib/modules"
import { DATA_SERIES } from "@/lib/brand"

describe("module accents (Blueprint Light)", () => {
  it("defines an accent for every module key", () => {
    for (const key of MODULE_KEYS) {
      expect(MODULE_ACCENTS[key], `missing accent for ${key}`).toBeDefined()
    }
  })

  it("only uses DATA_SERIES colors — no rainbow literals", () => {
    for (const key of MODULE_KEYS) {
      expect(DATA_SERIES).toContain(MODULE_ACCENTS[key])
    }
  })

  it("registry chip classes carry no dark: or rainbow utilities", () => {
    for (const def of Object.values(MODULE_REGISTRY)) {
      expect(def.color).not.toMatch(/dark:/)
      expect(def.color).not.toMatch(
        /(cyan|indigo|violet|emerald|amber|rose|teal|red|orange|sky)-\d/
      )
    }
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/module-accents.test.ts`
Expected: FAIL — `MODULE_ACCENTS` is not exported from `@/lib/modules`.

- [ ] **Step 3: Rewrite `lib/modules.ts` color system**

Add the import at the top of `lib/modules.ts`:

```ts
import { DATA_SERIES } from "@/lib/brand"
```

Add after the `MODULE_KEYS`/`ModuleKey` declarations:

```ts
/**
 * Fixed module→color assignment on the 6-value DATA_SERIES ramp
 * (docs/brand-contract.md). 10 modules on 6 colors means four documented
 * repeats — identity is never color-alone (icon + label always render
 * beside the swatch). Do not reorder: the same module keeps the same
 * color everywhere, forever.
 */
export const MODULE_ACCENTS: Record<ModuleKey, string> = {
  intake: DATA_SERIES[0],
  analysis: DATA_SERIES[3],
  documentation: DATA_SERIES[1],
  coordination: DATA_SERIES[2],
  exceptions: DATA_SERIES[4],
  learning: DATA_SERIES[5],
  research: DATA_SERIES[0],
  compliance: DATA_SERIES[3],
  communication: DATA_SERIES[1],
  data_reporting: DATA_SERIES[2],
}
```

Then in `MODULE_REGISTRY`, replace every per-module `color:` string (all 10 — they are the `bg-cyan-50/50 text-cyan-900 border-cyan-200/70 dark:...` rainbow strings) with the SAME uniform Blueprint chip string:

```ts
    color: "border-border bg-secondary/60 text-foreground",
```

- [ ] **Step 4: Rewire the three chart files to the shared map**

`components/TimeDonut.tsx` — delete lines 7–32 (the `DONUT_COLORS` map, its comment, and the local `MODULE_LABELS` map) and add to the imports:

```ts
import { MODULE_ACCENTS, MODULE_LABELS } from "@/lib/modules"
```

Then in the `slices` construction replace:

```ts
      color: DONUT_COLORS[agent.blockName] || "#6b7280",
```

with:

```ts
      color: MODULE_ACCENTS[agent.blockName as keyof typeof MODULE_ACCENTS] ?? "#47586b",
```

`app/occupation/[slug]/occupation-builder.tsx` — delete the `MODULE_ACCENTS` const (lines 44–55). The file already imports `MODULE_REGISTRY` from `@/lib/modules`; extend that import to `{ MODULE_REGISTRY, MODULE_ACCENTS }`. Replace line 280:

```ts
          const accent = MODULE_ACCENTS[moduleKey] ?? "#6b7280"
```

with:

```ts
          const accent = MODULE_ACCENTS[moduleKey as keyof typeof MODULE_ACCENTS] ?? "#47586b"
```

`app/build-a-team/role-builder.tsx` — delete the `MODULE_ACCENTS` const (lines 8–19); extend the existing `@/lib/modules` import to `{ MODULE_REGISTRY, MODULE_ACCENTS }`; replace line 85 the same way as above.

- [ ] **Step 5: Run the gates**

Run: `npx vitest run tests/unit/module-accents.test.ts` → PASS (3 tests).
Run: `npm run type-check && npm test && npm run build` → all green (55 unit tests now).

- [ ] **Step 6: Commit**

```bash
git add lib/modules.ts components/TimeDonut.tsx "app/occupation/[slug]/occupation-builder.tsx" app/build-a-team/role-builder.tsx tests/unit/module-accents.test.ts
git commit -m "feat(sp2): single DATA_SERIES module-accent map; kill 33 rainbow chart hexes"
```

---

### Task 3: TimeDonut Blueprint restyle (gaps, ink text, square marks)

**Files:**
- Modify: `components/TimeDonut.tsx`

**Interfaces:**
- Consumes: `MODULE_ACCENTS`, `MODULE_LABELS` from Task 2 (already wired).
- Produces: nothing new — visual-only changes; props unchanged.

Design rules being applied (accessibility relief for the locked palette): every slice separated by a 2px surface gap; **text never wears the series color**; legend swatches square with a hairline; labels always beside color.

- [ ] **Step 1: Add slice gaps and a surface ring**

In the donut `<circle>` element (line ~101), add a white gap between slices by adding these two attributes to each arc circle — replace:

```tsx
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={arc.offset}
                  strokeLinecap="butt"
```

with (unchanged except context — the gap comes from the next step's overlay):

```tsx
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={arc.offset}
                  strokeLinecap="butt"
```

then immediately AFTER the `{arcs.map(...)}` block (still inside the `<svg>`), add radial 2px separator lines between slices:

```tsx
              {arcs.map((arc) => {
                const angle = ((arc.rotation + 90) / 180) * Math.PI
                const inner = radius - strokeWidth / 2 - 4
                const outer = radius + strokeWidth / 2 + 4
                return (
                  <line
                    key={`sep-${arc.blockName}`}
                    x1={center + inner * Math.sin(angle)}
                    y1={center - inner * Math.cos(angle)}
                    x2={center + outer * Math.sin(angle)}
                    y2={center - outer * Math.cos(angle)}
                    stroke="var(--color-card)"
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                )
              })}
```

(`arc.rotation + 90` is each slice's start angle in degrees from 12 o'clock; drawing a card-colored 2px radial line at every boundary gives the mandated surface gap without changing hit areas.)

- [ ] **Step 2: Ink text, never series color**

Center label (line ~125) — replace:

```tsx
                  <div className="font-heading text-2xl font-bold" style={{ color: activeData.color }}>
                    {activeData.minutes}
                  </div>
```

with:

```tsx
                  <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
                    {activeData.minutes}
                  </div>
```

Idle center (line ~132) — replace:

```tsx
                  <div className="font-heading text-2xl font-bold text-accent">
                    {totalMinutes}
                  </div>
```

with:

```tsx
                  <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
                    {totalMinutes}
                  </div>
```

Detail-panel heading (line ~171) — replace:

```tsx
                <h3 className="font-heading text-lg font-semibold" style={{ color: activeData.color }}>
                  {activeData.label} Agent
                </h3>
```

with:

```tsx
                <h3 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                  <span
                    className="inline-block h-3 w-3 shrink-0 border border-border"
                    style={{ backgroundColor: activeData.color }}
                  />
                  {activeData.label} Agent
                </h3>
```

- [ ] **Step 3: Square legend swatches + mono numbers + eyebrows + tier badges**

Legend swatch (line ~156) — replace `"w-2.5 h-2.5 rounded-full flex-shrink-0"` with `"w-2.5 h-2.5 border border-border flex-shrink-0"`.

Legend minutes (line ~160) — replace `"text-muted-foreground tabular-nums"` with `"font-mono text-muted-foreground tabular-nums"`.

The three section labels (`Capabilities included`, `Tasks handled (…)`, `Tools` — lines ~182, ~199, ~226): replace their className `"text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2"` with `"eyebrow mb-2"` (keep the `mb-*` value each had).

Tier badges (line ~208) — replace:

```tsx
                          task.tier === "automated" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
```

with:

```tsx
                          task.tier === "automated" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
```

Card wrapper (line ~94): replace `"rounded-2xl border border-border bg-card p-5 sm:p-6 mb-8"` with `"border border-border bg-card p-5 sm:p-6 mb-8"`.

Remove the now-inert `rounded-md`/`rounded-lg`/`rounded` classes on lines you touched (legend buttons, capability cards, tool chips) — leave untouched lines alone.

- [ ] **Step 4: Run gates**

Run: `npm run type-check && npm test && npm run build` → green. Confirm with `grep -n 'dark:\|green-\|blue-' components/TimeDonut.tsx` → no matches.

- [ ] **Step 5: Commit**

```bash
git add components/TimeDonut.tsx
git commit -m "feat(sp2): TimeDonut — slice gaps, ink data text, square swatches, token badges"
```

---

### Task 4: UI primitives — strip `dark:`, hairline depth

**Files:**
- Modify: `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/dropdown-menu.tsx`, `components/ui/sheet.tsx`, `components/ui/dialog.tsx`

**Interfaces:**
- Consumes/Produces: no API changes — variant names, props, and exports stay identical. Class-string surgery only.

- [ ] **Step 1: `button.tsx`**

In the cva base string (line 9): delete `dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40` and the `rounded-lg` token (inert). In `outline` variant: delete `dark:border-input dark:bg-input/30 dark:hover:bg-input/50`. In `ghost`: delete `dark:hover:bg-muted/50`. In `destructive`: delete `dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40`. In the `xs`/`sm`/`icon-xs`/`icon-sm` sizes: the `rounded-[min(var(--radius-md),10px)]`-style arbitrary values are inert (0rem) — replace each with nothing (delete the class); also delete the `in-data-[slot=button-group]:rounded-lg` fragments.

- [ ] **Step 2: `input.tsx`, `dropdown-menu.tsx`, `sheet.tsx`, `dialog.tsx`**

Run `grep -n 'dark:' components/ui/input.tsx components/ui/dropdown-menu.tsx components/ui/sheet.tsx components/ui/dialog.tsx` and delete every `dark:*` utility (only the `dark:`-prefixed classes — nothing else on those lines). In `dropdown-menu.tsx` and `sheet.tsx`, replace `shadow-md`/`shadow-lg` with `shadow-none border border-border` — EXCEPTION: popover-layer components (dropdown content, dialog, sheet) may keep a soft shadow if they already have one AND removing it makes them indistinguishable from the page; in that case keep exactly `shadow-lg` and note it in your report (floating layers are the one place depth is functional).

- [ ] **Step 3: Run gates + e2e**

Run: `npm run type-check && npm test && npm run build` → green.
Run: `npx playwright test tests/e2e/build-a-team.spec.ts tests/e2e/contact-form.spec.ts tests/e2e/funnel-realness.spec.ts tests/e2e/occupation-inline-builder.spec.ts`
Expected: 12 passed / 3 pre-existing failures — no NEW failures (buttons/inputs are on every tested flow).

- [ ] **Step 4: Commit**

```bash
git add components/ui/button.tsx components/ui/input.tsx components/ui/dropdown-menu.tsx components/ui/sheet.tsx components/ui/dialog.tsx
git commit -m "feat(sp2): ui primitives — strip dark: variants, hairline depth"
```

---

### Task 5: Header + Footer to CRL grammar

**Files:**
- Modify: `components/layout/Header.tsx`, `components/layout/Footer.tsx`

**Interfaces:**
- Consumes: `.eyebrow` utility (Task 1). All `href`s, `track()` calls, and link labels stay EXACTLY as they are.

- [ ] **Step 1: Header desktop nav — mono uppercase**

In `components/layout/Header.tsx`, replace the desktop nav link className (lines ~79-84):

```tsx
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
```

with:

```tsx
              className={cn(
                "font-mono text-[11px] font-medium uppercase tracking-[0.16em] transition-colors hover:text-foreground",
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
```

- [ ] **Step 2: Header CTA — cyan fill, ink text**

Replace the desktop CTA `<a>` className (line ~92):

```tsx
            className="text-sm font-semibold bg-foreground text-background px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
```

with:

```tsx
            className="bg-cyan px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-cyan/80"
```

Replace the mobile CTA className (line ~130):

```tsx
              className="flex-1 text-center py-2.5 text-sm font-semibold bg-foreground text-background rounded-lg active:opacity-80 transition-opacity"
```

with:

```tsx
              className="flex-1 bg-cyan py-2.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors active:bg-cyan/80"
```

- [ ] **Step 3: Header mobile links + wordmark polish**

Mobile link className (line ~114): replace `"block py-3 px-3 -mx-1 rounded-lg text-sm font-medium transition-colors active:bg-secondary"` with `"block py-3 px-3 -mx-1 font-mono text-xs font-medium uppercase tracking-[0.16em] transition-colors active:bg-secondary"`.

Keep the wordmark (`font-heading text-lg font-semibold tracking-tight`) and the "by Clear Road Labs" microcopy as they are.

- [ ] **Step 4: Footer — eyebrow column headings, mono meta line**

In `components/layout/Footer.tsx`: replace each of the three column-heading `<h4 className="text-sm font-semibold mb-3">` with `<h4 className="eyebrow mb-3">` (keeping the text). Replace the brand `<h3 className="font-heading text-base font-semibold mb-2">` as-is (no change). In the bottom meta row (line ~114), add `font-mono text-[11px]` in place of `text-xs`: replace `"mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground"` with `"mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 font-mono text-[11px] text-muted-foreground"`.

- [ ] **Step 5: Gates + commit**

Run: `npm run type-check && npm test && npm run build` → green.

```bash
git add components/layout/Header.tsx components/layout/Footer.tsx
git commit -m "feat(sp2): header/footer — mono nav grammar, cyan CTA"
```

---

### Task 6: Homepage `/` + landing search

**Files:**
- Modify: `app/page.tsx`, `app/landing-search.tsx`

**Interfaces:**
- Consumes: `.eyebrow`, `.bg-grid` (Task 1); CTA grammar (Global Constraints). No data-fetching, copy, or link changes except where shown.

- [ ] **Step 1: Hero — grid motif + eyebrow badge**

In `app/page.tsx`, hero section (line ~220): replace `<section className="container mx-auto px-4 pt-20 pb-16 text-center">` with `<section className="bg-grid border-b border-border"><div className="container mx-auto px-4 pt-20 pb-16 text-center">` and close the extra `</div>` before `</section>`.

Badge (line ~222): replace:

```tsx
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border mb-6">
            Grounded in BLS &amp; O*NET task data
          </span>
```

with:

```tsx
          <span className="eyebrow inline-block border border-border bg-card px-3 py-1.5 mb-6">
            Grounded in BLS &amp; O*NET task data
          </span>
```

- [ ] **Step 2: Cards and chips — drop shadows and pills**

Featured-example card (line ~245): in its className delete `hover:shadow-md` and `rounded-xl`; add `hover:border-foreground/30` in place of `hover:border-ring/40`.
Popular-occupation cards (line ~290): same — delete `shadow-sm hover:shadow-md`, `rounded-xl`; replace `hover:border-ring/40` with `hover:border-foreground/30`. In the minutes span (line ~295), add `font-mono tabular-nums` → `"font-mono tabular-nums text-sm font-semibold text-accent ml-4 shrink-0"`.
Category chips (line ~362): replace `rounded-full` with nothing (square chip), `hover:border-ring/40` → `hover:border-foreground/30`.
Data-credibility dots (line ~334): `w-1 h-1 rounded-full bg-accent` may stay (sub-8px dot).
CTA card (line ~378): delete `rounded-2xl` and `shadow-sm`.

- [ ] **Step 3: Section headings get numbered eyebrows**

Above each of the three `<h2 className="font-heading text-xl font-semibold ...">` headings (`Popular occupations` ~line 282, `Browse by category` ~line 352) and the CTA `<h2>` (~line 379), insert an eyebrow line, numbering in page order:

```tsx
          <div className="eyebrow mb-2">SEC 01 · Popular occupations</div>
```

```tsx
          <div className="eyebrow mb-2">SEC 02 · Browse</div>
```

```tsx
            <div className="eyebrow mb-3">SEC 03 · Next step</div>
```

(Insert inside the existing `FadeIn` wrappers, directly above each `<h2>`. Keep the `<h2>` text unchanged.)

- [ ] **Step 4: Stats row — mono tabular numerals**

Line ~312: replace `"font-heading text-4xl font-bold text-foreground"` with `"font-mono text-4xl font-bold tabular-nums text-foreground"`.

- [ ] **Step 5: CTA buttons to contract grammar**

Line ~387 (`Browse all occupations`): replace className with `"inline-flex items-center justify-center border border-border bg-transparent px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-secondary"`.
Line ~393 (`Plan my team`): replace className with `"inline-flex items-center justify-center bg-cyan px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-cyan/80"`.

- [ ] **Step 6: `app/landing-search.tsx` sweep**

Read the file. Delete `shadow-*` classes (3), any `rounded-full`/`rounded-xl` on the search container and result rows, and any `dark:` classes; replace hover ring/shadow affordances with `focus-within:border-ring` / `hover:bg-secondary/40` on the same elements. No logic, placeholder-text, or handler changes.

- [ ] **Step 7: Gates + commit**

Run: `npm run type-check && npm test && npm run build` → green.

```bash
git add app/page.tsx app/landing-search.tsx
git commit -m "feat(sp2): homepage — grid hero, eyebrows, mono stats, contract CTAs"
```

---

### Task 7: Occupation page (the money page)

**Files:**
- Modify: `app/occupation/[slug]/page.tsx`, `app/occupation/[slug]/occupation-builder.tsx`, `app/occupation/[slug]/one-pager-button.tsx`, `app/occupation/[slug]/estimate-info.tsx`

**Interfaces:**
- Consumes: `MODULE_ACCENTS` (already wired by Task 2), `.eyebrow`, CTA grammar.
- Produces: nothing — visual only. All `data-testid`s (`occupation-builder-submit-form`, `occupation-builder-submit-sticky`) and aria-labels unchanged (e2e depends on them).

- [ ] **Step 1: `occupation-builder.tsx` — grammar sweep**

Apply exactly these changes (all line refs from current file):

1. Line ~274 wrapper: `"rounded-2xl border border-border bg-card overflow-hidden"` → `"border border-border bg-card overflow-hidden"`.
2. Selected-state colors — replace hardcoded black/white state classes with tokens throughout the module rows and task rows: every `bg-white` → `bg-card`, `text-black` → `text-foreground`, `text-black/80` → `text-foreground/80`, `text-black/75` → `text-muted-foreground`, `text-black/70` → `text-foreground/70`, `bg-black text-white` → `bg-primary text-primary-foreground` (lines ~298, ~307, ~326-327, ~332, ~339, ~353, ~373, ~411, ~417, ~424, ~436).
3. Module include buttons (line ~371): keep sentence case; replace `rounded-lg` (inert) with nothing; `bg-accent text-white` stays (token).
4. Task-row scope chip (line ~434): `rounded-md` → delete; `bg-black text-white shadow-sm` → `bg-primary text-primary-foreground`.
5. Expanded-table column headers (lines ~389-396): replace each `"text-xs font-semibold text-muted-foreground uppercase tracking-wide"` with `"eyebrow"` (keep alignment/min-width classes).
6. Build-phase panel (line ~458): `rounded-2xl` → delete. Stat tiles (lines ~468, ~485, ~491): `rounded-xl` → delete; hours number (line ~487): `"font-heading text-2xl font-bold text-accent"` → `"font-mono text-2xl font-bold tabular-nums text-accent"`; selected-minutes number (line ~493): `"font-heading text-2xl font-bold"` → `"font-mono text-2xl font-bold tabular-nums"`.
7. Micro-labels `Custom requests` / `Contact` / `Name` / `Email` (lines ~500, ~547, ~552, ~563): className → `"eyebrow"` (keep `mb-*`).
8. Custom-request chips (line ~529): `rounded-full` → delete.
9. Inputs (lines ~514, ~559, ~573): delete `rounded-lg`; leave everything else.
10. Primary submit button (line ~593): replace className with `"inline-flex w-full items-center justify-center gap-2 bg-cyan px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-cyan/80 disabled:opacity-50 sm:w-auto"` (keep aria-label + data-testid + children).
11. Done-phase: line ~610 `rounded-2xl` → delete; line ~628 `rounded-2xl` → delete; "Start with an audit" CTA (line ~639): replace className with `"inline-flex items-center justify-center gap-2 bg-cyan px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-cyan/80"`; related-role cards (line ~672): `rounded-xl` → delete, `hover:border-accent/50` stays.
12. Sticky bar (line ~702): `rounded-2xl` → delete; KEEP the shadow (`shadow-[0_-10px_30px_rgba(0,0,0,0.18)]`) — the floating bar needs functional depth; add a note in your report that this is the logged exception. Stats in the bar (lines ~707-713, ~727-731): wrap the numeric spans with `font-mono tabular-nums` (e.g. `"font-mono tabular-nums font-semibold text-foreground"`).
13. Sticky/select-phase buttons (lines ~718, ~738): replace both classNames with the same cyan contract string as step 10 (keep disabled logic, aria-labels, data-testids, `w-full sm:w-auto`).

- [ ] **Step 2: `page.tsx`, `one-pager-button.tsx`, `estimate-info.tsx` sweep**

Read each file, then apply the Global Constraints translations: delete `dark:` classes, `shadow-*` (estimate-info has 1 — if it is a popover/tooltip floating layer, keep `shadow-lg` and report), inert `rounded-*`; ad-hoc uppercase micro-labels → `.eyebrow`; big stat numerals → `font-mono tabular-nums`; any `bg-foreground text-background` or `bg-accent text-white` page-level CTA → cyan contract grammar; in-card small controls keep sentence case. Do not touch data fetching, `generateMetadata`, or copy.

- [ ] **Step 3: Gates + e2e + commit**

Run: `npm run type-check && npm test && npm run build` → green.
Run the four local e2e specs → no NEW failures (baseline: 12 pass / 3 pre-existing).

```bash
git add "app/occupation/[slug]/page.tsx" "app/occupation/[slug]/occupation-builder.tsx" "app/occupation/[slug]/one-pager-button.tsx" "app/occupation/[slug]/estimate-info.tsx"
git commit -m "feat(sp2): occupation page — token states, eyebrow labels, cyan CTAs"
```

---

### Task 8: Build-a-team surface

**Files:**
- Modify: `app/build-a-team/page.tsx`, `app/build-a-team/cart.tsx`, `app/build-a-team/role-builder.tsx`, `app/build-a-team/pdf-modal.tsx`, `app/build-a-team/team-contact-form.tsx`, `app/build-a-team/results.tsx`, `app/build-a-team/team-done.tsx`, `app/build-a-team/template-picker.tsx`

**Interfaces:**
- Consumes: `MODULE_ACCENTS` (Task 2), `.eyebrow`, CTA grammar. All `data-testid`s and form field names unchanged (build-a-team e2e spec runs against this page).

- [ ] **Step 1: `role-builder.tsx` exact edits**

1. Line ~81 wrapper: `rounded-xl` → delete.
2. Line ~95: `allSelected ? "bg-white" : ...` → `allSelected ? "bg-card" : ...`.
3. Line ~102 icon tile: `rounded-lg` → delete (keep the inline `borderColor`/`color` accent style).
4. Line ~109: `text-black` → `text-foreground`.
5. Line ~111 minutes span: add `font-mono` → `"ml-2 font-mono text-xs font-normal text-muted-foreground tabular-nums"`.
6. Select button (line ~128): `rounded-lg` → delete; `bg-black text-white hover:opacity-90` → `bg-primary text-primary-foreground hover:opacity-90`; `bg-accent text-white` stays.
7. Task checkbox (line ~150): `rounded` → delete; `bg-black border-black` → `bg-primary border-primary`; `text-white` (line ~153) → `text-primary-foreground`.
8. Line ~161 minutes: add `font-mono`.

- [ ] **Step 2: Remaining seven files — grammar sweep**

Read each file, apply the Global Constraints translations (same recipe as Task 7 Step 2): `dark:` deletions, shadow deletions (floating modal layers may keep `shadow-lg` — report if so), inert `rounded-*` cleanups on touched lines, `rounded-full` pills → square, micro-labels → `.eyebrow`, stat numerals → `font-mono tabular-nums`, `bg-black`/`bg-white`/`text-black`/`text-white` state colors → `bg-primary`/`bg-card`/`text-foreground`/`text-primary-foreground` tokens, page-level CTAs → cyan contract grammar, rainbow badge utilities → success/accent token recipes. Zero logic, zero copy, zero testid changes.

- [ ] **Step 3: Gates + e2e + commit**

Run: `npm run type-check && npm test && npm run build` → green.
Run the four local e2e specs → no NEW failures (build-a-team spec's 2 failures are pre-existing).

```bash
git add app/build-a-team
git commit -m "feat(sp2): build-a-team — Blueprint grammar sweep"
```

(`git add app/build-a-team` is a specific tracked directory — allowed; it contains no env files or screenshots.)

---

### Task 9: Browse + category pages

**Files:**
- Modify: `app/browse/page.tsx`, `app/browse/filters.tsx`, `app/category/[category]/page.tsx`

**Interfaces:**
- Consumes: `.eyebrow`, CTA grammar.

- [ ] **Step 1: Sweep all three files**

Read each file, apply the Global Constraints translations. Specific known items: `app/browse/filters.tsx` has 1 gradient (→ flat `bg-card` or `bg-secondary/40`); `app/category/[category]/page.tsx` has 1 gradient + 1 shadow; occupation-card lists get `hover:border-foreground/30` instead of shadow/ring hovers; minutes/counts get `font-mono tabular-nums`; category header micro-labels → `.eyebrow`.

- [ ] **Step 2: Gates + commit**

Run: `npm run type-check && npm test && npm run build` → green.

```bash
git add app/browse "app/category/[category]"
git commit -m "feat(sp2): browse + category — Blueprint grammar sweep"
```

---

### Task 10: Demo surface — terminal islands + agent accents

**Files:**
- Modify: `lib/demo/agent-metadata.ts`, `lib/demo/demo-scripts.ts`
- Modify: `components/demo/AgentLoopDiagram.tsx`, `components/demo/DemoTimeline.tsx`, `components/demo/AgentSuiteDemo.tsx`, `components/demo/AgentExpandedView.tsx`, `components/demo/AgentOutputPanel.tsx`, `components/demo/OccupationDemoSection.tsx`, `components/demo/CustomDemoForm.tsx`, `components/demo/CustomDemoResult.tsx`, `components/demo/DemoTeaser.tsx`, `components/demo/EmailCaptureCard.tsx`, `components/demo/OccupationSearch.tsx`, `components/demo/DemoHeroText.tsx`
- Modify: `app/demo/page.tsx`, `app/demo/[slug]/page.tsx`, `app/demo/[slug]/error.tsx`, `app/demo/[slug]/loading.tsx`, `app/demo/loading.tsx`, `app/demo/try/page.tsx`

**Interfaces:**
- Consumes: `MODULE_ACCENTS` from `@/lib/modules`, `BRAND` from `@/lib/brand`, `.eyebrow`.
- Produces: `accentColor` fields keep their type (string hex) — only VALUES change, so no component API breaks.

**The accent rule for this task:** terminal-dark surfaces (ink `bg-terminal` panels) use FIXED brand accents — cyan `#6fd4ec` for active/accent text, ice `#e3ecf4` for primary text, `rgba(227,236,244,…)` for white/xx opacity ramps; per-agent `accentColor` is only used on LIGHT surfaces (timeline dots, progress bars) and must come from `MODULE_ACCENTS`. Text on ink never wears a per-agent color.

- [ ] **Step 1: Remap the 25 accent hexes in `lib/demo`**

`lib/demo/agent-metadata.ts` (10 values): add `import { MODULE_ACCENTS } from "@/lib/modules"` and replace each literal `accentColor: "#…"` with `accentColor: MODULE_ACCENTS.<moduleKey>` matching that row's module key (intake→`MODULE_ACCENTS.intake`, etc.).

`lib/demo/demo-scripts.ts` (15 values): same import; each `accentColor:` literal sits inside a script section whose module key is identifiable from its surrounding object (each script block has a `moduleKey` or corresponds to a named agent — read the structure and map to the same module's `MODULE_ACCENTS` entry). If any block's module is genuinely ambiguous, use `MODULE_ACCENTS.intake` and flag it in your report.

- [ ] **Step 2: `AgentLoopDiagram.tsx` exact edits**

1. Line ~63 wrapper: `"relative rounded-xl overflow-hidden bg-terminal border border-white/8"` → `"relative overflow-hidden bg-terminal border border-terminal-foreground/15"`.
2. All `text-white/N` and `border-white/N` fractions in this file → the same fraction of `terminal-foreground` (e.g. `text-white/50` → `text-terminal-foreground/50`, `border-white/8` → `border-terminal-foreground/15`).
3. Line ~108/174 (`accentColor="#ffffff"`) → `accentColor="#e3ecf4"`; line ~145 (`accentColor="#10b981"`) → `accentColor="#6fd4ec"`.
4. Line ~258 AI chip: `accentColor === "#ffffff" ? "#3b82f6" : accentColor` → `accentColor === "#e3ecf4" ? "#6fd4ec" : accentColor`, and `color: "white"` → `color: "#0a1420"` (ink text on cyan chip, per CTA grammar); also `rounded-full` on that chip → delete.
5. LoopBox label (line ~264): add mono — `"text-[8px] font-bold tracking-widest mb-1"` → `"font-mono text-[8px] font-bold tracking-widest mb-1"`; the label color logic stays but inactive color `"rgba(255,255,255,0.3)"` → `"rgba(227,236,244,0.35)"`.
6. LoopBox backgrounds (line ~251): `rgba(255,255,255,0.05)`/`0.03` → `rgba(227,236,244,0.06)`/`rgba(227,236,244,0.04)`; borderColor fallbacks `rgba(255,255,255,0.55)`/`0.08` → `rgba(227,236,244,0.55)`/`rgba(227,236,244,0.12)`. `rounded-lg` on LoopBox and the pulse ring → delete.
7. The `"Your approval required"` chip (line ~181): `rounded-full bg-white/10 text-white/60` → `bg-terminal-foreground/10 text-terminal-foreground/70` (drop `rounded-full`); "Done" chip (line ~200): drop `rounded-full` (keep success tokens — success on ink is legible).
8. Glow (line ~214): `${accentColor}22` is fine now that accents are brand colors; leave the mechanism.

- [ ] **Step 3: `DemoTimeline.tsx` exact edits**

1. Role chips (line ~37): `rounded-full` → delete; keep the active/inactive token classes.
2. Line ~50 day label: `"px-3 pb-2 text-[9px] font-bold tracking-widest text-muted-foreground uppercase"` → `"eyebrow px-3 pb-2 text-[9px]"`.
3. Hardcoded grays: line ~68 `color: isActive ? "rgba(255,255,255,0.5)" : "#999"` → `isActive ? "rgba(242,246,249,0.6)" : "var(--color-muted-foreground)"`; line ~80 same treatment (`#aaa` → `var(--color-muted-foreground)`).
4. Active row (line ~62-66): the animated `--color-foreground` background + `text-background` stays (ink row on light = a mini terminal island — correct); `text-white` (line ~76) → `text-background`; `rounded-lg` → delete; progress bar `rounded-b-lg` (line ~95) → delete.
5. Dots (line ~73): stay round (≤8px) and now render `MODULE_ACCENTS` values via `agent.accentColor`.
6. Summary footer (line ~107): delete all `dark:` classes; `rounded-lg` → delete; number (line ~111): `"text-xl font-black text-accent"` → `"font-mono text-xl font-bold tabular-nums text-accent"`.

- [ ] **Step 4: Remaining demo components + pages — sweep**

Read each remaining file and apply: `dark:` deletions; on any ink/terminal panel, `white/N` → `terminal-foreground/N` and rainbow accents → cyan/ice per the accent rule; on light surfaces, rainbow utilities → token recipes (success/accent/secondary per Global Constraints); pills with text → square; gradients (2: `app/demo/page.tsx`, `AgentLoopDiagram` handled above) → flat; `font-black` → `font-bold`; stat numerals → `font-mono tabular-nums`; micro-labels → `.eyebrow`; email-capture and custom-demo form CTAs (page-level) → cyan contract grammar; `app/demo/[slug]/error.tsx` rainbow → `text-destructive` tokens. `DemoTeaser.tsx` renders on the homepage — same rules. Zero logic/copy/testid changes.

- [ ] **Step 5: Gates + e2e + commit**

Run: `npm run type-check && npm test && npm run build` → green.
Run the four local e2e specs (funnel-realness covers demo entry points) → no NEW failures.

```bash
git add lib/demo/agent-metadata.ts lib/demo/demo-scripts.ts components/demo app/demo
git commit -m "feat(sp2): demo surface — CRL-dark terminal islands, brand agent accents"
```

---

### Task 11: Products, about, principles, contact, legal, blueprint view — final sweep

**Files:**
- Modify: `app/products/page.tsx`, `app/about/page.tsx`, `app/principles/page.tsx`, `app/contact/page.tsx`, `app/contact/contact-form.tsx`, `app/privacy/page.tsx`, `app/security/page.tsx`, `app/terms/page.tsx`, `app/blueprint/[slug]/blueprint-view.tsx`

**Interfaces:**
- Consumes: `MODULE_REGISTRY` chip strings (Task 2 made them uniform Blueprint chips — products page line ~61 and blueprint-view line ~30 pick this up automatically), `.eyebrow`, CTA grammar.

- [ ] **Step 1: Sweep all nine files**

Read each file, apply the Global Constraints translations. Known hotspots: `app/products/page.tsx` — 16 `rounded-full` pills (→ square chips), 8 rainbow utilities (→ token recipes), 1 shadow, 1 `dark:`; `app/blueprint/[slug]/blueprint-view.tsx` — 5 `rounded-full`, 4 rainbow, 2 `dark:` (its `MODULE_COLORS` usage is already fixed by Task 2); `app/security/page.tsx` — 7 `rounded-full`; contact form submit button → cyan contract grammar (keep field names/handlers; contact-form e2e runs against it). Section headings on products/about get numbered eyebrows (`SEC 01 · …`) matching the homepage pattern where a heading already exists — do not invent new copy beyond the eyebrow labels.

- [ ] **Step 2: Repo-wide zero-residue assertion**

Run and paste output in your report:

```bash
grep -rn 'dark:' app components lib --include='*.tsx' --include='*.ts' | grep -v node_modules | grep -v '\.test\.' ; echo "dark: exit=$?"
grep -rEn '(bg|text|border)-(red|green|blue|yellow|amber|orange|rose|pink|purple|violet|indigo|sky|cyan|teal|emerald|lime|fuchsia)-[0-9]+' app components lib --include='*.tsx' | grep -v node_modules ; echo "rainbow exit=$?"
grep -rn '#[0-9a-fA-F]\{6\}' app components lib/demo lib/modules.ts --include='*.tsx' --include='*.ts' | grep -v 'lib/pdf\|app/api\|opengraph-image\|\.test\.' ; echo "hex exit=$?"
```

Expected: first two greps empty (exit=1). Third grep: the ONLY remaining hexes are the fixed brand values in `components/demo/AgentLoopDiagram.tsx` (`#e3ecf4`, `#6fd4ec`, `#0a1420`, ice rgba strings) and `#47586b` chart fallbacks — anything else must be fixed before committing. (`app/globals.css` and `lib/brand.ts` hexes are exempt — they ARE the source.)

- [ ] **Step 3: Full gates + e2e + commit**

Run: `npm run type-check && npm test && npm run build` → green.
Run the four local e2e specs → no NEW failures (contact-form spec exercises the restyled form).

```bash
git add app/products app/about app/principles app/contact app/privacy app/security app/terms "app/blueprint/[slug]"
git commit -m "feat(sp2): products/about/legal/blueprint — final Blueprint sweep, zero dark:/rainbow residue"
```

---

## Self-review notes (done at plan time)

- Spec coverage: header/footer (T5), page order `/`(T6) → occupation(T7) → build-a-team(T8) → browse/category(T9) → demo(T10) → products/about/principles/contact/legal(T11); charts TimeDonut(T2+T3), occupation-builder(T2,T7), role-builder(T2,T8); AgentLoopDiagram+DemoTimeline(T10); terminal panels(T10); radius-0(T1 + per-task cleanups); bg-grid+eyebrows(T1, applied T5–T11); `lib/modules.ts` accents(T2); `dark:` deletion(T2–T11 + T11 assertion); copy polish deliberately near-zero (only eyebrow labels added — spec says polish ONLY where a touched money page reads off-voice; none did).
- The 25 `lib/demo` accent hexes were not in the spec's 33-hex inventory but are the "residual indigo/purple accents" the spec's terminal-panel line targets — folded into T10, flagged for Damon at the gate.
- Sticky-bar shadow kept (functional floating depth) — logged as exception in T7; floating-layer shadows in T4/T8 conditionally kept and reported.
- Gate (after T11, session-model work, not a subagent task): screenshots at 1440+390 of `/`, `/occupation/registered-nurses`, `/build-a-team`, `/browse`, one category page, `/demo`, one `/demo/[slug]`, `/demo/try`, `/products`, `/about`, `/contact`, one legal page → scratchpad → STOP for Damon's explicit go → merge to main → push (production deploy) → ledger update.
