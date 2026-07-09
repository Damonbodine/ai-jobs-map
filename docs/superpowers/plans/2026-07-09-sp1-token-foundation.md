# SP1 — Token Foundation Implementation Plan (Blueprint Light)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Timeback's v3-shimmed "Recovery Ink" token system with native Tailwind v4 `@theme` Blueprint Light tokens, `lib/brand.ts` TS mirrors, a CSS↔TS lockstep test, Geist typography, and no dark-mode machinery.

**Architecture:** One rewrite of `app/globals.css` to `@theme` (killing `tailwind.config.js` and its `@config` shim) keeps every existing utility name (`bg-background`, `text-accent`, `font-heading`…) working while swapping the values under them. `lib/brand.ts` mirrors the palette for PDF/email/OG; a vitest lockstep test parses the CSS and fails on drift.

**Tech Stack:** Next 15.5 App Router, React 19, Tailwind CSS 4.2 (native `@theme` after this plan), vitest (first unit test in this repo), Playwright (local specs only).

**Spec:** `docs/superpowers/specs/2026-07-09-blueprint-light-unification-design.md` (SP1 section)

## Global Constraints

- **Repo:** `/Users/damonbodine/ai-jobs-map`. Branch: create `feature/sp1-token-foundation` off `main` first.
- **NEVER `git add -A` or `git add .`** — untracked QA screenshots and `.env.local` / `.env.production.local` live at repo root. Stage explicit paths only.
- **NEVER run `tests/e2e/live-qa.spec.ts`** — it submits real forms to production. Local e2e = exactly these four files: `tests/e2e/build-a-team.spec.ts tests/e2e/contact-form.spec.ts tests/e2e/funnel-realness.spec.ts tests/e2e/occupation-inline-builder.spec.ts`.
- **Do not touch:** `lib/site.ts` (AGENCY/SITE constants), GA4 analytics (`lib/analytics.ts`), any `app/api/**`, the DB layer, Next.js version.
- **Utility names must survive:** every class used in components today (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-secondary`, `border-border`, `text-accent`, `bg-accent`, `ring`, `bg-terminal`, `text-terminal-foreground`, `bg-success`, `text-destructive`, `rounded-lg/md/sm`, `font-heading`, `font-body`) must still resolve after the rewrite — values change, names don't.
- **Expected visual delta of SP1** (for the reviewer, so it isn't mistaken for breakage): background warms→cools slightly, blue accents become deep cyan, corners square off, serif headings become Geist. Layout/spacing unchanged. The full Blueprint look lands in SP2.
- Commands run from the repo root. Dev server port 3050 (`npm run dev`); Playwright manages its own server on 3070.
- Type checks: `npm run type-check`. Lint: `npm run lint`.

---

### Task 0: Branch + e2e baseline

**Files:** none (setup)

- [ ] **Step 1: Branch**

```bash
cd /Users/damonbodine/ai-jobs-map && git checkout -b feature/sp1-token-foundation
```

- [ ] **Step 2: Capture the local-e2e baseline BEFORE any change**

Run: `npx playwright test tests/e2e/build-a-team.spec.ts tests/e2e/contact-form.spec.ts tests/e2e/funnel-realness.spec.ts tests/e2e/occupation-inline-builder.spec.ts 2>&1 | tail -15`

Record which tests pass/fail. Pre-existing failures are known to possibly exist on main (stale assertions from an earlier redesign). **The acceptance rule for every later task is: no NEW failures versus this baseline.** Save the tail output to `/private/tmp/claude-501/-Users-damonbodine-ClearRoadLabs/c4cd76d8-cde0-47de-852a-4c1c0596018d/scratchpad/sp1-e2e-baseline.txt` for reference.

---

### Task 1: Native `@theme` tokens (kill the shim)

**Files:**
- Modify: `app/globals.css` (full rewrite below)
- Delete: `tailwind.config.js`

**Interfaces:**
- Produces: CSS custom properties `--color-*` (hex/rgb values, no more HSL triples), `--radius-lg/md/sm` = 0, and `@theme inline` font mappings `--font-heading`/`--font-body`/`--font-mono` → `var(--font-geist-sans|mono)` (the next/font variables arrive in Task 3; until then headings render fallback sans — acceptable mid-branch state).
- Consumed by: Task 2's lockstep test (parses this exact file for `--color-<name>: #hex`).

- [ ] **Step 1: Rewrite `app/globals.css` with exactly this content**

```css
@import "tailwindcss";

/*
 * Blueprint Light — the Clear Road Labs design system on a light surface.
 * CRL is ice-on-ink; Timeback is ink-on-ice. Canonical reference:
 * docs/brand-contract.md (mirrored in the ClearRoadLabs repo).
 *
 * lib/brand.ts mirrors these values for the surfaces that cannot read CSS
 * (PDF templates, email HTML, opengraph-image). tests/unit/brand-lockstep
 * fails if the two drift. Change colors HERE first, then brand.ts.
 */
@theme {
  /* surfaces */
  --color-background: #f2f6f9;
  --color-card: #ffffff;
  --color-card-foreground: #0a1420;
  --color-popover: #ffffff;
  --color-popover-foreground: #0a1420;
  --color-secondary: #e3ecf4;
  --color-secondary-foreground: #0a1420;
  --color-muted: #e3ecf4;
  --color-muted-foreground: #47586b;

  /* ink */
  --color-foreground: #0a1420;
  --color-primary: #0a1420;
  --color-primary-foreground: #f2f6f9;

  /* brand accents: deep cyan for interactive text/links (AA on light),
     raw cyan for fills/buttons/meters (pairs with ink text) */
  --color-accent: #0f7fa8;
  --color-accent-foreground: #ffffff;
  --color-cyan: #6fd4ec;
  --color-ring: #0f7fa8;

  /* status */
  --color-destructive: #b23b35;
  --color-destructive-foreground: #ffffff;
  --color-success: #0f7a53;
  --color-success-foreground: #ffffff;

  /* CRL-dark islands: the agent-console panels are literal mothership theme */
  --color-terminal: #0a1420;
  --color-terminal-foreground: #e3ecf4;

  /* hairlines — ink at 14%, mirroring CRL's ice-at-14% */
  --color-border: rgb(10 20 32 / 0.14);
  --color-input: rgb(10 20 32 / 0.18);

  /* radius 0 — the engineering-drawing edge (2px exceptions must be logged
     in docs/brand-contract.md) */
  --radius-lg: 0rem;
  --radius-md: 0rem;
  --radius-sm: 0rem;
}

/* Font utilities resolve to the next/font variables injected on <body>
   (app/layout.tsx). `inline` is required for var() indirection. */
@theme inline {
  --font-heading: var(--font-geist-sans);
  --font-body: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@layer base {
  * {
    border-color: var(--color-border);
  }
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
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

- [ ] **Step 2: Delete the v3 config**

```bash
git rm tailwind.config.js
```

- [ ] **Step 3: Fix sonner's CSS-var wiring (it referenced raw HSL triples — invalid colors — and now must point at the new tokens)**

In `components/ui/sonner.tsx`, replace the `style={...}` block only:

```tsx
      style={
        {
          "--normal-bg": "var(--color-popover)",
          "--normal-text": "var(--color-popover-foreground)",
          "--normal-border": "var(--color-border)",
          "--border-radius": "var(--radius-lg)",
        } as React.CSSProperties
      }
```

(The rest of sonner.tsx is rewritten in Task 4 — only the style block changes here so the build stays coherent.)

- [ ] **Step 4: Build + type-check + baseline e2e**

Run: `npm run type-check && npm run build && npx playwright test tests/e2e/build-a-team.spec.ts tests/e2e/contact-form.spec.ts tests/e2e/funnel-realness.spec.ts tests/e2e/occupation-inline-builder.spec.ts 2>&1 | tail -6`
Expected: build succeeds; e2e matches the Task 0 baseline (no NEW failures).

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/ui/sonner.tsx && git rm -q --cached tailwind.config.js 2>/dev/null; git commit -m "feat(tokens): native Tailwind v4 @theme with Blueprint Light values; remove v3 config shim"
```

---

### Task 2: `lib/brand.ts` + lockstep test + unit-test lane

**Files:**
- Create: `lib/brand.ts`, `tests/unit/brand-lockstep.test.ts`
- Modify: `package.json` (add `"test": "vitest run"` to scripts)

**Interfaces:**
- Consumes: `app/globals.css` `--color-<name>: <value>` lines from Task 1.
- Produces: `BRAND` (const object of hex strings, keys: background, card, foreground, secondary, mutedForeground, accent, cyan, destructive, success, terminal, terminalForeground) and `DATA_SERIES` (readonly 6-tuple of hex) — SP2/SP3 import these.

- [ ] **Step 1: Write the failing lockstep test**

```ts
// tests/unit/brand-lockstep.test.ts
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it, expect } from "vitest"
import { BRAND, DATA_SERIES } from "@/lib/brand"

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")
const cssToken = (name: string): string | undefined =>
  css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase()

describe("brand lockstep — lib/brand.ts mirrors app/globals.css @theme", () => {
  const pairs: [string, string][] = [
    ["background", BRAND.background],
    ["card", BRAND.card],
    ["foreground", BRAND.foreground],
    ["secondary", BRAND.secondary],
    ["muted-foreground", BRAND.mutedForeground],
    ["accent", BRAND.accent],
    ["cyan", BRAND.cyan],
    ["destructive", BRAND.destructive],
    ["success", BRAND.success],
    ["terminal", BRAND.terminal],
    ["terminal-foreground", BRAND.terminalForeground],
  ]
  it.each(pairs)("--color-%s matches BRAND", (name, hex) => {
    expect(cssToken(name)).toBe(hex.toLowerCase())
  })

  it("DATA_SERIES is a 6-color ramp of valid hex values", () => {
    expect(DATA_SERIES).toHaveLength(6)
    for (const c of DATA_SERIES) expect(c).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it("radius tokens are zero (engineering edge)", () => {
    expect(css).toMatch(/--radius-lg:\s*0rem/)
  })
})
```

- [ ] **Step 2: Add the test script and run to verify failure**

In `package.json` scripts, add (keep existing entries): `"test": "vitest run",`

Run: `npm test 2>&1 | tail -4`
Expected: FAIL — cannot resolve `@/lib/brand`

- [ ] **Step 3: Create `lib/brand.ts`**

```ts
/**
 * Blueprint Light palette as TypeScript constants — the single source for
 * surfaces that cannot read CSS variables: PDF templates (@react-pdf),
 * inline-HTML emails (app/api routes), and app/opengraph-image.tsx.
 *
 * Web tokens live in app/globals.css @theme. tests/unit/brand-lockstep
 * asserts the two never drift — change globals.css first, then this file.
 * Canonical reference: docs/brand-contract.md.
 */
export const BRAND = {
  background: "#f2f6f9",
  card: "#ffffff",
  foreground: "#0a1420",
  secondary: "#e3ecf4",
  mutedForeground: "#47586b",
  /** Interactive text/links on light surfaces (AA-safe deep cyan). */
  accent: "#0f7fa8",
  /** Fills, buttons, meters — pairs with ink text. CRL's signature cyan. */
  cyan: "#6fd4ec",
  destructive: "#b23b35",
  success: "#0f7a53",
  /** CRL-dark island panels (agent console). */
  terminal: "#0a1420",
  terminalForeground: "#e3ecf4",
} as const

/** Categorical chart ramp (TimeDonut, occupation/role builders) — cyan/slate family. */
export const DATA_SERIES = [
  "#0f7fa8",
  "#6fd4ec",
  "#0a1420",
  "#47586b",
  "#8fb4c9",
  "#c9dbe8",
] as const
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test 2>&1 | tail -4`
Expected: 13 passed (11 token pairs + DATA_SERIES + radius)

- [ ] **Step 5: Commit**

```bash
git add lib/brand.ts tests/unit/brand-lockstep.test.ts package.json
git commit -m "feat(brand): lib/brand.ts TS palette + CSS lockstep test; add unit-test lane"
```

---

### Task 3: Geist typography + font-display fix

**Files:**
- Modify: `app/layout.tsx` (font swap), `app/demo/page.tsx:63,109`, `app/demo/[slug]/page.tsx:36,46`

**Interfaces:**
- Consumes: `@theme inline` font mappings from Task 1 (`--font-geist-sans`/`--font-geist-mono` variable names).
- Produces: `font-heading`/`font-body`/`font-mono` utilities rendering Geist / Geist / Geist Mono sitewide.

- [ ] **Step 1: Swap fonts in `app/layout.tsx`**

Replace the import and font constants:

```tsx
import { Geist, Geist_Mono } from "next/font/google"
```

```tsx
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})
```

And the body className:

```tsx
      <body
        className={`${geist.variable} ${geistMono.variable} font-body min-h-screen flex flex-col`}
      >
```

(Remove the `newsreader`/`manrope` constants and the `Newsreader, Manrope` import entirely. Leave `ThemeProvider` in place — Task 4 removes it.)

- [ ] **Step 2: Fix the ghost `font-display` class (4 occurrences)**

In `app/demo/page.tsx` lines 63 and 109, and `app/demo/[slug]/page.tsx` lines 36 and 46: replace the class token `font-display` with `font-heading` (the class never existed in the config; these headings have been silently falling back to the default sans stack).

- [ ] **Step 3: Verify**

Run: `npm run type-check && npm run build && npm test 2>&1 | tail -3`
Expected: build green, 13 unit tests pass. Grep-verify no stragglers: `grep -rn "font-display\|Newsreader\|Manrope" app components lib | grep -v node_modules` → no matches.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/demo/page.tsx "app/demo/[slug]/page.tsx"
git commit -m "feat(type): Geist + Geist Mono replace Newsreader/Manrope; fix ghost font-display class"
```

---

### Task 4: Dark-mode teardown

**Files:**
- Delete: `lib/features.ts` (its only export is `DARK_MODE_ENABLED`), `components/ui/theme-provider.tsx`
- Modify: `app/layout.tsx` (drop ThemeProvider), `components/layout/Header.tsx` (drop toggle), `components/ui/sonner.tsx` (drop next-themes)
- Modify: `package.json` (remove `next-themes`)

**Interfaces:**
- Consumes: nothing new. Produces: a single-theme app; `next-themes` gone from the dependency tree.

- [ ] **Step 1: `app/layout.tsx` — remove the provider**

Delete the import `import { ThemeProvider } from "@/components/ui/theme-provider"` and unwrap:

```tsx
      <body
        className={`${geist.variable} ${geistMono.variable} font-body min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
```

Also remove `suppressHydrationWarning` from `<html>` (it existed for next-themes).

- [ ] **Step 2: `components/layout/Header.tsx` — remove the toggle**

- Change the lucide import to `import { Menu, X, ChevronDown } from "lucide-react"` (drop `Sun, Moon`).
- Delete `import { useTheme } from "next-themes"`, `import { DARK_MODE_ENABLED } from "@/lib/features"`, and the line `const { theme, setTheme } = useTheme()`.
- Delete BOTH `{DARK_MODE_ENABLED ? ( <button ... aria-label="Toggle theme" ... /> ) : null}` blocks (desktop nav ~lines 92–104 and mobile menu ~lines 150–158). In the mobile block, the surrounding `<div className="pt-2 mt-1 border-t border-border flex items-center gap-2">` keeps only the enquire `<a>`.

- [ ] **Step 3: `components/ui/sonner.tsx` — single theme**

Delete `import { useTheme } from "next-themes"`, `import { DARK_MODE_ENABLED } from "@/lib/features"`, and the `const { theme = "system" } = useTheme()` line. Replace the theme prop with:

```tsx
      theme="light"
```

(The style block was already re-pointed at `--color-*` vars in Task 1.)

- [ ] **Step 4: Delete the dead files and the dependency**

```bash
git rm lib/features.ts components/ui/theme-provider.tsx
npm uninstall next-themes
```

Grep-verify: `grep -rn "next-themes\|DARK_MODE_ENABLED\|ThemeProvider" app components lib | grep -v node_modules` → no matches.

- [ ] **Step 5: Verify + commit**

Run: `npm run type-check && npm run build && npm test 2>&1 | tail -3 && npx playwright test tests/e2e/build-a-team.spec.ts tests/e2e/contact-form.spec.ts tests/e2e/funnel-realness.spec.ts tests/e2e/occupation-inline-builder.spec.ts 2>&1 | tail -6`
Expected: build + unit green; e2e matches the Task 0 baseline (no NEW failures).

```bash
git add app/layout.tsx components/layout/Header.tsx components/ui/sonner.tsx package.json package-lock.json
git commit -m "feat(theme): single light theme — remove dark-mode flag, toggle, provider, next-themes"
```

---

### Task 5: Brand contract (both repos) + screenshots + handoff

**Files:**
- Create: `docs/brand-contract.md` (this repo)
- Create: `/Users/damonbodine/ClearRoadLabs/docs/brand-contract.md` (copy, committed in the CRL repo — commit only, do NOT push CRL)

**Interfaces:** none — documentation + review gate.

- [ ] **Step 1: Write `docs/brand-contract.md` with exactly this content**

```markdown
# Clear Road Labs — Brand Contract (Blueprint / Blueprint Light)

One design system, two surfaces. clearroadlabs.com renders it dark
(ice-on-ink); timeback.clearroadlabs.com renders it light (ink-on-ice).
This file is the canonical cross-repo reference and lives, identical, in
both repos. Change it deliberately, in both places, in the same sitting.

## Tokens

| Role | CRL (dark) | Timeback (Blueprint Light) |
|---|---|---|
| Background | ink `#0a1420` | cool paper `#f2f6f9` |
| Card/panel | `#1c2c3e` | `#ffffff` (muted tint `#e3ecf4`) |
| Foreground | ice `#e3ecf4` | ink `#0a1420` |
| Accent (fills/buttons/meters) | cyan `#6fd4ec` + ink text | cyan `#6fd4ec` + ink text |
| Accent (text/links) | cyan `#6fd4ec` | deep cyan `#0f7fa8` (AA on light) |
| Hairline | ice @ 14% | ink @ 14% |
| Muted text | ice/55–60 | `#47586b` |
| Destructive / success | `#e88a8a` / — | `#b23b35` / `#0f7a53` |
| Terminal island | — | ink `#0a1420` + ice `#e3ecf4` text (literal CRL theme) |
| Data series (charts) | — | `#0f7fa8 #6fd4ec #0a1420 #47586b #8fb4c9 #c9dbe8` |

## Type

- Display + body: **Geist**. Mono (eyebrows, stats, annotations, data):
  **Geist Mono**, `tabular-nums` wherever numbers align.
- Eyebrow style: mono, ~11px, uppercase, letter-spacing ≈ 0.18em, muted.

## Shape & texture

- Radius **0** (engineering-drawing edge). Exceptions (max 2px) must be
  listed here: *(none yet)*.
- Motifs: faint engineering grid backgrounds, 1px hairline rules,
  numbered section labels ("SEC 01", "MI 03", "FIG 02").

## CTA grammar

- Primary: cyan fill, ink text, mono uppercase, tracked (~0.14em).
- Secondary: hairline outline, foreground text, same mono treatment.
- Voice: confident/production framing; numbers over adjectives; verbs
  users act on ("Read a sample audit", "Start with an audit →").
- No public `$` pricing on CRL surfaces.

## Cross-links (the one-funnel loop)

- CRL `/sample-audit` → Timeback occupation page (the map).
- Timeback occupation page → CRL `/sample-audit` (the terrain) and
  `/enquire` (the ask).

## Enforcement

- Timeback: `lib/brand.ts` mirrors `app/globals.css` `@theme`;
  `tests/unit/brand-lockstep.test.ts` fails on drift. PDF/email/OG must
  import from `lib/brand.ts`, never hardcode.
- CRL: tokens in `src/app/globals.css` `@theme`.
```

- [ ] **Step 2: Copy to the CRL repo and commit there (NO push)**

```bash
cp docs/brand-contract.md /Users/damonbodine/ClearRoadLabs/docs/brand-contract.md
cd /Users/damonbodine/ClearRoadLabs && git add docs/brand-contract.md && git commit -m "docs: shared brand contract (Blueprint / Blueprint Light)" && cd /Users/damonbodine/ai-jobs-map
```

- [ ] **Step 3: Commit the contract in this repo**

```bash
git add docs/brand-contract.md
git commit -m "docs: brand contract — canonical Blueprint Light reference"
```

- [ ] **Step 4: Screenshots for Damon's gate**

Start `npm run dev` (background, port 3050). Using the Playwright screenshot harness pattern (import from `/Users/damonbodine/ai-jobs-map/node_modules/@playwright/test/index.js`), capture to the scratchpad: `/`, `/occupation/software-developers`, `/build-a-team` at 1440×900 and 390×844 (deviceScaleFactor 2). Kill the dev server. Filenames: `sp1-{home,occupation,team}-{desktop,mobile}.png`.

- [ ] **Step 5: Final verification (the full SP1 gate)**

Run, chained on exit codes: `npm run type-check && npm run lint && npm test && npm run build && npx playwright test tests/e2e/build-a-team.spec.ts tests/e2e/contact-form.spec.ts tests/e2e/funnel-realness.spec.ts tests/e2e/occupation-inline-builder.spec.ts`
Expected: all green except any failures already present in the Task 0 baseline (list them explicitly when reporting).

**STOP here.** Do NOT merge or push. Report: baseline vs final e2e comparison, screenshot paths, and the diff stat. Damon reviews screenshots and gives the explicit go for merge + production deploy.

## Self-review notes

- Spec coverage (SP1 section): native `@theme` + shim removal (T1), brand.ts + DATA_SERIES + lockstep (T2), Geist + font-heading/body mapping + font-display fix (T3), dark-mode machinery deletion incl. next-themes (T4), brand contract in both repos (T5). Sonner's broken HSL-triple vars fixed as a T1 necessity.
- Utility-name survival is the critical invariant — the `@theme` block defines every `--color-*` the old config generated (checked name-by-name against tailwind.config.js).
- The `font-heading`→Geist mapping means SP1 intentionally retires the serif; the plan's Global Constraints tell the reviewer what visual delta to expect so it isn't misread as breakage.
- Baseline-first e2e (T0) makes "no NEW failures" enforceable in a repo with possibly-failing pre-existing specs.
