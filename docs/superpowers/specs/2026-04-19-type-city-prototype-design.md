# Type City prototype — design spec

**Date:** 2026-04-19
**Status:** Approved for implementation
**Route:** `/type-city`

## Problem

The site currently runs a warm cream "Recovery Ink" light theme (Plans 1 + 2, shipped 2026-04-06/07). The user wants to evaluate a radically different aesthetic — "Direction B / Neon Type City" from a Claude Design handoff bundle — without risking the live funnel.

## Scope

Port the full **Direction B** homepage prototype to a new Next.js route. A side-by-side evaluation surface, not a replacement. All 7 sections, hardcoded sample data, same motion grammar.

## Non-goals

- No replacement of `/`. Existing homepage untouched.
- No Supabase integration. Hardcoded 12 occupations / 17 categories from the prototype's `shared.jsx`.
- No occupation-page variant. Prototype scope is homepage only.
- No responsive polish beyond what the prototype ships. Desktop-first.

## File layout

```
app/type-city/
  page.tsx              "use client" — single-file port of all 7 sections
  type-city.css         keyframes: aurora-breathe, grid-drift, rise-coin,
                        logo-pulse, btn-breathe, spark-rise, sunrise,
                        gradient-shift, type-city-rtl, type-city-ltr
  data.ts               OCCUPATIONS (12), CATEGORIES (17), typed constants
```

## Integration

**Header / Footer hiding.** `components/layout/Header.tsx` and `components/layout/Footer.tsx` become client components that call `usePathname()` and return `null` when the pathname matches `/type-city`. Two-line change each; preserves the rest of the site.

**Fonts.** Loaded via `next/font/google` inside `app/type-city/page.tsx` so they're code-split to the route and don't bleed into the rest of the app:
- Archivo Black (display headlines)
- Archivo 700/900 (ticker chips, card titles)
- Fraunces italic (emotional punctuation — *workday.*, *a better one.*)
- DM Mono (section labels, stats, hour marks)
- Space Grotesk (body, buttons)

Applied as CSS variables on the page's root div. No Tailwind involvement — the prototype's aesthetic depends on exact color + typography values, not utility classes.

**Motion.** All CSS keyframes from the prototype move verbatim into `type-city.css`. React state machines (morphing verb cycler, anatomy phase 0→1→2, hover sparks, count-up) translate 1:1 to React 19 hooks.

## What faithfully ports

1. **Hero** — nav (logo + links + Book a Call), assembling-WORKDAY kinetic moment, RECLAIM→REDEFINE→REIMAGINE→REWIRE→REWRITE morphing verb, dual neon occupation tickers (top scrolls right-to-left, bottom scrolls left-to-right), aurora radial-gradient backdrop, drifting grid overlay, rising minute-coin confetti.
2. **Anatomy of your day** — 5-slice stacked bar (Meetings / Docs / Email / Coordination / Deep Work), phased animation: phase 0 (full) → phase 1 (slices contract, +Nm chips lift off) → phase 2 (chips fly into gradient "RECLAIMED: +58min/day" catcher pill). Count-up totals 58.
3. **Your day, re-sequenced** — before/after 600-minute timeline, staggered block reveals, Email/Admin shrinking, Deep Work + YOU expanding.
4. **847 ways to start** — 4-column occupation grid, neon category labels, hover spark-burst (6 rising coins per card), translateY(-6px) lift.
5. **Staff a whole function** — interactive team builder (Software Engineers / Customer Success / Marketing), +/– seat buttons, live count-up of reclaimed minutes, FTE + $/year derivations.
6. **Start reclaiming CTA** — sunrise radial gradient, animated 4-stop gradient-shift on RECLAIMING wordmark, breathing button.
7. **Footer** — DM Mono, © 2026 · PLACE TO STAND AGENCY · BUILT ON BLS · O*NET.

## What intentionally changes

- **Book a Call button** in the hero nav points to `/contact` (existing route) instead of `#`.
- **Explore buttons** (hero primary, CTA finale) point to `/browse` (existing route).

Flag if either should differ.

## Risks

- **Route-scoped fonts.** If `next/font/google` has collision issues with the root layout's Newsreader/Manrope imports, fall back to `<link>` preconnect + Google Fonts CSS inside the page.
- **Header/Footer hiding mechanism.** Client-side `usePathname()` check means a brief SSR flash of the site header before the client hides it. Acceptable for a prototype; revisit if promoted.
- **Motion performance.** 22 rising coins + drifting grid + breathing aurora + 60s tickers on one page. Should be fine on modern hardware but note for verification.

## Success criteria

1. `/type-city` renders all 7 sections with no console errors.
2. Motion runs: WORKDAY assembles, verb morphs every 2s, tickers scroll, anatomy phases, hover sparks fire, CTA sunrise breathes.
3. Site Header/Footer are hidden on `/type-city` and still present on every other route.
4. `pnpm type-check` passes.
