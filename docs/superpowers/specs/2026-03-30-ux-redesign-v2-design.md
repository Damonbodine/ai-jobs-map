# AI Jobs Map — UX Redesign v2

## Problem

The site shows too much data too fast. Users bounce because they're overwhelmed before they understand what they're looking at. The current pages dump stats, categories, feature boxes, work blocks, solutions, evidence, and skills all at once. Someone who knows nothing about AI sees a wall of numbers and leaves.

## Design Principles

1. **Search-first** — The landing page is a search bar, not a dashboard
2. **Three-beat scroll** — The occupation page reveals data in three digestible steps
3. **Opportunity, not automation** — Language focuses on "get time back", "lighten the load", never "automate your job"
4. **Progressive disclosure** — Show less upfront, let users drill deeper when ready
5. **Works for everyone** — A plumber and a senior engineer should both feel this is for them

## User Journey

```
Landing → Search job title
    ↓
Occupation → 3-beat story: your number → what's eating time → your next step
    ↓
Builder → Guided intake → custom toolkit recommendation
```

---

## Page 1: Landing (`/ai-jobs`)

### Layout
Vertically centered on viewport. Minimal furniture.

### Content (top to bottom)
1. **Headline** (Newsreader, large, centered): "How many minutes could you get back?"
2. **Subline** (Manrope, muted): one sentence — "Search your job title to see where routine work is quietly stealing your time."
3. **Search bar**: full-width (max ~640px), prominent, centered. Placeholder: "Type your job title..." Live autocomplete dropdown showing top matches as user types. Each result shows occupation title and category.
4. **Quick-start examples**: row of 5-6 clickable pill links below search — "Accountant", "Software Developer", "Registered Nurse", "Project Manager", "Paralegal", "Electrician". These link directly to `/ai-jobs/{slug}`.
5. **Social proof line**: quiet, small text — "Mapped across 800+ occupations from the U.S. Bureau of Labor Statistics"

### What's removed
- 4 stat cards (826 occupations, 22 sectors, 7 themes, 10k clues)
- 4 feature boxes (map routines, prioritize time-back, bundle tasks, one-hour path)
- 12 category tiles grid
- Hero image panel
- Footer content beyond minimal attribution

### Header
Clean wordmark "AI Jobs Map" with two nav links: "Browse" and "About". No Factory link on landing — that comes after occupation page.

---

## Page 2: Occupation Detail (`/ai-jobs/[slug]`)

### Three-Beat Structure

#### Beat 1 — The Reveal (above the fold)
- **Back link**: "← Back to search"
- **Category label**: eyebrow text (e.g., "Healthcare Practitioners")
- **Job title**: large Newsreader heading
- **The number**: prominently displayed — e.g., "47 minutes" in large, bold type
- **Context line**: "of recoverable time per day from routine work"
- **Progress indicator**: simple horizontal bar or ring showing progress toward 60-minute target
- **Nothing else above the fold.** Let the number breathe. Let it land.

#### Beat 2 — What's Eating Your Time (scroll)
- **Section header**: "Where your time goes"
- **Exactly 3 cards** showing top time-consuming routines:
  - Task name
  - Frequency badge (Daily / Weekly)
  - Minutes recoverable (the number, prominent)
  - One line of context about what this task involves
  - Simple horizontal bar showing relative weight
- Clean, scannable. No paragraphs. No "AI how it helps" text dump.

#### Beat 3 — Your Next Step (scroll)
- **Section header**: "The best place to start"
- **One recommended solution card**:
  - Solution name (e.g., "Intake Assistant")
  - One sentence: what it does
  - Time it addresses (e.g., "covers ~23 min/day")
- **Bridge CTA**: "Build your toolkit →" — links to the factory/builder experience
- This is a bridge, not a sales pitch. The occupation page earns trust. The builder converts.

#### Expanded Content (below, collapsed by default)
Available for users who want depth. Each is a collapsible `<details>` section:
- **Day architecture** — work block breakdown
- **All routines** — full task list beyond the top 3
- **Evidence layer** — action patterns, package fit
- **Human edge** — what stays human
- **Upskilling** — recommended skills

---

## Page 3: Browse (`/ai-jobs/browse`)

### Changes from current
- **Category browsing lives here now** (moved from landing page)
- Category filter is a horizontal pill row, not a dropdown — tap to filter
- Occupation cards are simplified: **title + category + one number** (minutes recoverable)
- Remove: routine work paragraphs, "Modeled daily time back" sub-cards, opportunity/routine tag counts
- Keep: search, sort, pagination

### Card design
```
┌──────────────────────────────┐
│ HEALTHCARE                   │
│ Registered Nurse             │
│                         42m  │
└──────────────────────────────┘
```
Title, category label, one number. That's it. Click to open the occupation page.

---

## Language Guidelines

### Use
- "Get time back"
- "Lighten the load"
- "Support your work"
- "Recoverable time"
- "Routine work"
- "Opportunity"

### Never use
- "Automate your job"
- "Replace"
- "Displacement"
- "AI will do this for you"
- "Synthetic displacement" (remove from UI — internal metric only)

---

## Visual Design Notes

- Keep Recovery Ink tokens (warm white, blue accent, Newsreader/Manrope)
- The occupation page "number reveal" should feel like a moment — consider a subtle entrance animation
- Cards should use whitespace generously. Fewer elements per card, more breathing room.
- Progress bars/rings should be simple and clean — single color (primary blue), not gradients
- Browse page cards: minimal height, clean grid alignment

---

## Out of Scope (for this spec)

- Factory/builder page redesign (separate spec — the "build your toolkit" experience)
- Concept routes cleanup (`/concepts/*`, `/experiments/`, `/simple/`)
- Mobile-specific layouts (responsive by default with Tailwind, but no mobile-first redesign)

---

## Technical Notes

- No backend changes. All data queries remain the same.
- Occupation page remains a server component.
- Landing page remains a client component (for live search).
- Browse page remains a client component (for filtering/pagination).
- Collapsed sections on occupation page use native `<details>` elements.
- Quick-start example occupations on landing are hardcoded slugs.
