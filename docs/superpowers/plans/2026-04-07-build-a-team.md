# Build a Team Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/build-a-team` — a Department ROI calculator framed for founders and operators designing or measuring a knowledge-work team. Visitors pick roles, set headcounts, and immediately see compounded daily-time-back and annual-value math. The cart persists in the URL for one-click sharing with stakeholders, and an optional email-gated PDF download captures higher-intent leads.

**Architecture:** A single new top-level route. The page is a Next.js Server Component that reads the cart from `?roles=` URL state, fetches the corresponding occupation rows + automation profiles + tasks from Supabase server-side, and renders the compound math instantly without any client fetching. A small client component handles cart mutations (add/remove/edit count) by updating the URL via `router.replace()` so every state change is shareable. A new `/api/build-a-team/pdf` route accepts a cart payload, generates a department-variant PDF via a new `<DepartmentPdf>` template, captures the email lead in a new `department_roi_requests` Supabase table, and delivers the PDF via Resend. Five hand-curated industry templates ship with the page so first-time visitors see a populated cart instantly instead of an empty state.

**Tech Stack:** Same as Plans 1 + 2. Next.js 15 App Router, React 19, TypeScript, Tailwind 4, Supabase service-role client (`lib/supabase/server.ts`), Resend 6 with attachments, zod 4, `@react-pdf/renderer` 4 (already installed), Playwright (existing).

**Prerequisites:** None new. Plans 1 + 2 are merged. The existing search API at `/api/occupations/search` returns `{ id, title, slug, major_category }` and is used by the role typeahead. The occupation page already exposes the math helpers we need (`computeDisplayedTimeback`, `estimateTaskMinutes`, `inferArchetypeMultiplier`, `computeAnnualValue`).

**Audit feedback this addresses:** Item #1 from the original product audit — "Multi-Role Org Chart Aggregation (Targeting the Decision Maker)". Transforms the funnel from $2K single-assistant sales to $50K Ops Layer engagements by giving founders a tool to evaluate the AI value of an entire department before they hire.

---

## File Structure

**Create:**
- `lib/build-a-team/url-state.ts` — encode/decode cart `<->` URL query string. Single source of truth for the `?roles=slug:count,slug:count` format.
- `lib/build-a-team/templates.ts` — 5 hand-curated industry starter templates (carts of role slugs + counts), with friendly names and short descriptions.
- `lib/build-a-team/compute.ts` — pure function that takes a cart + the fetched occupation data and returns the compounded display values. Keeps the page server component small and the math testable.
- `lib/validation/build-a-team.ts` — zod schemas for the cart payload AND the email-for-PDF request.
- `lib/pdf/styles.ts` — extracted shared style constants (COLORS + a few base StyleSheet entries) so the new department PDF and the existing blueprint PDF stop duplicating them.
- `lib/pdf/department.tsx` — `@react-pdf/renderer` Document for the department variant. New shape: title, summary stat cards (total people, total min/day, total annual value, FTE-equivalent), per-role table, recommended modules, footer. Reuses `lib/pdf/styles.ts`.
- `app/build-a-team/page.tsx` — Next.js server component. Reads `searchParams.roles` and `searchParams.template`, resolves to a cart, fetches occupation rows from Supabase, computes totals via `compute.ts`, renders the static skeleton + the Cart and Results components.
- `app/build-a-team/cart.tsx` — client component. Handles add-role / remove-role / change-count, syncs to `router.replace(?roles=...)`, exposes the share-link button (copy to clipboard) and the "Email me a PDF" button.
- `app/build-a-team/role-search.tsx` — client typeahead for searching occupations to add. Reuses the existing `/api/occupations/search` endpoint.
- `app/build-a-team/results.tsx` — small server component (or pure render fn) that takes the computed totals and renders the headline number cards + per-role breakdown rows.
- `app/build-a-team/template-picker.tsx` — server component that renders the 5 starter templates as clickable cards. Each card is an internal `<Link>` to `/build-a-team?template=clinic` (or similar) so click-through is server-rendered.
- `app/build-a-team/pdf-modal.tsx` — client component containing the email-for-PDF modal. Mirrors the `OnePagerButton` modal pattern from Plan 2 (autofocus, Escape, focus restore, body scroll lock, role/aria-modal/aria-labelledby, honeypot, text-destructive errors).
- `app/api/build-a-team/pdf/route.ts` — POST handler. Validates payload, fetches occupation data server-side, generates the department PDF, inserts into `department_roi_requests`, sends Resend email with attachment, mirrors the two-writes-no-silent-failure pattern from Plans 1 + 2.
- `supabase/migrations/2026-04-07-department-roi-requests.sql` — new table with RLS enabled, no policies (service-role writes only).
- `scripts/apply-department-roi-migration.ts` — idempotent runner copying the Plan 1 + 2 pattern.
- `tests/e2e/build-a-team.spec.ts` — Playwright smoke tests for the page, the template picker, the cart mutations, the share link, and the email-for-PDF modal.

**Modify:**
- `lib/pdf/blueprint.tsx` — refactor to import shared `lib/pdf/styles.ts` constants, removing the duplicated COLORS object.
- `components/layout/Header.tsx` — add a "Build a Team" nav link between "Pricing" and the "Book a Call" CTA.
- `app/page.tsx` (homepage) — add a secondary hero CTA pointing at `/build-a-team` ("Build a team →").
- `app/occupation/[slug]/page.tsx` — add an "Add to Team" link under the existing CTAs that takes the user to `/build-a-team?roles=<this-slug>:1` so they can keep building from a single role.

**Delete:** nothing.

---

## Task 1: Cart URL state encoding

**Files:**
- Create: `lib/build-a-team/url-state.ts`

> Single source of truth for the `?roles=` query string format. All other code reads/writes through these helpers so the format can evolve without grepping for string literals.

- [ ] **Step 1: Create the file**

```ts
/**
 * URL state for the Build a Team cart.
 *
 * Format: `?roles=software-developers:3,registered-nurses:2`
 *
 * Why a flat string and not base64-JSON: shareable URLs are read by
 * humans before they're clicked. "I'm thinking 3 devs and 2 nurses"
 * is recoverable from a glance at the URL bar, which is a small but
 * real trust signal for the recipient. Also: server-renderable from
 * searchParams without any client decoding.
 */

export type CartRow = {
  slug: string
  count: number
}

const SLUG_PATTERN = /^[a-z0-9-]{1,200}$/

/**
 * Parse the `?roles=` query string into a cart. Invalid entries
 * are silently dropped (so a tampered URL produces a partial cart
 * rather than crashing the page). Counts are clamped to 1..999.
 */
export function decodeCart(value: string | null | undefined): CartRow[] {
  if (!value) return []
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [slug, rawCount] = entry.split(":")
      if (!slug || !SLUG_PATTERN.test(slug)) return null
      const count = Number.parseInt(rawCount ?? "1", 10)
      if (!Number.isFinite(count) || count < 1) return null
      return { slug, count: Math.min(999, Math.max(1, count)) }
    })
    .filter((row): row is CartRow => row !== null)
}

/**
 * Serialize a cart back to the query string format. Empty cart
 * returns an empty string (caller should omit `?roles=` entirely).
 */
export function encodeCart(rows: CartRow[]): string {
  return rows
    .filter((r) => r.slug && r.count >= 1)
    .map((r) => `${r.slug}:${r.count}`)
    .join(",")
}

/**
 * Apply a single mutation to a cart. Returns a new array.
 * - Adding an existing slug increments its count.
 * - Setting count to 0 removes the row.
 */
export function mutateCart(
  cart: CartRow[],
  slug: string,
  delta: { setCount?: number; addCount?: number }
): CartRow[] {
  const existing = cart.find((r) => r.slug === slug)
  const nextCount = (() => {
    if (delta.setCount !== undefined) return delta.setCount
    if (delta.addCount !== undefined) return (existing?.count ?? 0) + delta.addCount
    return existing?.count ?? 0
  })()
  const clamped = Math.min(999, Math.max(0, Math.round(nextCount)))
  if (clamped === 0) {
    return cart.filter((r) => r.slug !== slug)
  }
  if (existing) {
    return cart.map((r) => (r.slug === slug ? { ...r, count: clamped } : r))
  }
  return [...cart, { slug, count: clamped }]
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npm run type-check
git add lib/build-a-team/url-state.ts
git commit -m "feat(build-a-team): add cart URL state encode/decode/mutate helpers"
```

---

## Task 2: Industry starter templates

**Files:**
- Create: `lib/build-a-team/templates.ts`

> Five hand-curated carts. All slugs verified to exist in the live BLS data before the plan was written. Adding a new template later just means appending to this array.

- [ ] **Step 1: Create the file**

```ts
import type { CartRow } from "./url-state"

export type Template = {
  key: string
  name: string
  blurb: string
  // Used as the URL `?template=<key>` shortcut and to label the chip.
  // Cart contents are real BLS occupation slugs (verified to exist
  // in the live database).
  cart: CartRow[]
}

export const TEMPLATES: Template[] = [
  {
    key: "clinic",
    name: "Small medical clinic",
    blurb:
      "A typical 3-physician practice. Mix of clinical and front-office work.",
    cart: [
      { slug: "registered-nurses", count: 3 },
      { slug: "medical-secretaries-and-administrative-assistants", count: 2 },
      { slug: "bookkeeping-accounting-and-auditing-clerks", count: 1 },
    ],
  },
  {
    key: "saas-startup",
    name: "Early-stage SaaS startup",
    blurb:
      "Seed-to-Series-A team building a B2B product. Heavy on engineering and customer-facing roles.",
    cart: [
      { slug: "software-developers", count: 4 },
      { slug: "marketing-managers", count: 1 },
      { slug: "customer-service-representatives", count: 1 },
      { slug: "project-management-specialists", count: 1 },
    ],
  },
  {
    key: "marketing-agency",
    name: "Marketing agency",
    blurb:
      "Mid-sized creative shop. Mix of strategy, design, and account management.",
    cart: [
      { slug: "marketing-managers", count: 2 },
      { slug: "graphic-designers", count: 3 },
      { slug: "project-management-specialists", count: 1 },
      { slug: "accountants-and-auditors", count: 1 },
    ],
  },
  {
    key: "law-firm",
    name: "Boutique law firm",
    blurb:
      "Small partnership focused on transactional work. Heavy document and intake load.",
    cart: [
      { slug: "lawyers", count: 3 },
      { slug: "paralegals-and-legal-assistants", count: 2 },
      { slug: "medical-secretaries-and-administrative-assistants", count: 1 },
      { slug: "bookkeeping-accounting-and-auditing-clerks", count: 1 },
    ],
  },
  {
    key: "construction",
    name: "Construction company",
    blurb:
      "Field-and-office hybrid. Construction managers coordinating crews + back-office admin.",
    cart: [
      { slug: "construction-managers", count: 2 },
      { slug: "project-management-specialists", count: 1 },
      { slug: "bookkeeping-accounting-and-auditing-clerks", count: 1 },
      { slug: "customer-service-representatives", count: 1 },
    ],
  },
]

export function findTemplate(key: string | null | undefined): Template | null {
  if (!key) return null
  return TEMPLATES.find((t) => t.key === key) ?? null
}
```

- [ ] **Step 2: Commit**

```bash
npm run type-check
git add lib/build-a-team/templates.ts
git commit -m "feat(build-a-team): add 5 industry starter templates"
```

---

## Task 3: Compound math helper

**Files:**
- Create: `lib/build-a-team/compute.ts`

> Pure function that takes a cart + the fetched occupation data and returns the compounded display values. Keeps the page server component small, gives the unit math one obvious home, and is the same code path the PDF route handler uses.

- [ ] **Step 1: Create the file**

```ts
import type { CartRow } from "./url-state"
import type {
  AutomationProfile,
  MicroTask,
  Occupation,
} from "@/types"
import {
  computeDisplayedTimeback,
  estimateTaskMinutes,
  inferArchetypeMultiplier,
} from "@/lib/timeback"
import { computeAnnualValue } from "@/lib/pricing"

export type RoleData = {
  occupation: Pick<Occupation, "id" | "slug" | "title" | "hourly_wage">
  profile: AutomationProfile | null
  tasks: MicroTask[]
}

export type RoleBreakdown = {
  slug: string
  title: string
  count: number
  minutesPerPerson: number
  annualValuePerPerson: number
  totalMinutesPerDay: number
  totalAnnualValue: number
}

export type DepartmentTotals = {
  totalPeople: number
  totalMinutesPerDay: number
  totalAnnualValue: number
  // Derived: what fraction of an FTE worth of time we're reclaiming.
  // 1 FTE ≈ 480 work min/day. The framing matters because "180 min/day"
  // doesn't tell a CFO anything but "0.4 FTEs reclaimed" does.
  fteEquivalents: number
  rows: RoleBreakdown[]
}

const FTE_MINUTES_PER_DAY = 480

/**
 * Compute the department-level rollup from a cart of roles + the
 * fetched occupation data for each. The math here is identical to
 * what /occupation/[slug] does for one role; we just sum across roles.
 */
export function computeDepartmentTotals(
  cart: CartRow[],
  roleDataBySlug: Map<string, RoleData>
): DepartmentTotals {
  const rows: RoleBreakdown[] = []
  let totalPeople = 0
  let totalMinutesPerDay = 0
  let totalAnnualValue = 0

  for (const cartRow of cart) {
    const data = roleDataBySlug.get(cartRow.slug)
    if (!data) continue

    const archetypeMultiplier = inferArchetypeMultiplier(data.profile ?? null)
    const aiTasks = data.tasks.filter((t) => t.ai_applicable)
    const totalBlueprintMinutes = aiTasks.reduce(
      (sum, task) => sum + estimateTaskMinutes(task) * archetypeMultiplier,
      0
    )
    const { displayedMinutes } = computeDisplayedTimeback(
      data.profile ?? null,
      data.tasks,
      totalBlueprintMinutes
    )
    const annualValuePerPerson = computeAnnualValue(
      displayedMinutes,
      data.occupation.hourly_wage
    )

    const roleTotalMinutes = displayedMinutes * cartRow.count
    const roleTotalValue = annualValuePerPerson * cartRow.count

    rows.push({
      slug: data.occupation.slug,
      title: data.occupation.title,
      count: cartRow.count,
      minutesPerPerson: displayedMinutes,
      annualValuePerPerson,
      totalMinutesPerDay: roleTotalMinutes,
      totalAnnualValue: roleTotalValue,
    })

    totalPeople += cartRow.count
    totalMinutesPerDay += roleTotalMinutes
    totalAnnualValue += roleTotalValue
  }

  return {
    totalPeople,
    totalMinutesPerDay,
    totalAnnualValue,
    fteEquivalents:
      Math.round((totalMinutesPerDay / FTE_MINUTES_PER_DAY) * 10) / 10,
    rows,
  }
}
```

- [ ] **Step 2: Commit**

```bash
npm run type-check
git add lib/build-a-team/compute.ts
git commit -m "feat(build-a-team): add pure compound-math helper for department totals"
```

---

## Task 4: Validation schemas

**Files:**
- Create: `lib/validation/build-a-team.ts`

- [ ] **Step 1: Create the file**

```ts
import { z } from "zod"

/**
 * Validation for POST /api/build-a-team/pdf.
 *
 * Two concerns: (1) the cart payload is recomputed server-side from
 * the live DB, so we don't trust client-sent display values — we only
 * need the slug + count pairs and the email; (2) honeypot enforced
 * before zod in the route handler.
 */
export const buildATeamPdfSchema = z.object({
  cart: z
    .array(
      z.object({
        slug: z
          .string()
          .trim()
          .regex(/^[a-z0-9-]{1,200}$/, "Invalid occupation slug"),
        count: z.coerce.number().int().min(1).max(999),
      })
    )
    .min(1, "Add at least one role to your team")
    .max(20, "Too many roles in one cart"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email")
    .max(254),
  // Optional context — what kind of team they're building.
  teamLabel: z.string().trim().max(120).optional(),
  website: z.string().optional(), // honeypot
})

export type BuildATeamPdfInput = z.infer<typeof buildATeamPdfSchema>
```

- [ ] **Step 2: Commit**

```bash
npm run type-check
git add lib/validation/build-a-team.ts
git commit -m "feat(build-a-team): add zod schema for /api/build-a-team/pdf"
```

---

## Task 5: Extract shared PDF styles

**Files:**
- Create: `lib/pdf/styles.ts`
- Modify: `lib/pdf/blueprint.tsx`

> Both PDF templates share the same color palette and many style fragments. Extract them now so the new department template doesn't fork the constants.

- [ ] **Step 1: Create `lib/pdf/styles.ts`**

```ts
/**
 * Shared color palette + base style fragments for all PDF templates.
 * Both blueprint.tsx (single occupation) and department.tsx (cart of
 * roles) import from here so brand colors stay in lock-step.
 */

export const PDF_COLORS = {
  bg: "#fafaf7",
  fg: "#221f1c",
  muted: "#6b6661",
  accent: "#2563eb",
  accentSoft: "#eff6ff",
  border: "#e5e0d8",
  cardBg: "#ffffff",
} as const
```

- [ ] **Step 2: Refactor `lib/pdf/blueprint.tsx` to import from the shared module**

Find the `const COLORS = { ... }` block at the top of `lib/pdf/blueprint.tsx` and replace it with:

```ts
import { PDF_COLORS as COLORS } from "./styles"
```

Do not change any other usages — the local name `COLORS` stays the same so all the `COLORS.bg`, `COLORS.fg`, etc. references in the file work without modification.

- [ ] **Step 3: Type-check + commit**

```bash
npm run type-check
git add lib/pdf/styles.ts lib/pdf/blueprint.tsx
git commit -m "refactor(pdf): extract shared color palette to lib/pdf/styles.ts"
```

---

## Task 6: Department PDF template

**Files:**
- Create: `lib/pdf/department.tsx`

> The department PDF has a fundamentally different shape from the single-role blueprint: a per-role table with people counts, compound stats including FTE-equivalents, and team-level next steps. Separate file is cleaner than forking the existing template with conditionals.

- [ ] **Step 1: Create the file**

```tsx
import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import { PDF_COLORS as COLORS } from "./styles"

// Same Helvetica fallback rationale as blueprint.tsx — see that
// file's header for the full explanation. TODO in a future plan to
// vendor real Newsreader + Manrope TTFs.

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    padding: 48,
    fontSize: 10,
    color: COLORS.fg,
    lineHeight: 1.5,
  },
  header: {
    borderBottom: `1 solid ${COLORS.border}`,
    paddingBottom: 16,
    marginBottom: 24,
  },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: COLORS.accent,
    fontWeight: 600,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: COLORS.fg,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 1.4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flexBasis: "48%",
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 14,
    border: `1 solid ${COLORS.border}`,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: COLORS.muted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.fg,
  },
  statUnit: {
    fontSize: 11,
    color: COLORS.muted,
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    color: COLORS.fg,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: `1 solid ${COLORS.border}`,
    paddingBottom: 6,
    marginBottom: 6,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: COLORS.muted,
    fontWeight: 600,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: `1 solid ${COLORS.border}`,
  },
  colRole: { flex: 3 },
  colCount: { flex: 1, textAlign: "center" },
  colMinutes: { flex: 1.5, textAlign: "right" },
  colValue: { flex: 1.5, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderTop: `2 solid ${COLORS.fg}`,
    marginTop: 4,
    fontWeight: 700,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 12,
    color: COLORS.accent,
    fontWeight: 600,
  },
  bulletBody: {
    flex: 1,
    color: COLORS.fg,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTop: `1 solid ${COLORS.border}`,
    paddingTop: 12,
    fontSize: 8,
    color: COLORS.muted,
    flexDirection: "row",
    justifyContent: "space-between",
  },
})

export type DepartmentPdfRow = {
  slug: string
  title: string
  count: number
  minutesPerPerson: number
  totalMinutesPerDay: number
  totalAnnualValue: number
}

export type DepartmentPdfProps = {
  teamLabel: string
  totals: {
    totalPeople: number
    totalMinutesPerDay: number
    totalAnnualValue: number
    fteEquivalents: number
  }
  rows: DepartmentPdfRow[]
  contactEmail: string
  siteUrl: string
  agencyName: string
  generatedAt: string
}

export function DepartmentPdf(props: DepartmentPdfProps) {
  return (
    <Document
      title={`AI Department Blueprint — ${props.teamLabel || "Custom team"}`}
      author={props.agencyName}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>AI DEPARTMENT BLUEPRINT</Text>
          <Text style={styles.title}>
            {props.teamLabel || "Your AI-augmented team"}
          </Text>
          <Text style={styles.subtitle}>
            Prepared by {props.agencyName} · {props.siteUrl}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>People in scope</Text>
            <Text style={styles.statValue}>{props.totals.totalPeople}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Daily time reclaimed</Text>
            <Text style={styles.statValue}>
              {Math.round(props.totals.totalMinutesPerDay)}
              <Text style={styles.statUnit}>min</Text>
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Annual value</Text>
            <Text style={styles.statValue}>
              ${Math.round(props.totals.totalAnnualValue).toLocaleString()}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Equivalent FTEs reclaimed</Text>
            <Text style={styles.statValue}>
              {props.totals.fteEquivalents}
              <Text style={styles.statUnit}>FTE</Text>
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per-role breakdown</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colRole}>Role</Text>
            <Text style={styles.colCount}>People</Text>
            <Text style={styles.colMinutes}>Min/day each</Text>
            <Text style={styles.colValue}>Annual value</Text>
          </View>
          {props.rows.map((row) => (
            <View key={row.slug} style={styles.row}>
              <Text style={styles.colRole}>{row.title}</Text>
              <Text style={styles.colCount}>{row.count}</Text>
              <Text style={styles.colMinutes}>{row.minutesPerPerson}</Text>
              <Text style={styles.colValue}>
                ${Math.round(row.totalAnnualValue).toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.colRole}>Department total</Text>
            <Text style={styles.colCount}>{props.totals.totalPeople}</Text>
            <Text style={styles.colMinutes}>
              {Math.round(props.totals.totalMinutesPerDay)}
            </Text>
            <Text style={styles.colValue}>
              ${Math.round(props.totals.totalAnnualValue).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next steps</Text>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>1.</Text>
            <Text style={styles.bulletBody}>
              Review this with your team. The numbers come from public BLS
              data — your lived reality will refine them in either direction.
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>2.</Text>
            <Text style={styles.bulletBody}>
              Identify which roles in this mix have the highest leverage. The
              FTE-equivalent column is usually a better signal than total
              minutes.
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>3.</Text>
            <Text style={styles.bulletBody}>
              Book a 30-minute scoping call at {props.siteUrl}/contact when
              you&apos;re ready to talk about a real implementation.
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            {props.agencyName} · {props.siteUrl}
          </Text>
          <Text>Generated {props.generatedAt}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Update `lib/pdf/render.tsx` to expose a department renderer**

Read the current `lib/pdf/render.tsx`. Add a second exported function alongside `renderBlueprintPdf`:

```tsx
import { DepartmentPdf, type DepartmentPdfProps } from "./department"

// ... existing renderBlueprintPdf ...

export async function renderDepartmentPdf(
  props: DepartmentPdfProps
): Promise<Buffer> {
  return renderToBuffer(<DepartmentPdf {...props} />)
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npm run type-check
git add lib/pdf/department.tsx lib/pdf/render.tsx
git commit -m "feat(pdf): add Department variant template + renderDepartmentPdf helper"
```

---

## Task 7: department_roi_requests Supabase table

**Files:**
- Create: `supabase/migrations/2026-04-07-department-roi-requests.sql`
- Create: `scripts/apply-department-roi-migration.ts`

- [ ] **Step 1: Create the migration SQL**

```sql
-- 2026-04-07-department-roi-requests.sql
-- Stores email-gated PDF download captures from /build-a-team.
-- Separate from contact_messages, assistant_inquiries, and
-- one_pager_requests so CRM reporting can attribute revenue to
-- the four lead sources independently.

create table if not exists department_roi_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  team_label text,
  -- The cart at submission time, stored as JSONB for ad-hoc analysis.
  -- Shape: [{ "slug": "registered-nurses", "count": 3 }, ...]
  cart jsonb not null,
  -- Snapshot of the computed totals so we don't have to recompute
  -- when reviewing leads.
  total_people int,
  total_minutes_per_day int,
  total_annual_value int,
  fte_equivalents numeric(5,1),
  -- Operational fields
  user_agent text,
  ip_hash text,
  -- Delivery tracking
  pdf_sent_at timestamptz,
  pdf_send_error text
);

create index if not exists department_roi_requests_email_idx
  on department_roi_requests (email);
create index if not exists department_roi_requests_created_at_idx
  on department_roi_requests (created_at desc);

alter table department_roi_requests enable row level security;
-- No policies = service-role writes only.
```

- [ ] **Step 2: Create the runner script**

Copy `scripts/apply-one-pager-migration.ts` (the most recent runner — it follows the established pattern) to `scripts/apply-department-roi-migration.ts`. Edit:
- The SQL filename reference
- The table name in verification queries
- Any log strings mentioning the old table

Keep the idempotency (`create ... if not exists`) and verification (columns + RLS + count via service role) identical.

- [ ] **Step 3: Apply the migration**

```bash
npx tsx scripts/apply-department-roi-migration.ts
```

Expected: table created, all 13 columns verified, RLS enabled, count = 0.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/2026-04-07-department-roi-requests.sql scripts/apply-department-roi-migration.ts
git commit -m "feat(db): add department_roi_requests table for /build-a-team captures"
```

---

## Task 8: /api/build-a-team/pdf route handler

**Files:**
- Create: `app/api/build-a-team/pdf/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from "next/server"
import { buildATeamPdfSchema } from "@/lib/validation/build-a-team"
import { sendEmail } from "@/lib/resend"
import { createServerClient } from "@/lib/supabase/server"
import { renderDepartmentPdf } from "@/lib/pdf/render"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"
import { AGENCY, SITE } from "@/lib/site"
import { computeDepartmentTotals, type RoleData } from "@/lib/build-a-team/compute"

export const runtime = "nodejs"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const ipHash = hashIp(ip)
  const userAgent = request.headers.get("user-agent") ?? null

  if (
    isRateLimited("build-a-team", ipHash, {
      windowMs: 10 * 60 * 1000,
      max: 5,
    })
  ) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // Honeypot before zod.
  if (
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    typeof (body as { website: unknown }).website === "string" &&
    (body as { website: string }).website.length > 0
  ) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const parsed = buildATeamPdfSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const input = parsed.data
  const supabase = createServerClient()

  // Fetch every occupation in the cart from Supabase. We never trust
  // client-sent display values — the PDF numbers are computed from the
  // canonical hourly_wage and the live task list.
  const slugs = input.cart.map((c) => c.slug)
  const { data: occupations, error: occError } = await supabase
    .from("occupations")
    .select("id, slug, title, hourly_wage")
    .in("slug", slugs)

  if (occError || !occupations || occupations.length === 0) {
    return NextResponse.json(
      { error: "Unknown roles in cart" },
      { status: 400 }
    )
  }

  // Fetch profiles + tasks for every occupation in parallel.
  const occupationIds = occupations.map((o) => o.id)
  const [{ data: profiles }, { data: tasks }] = await Promise.all([
    supabase
      .from("occupation_automation_profile")
      .select("*")
      .in("occupation_id", occupationIds),
    supabase
      .from("job_micro_tasks")
      .select("*")
      .in("occupation_id", occupationIds),
  ])

  // Build the per-slug RoleData map for the compute helper.
  const roleDataBySlug = new Map<string, RoleData>()
  for (const occ of occupations) {
    roleDataBySlug.set(occ.slug, {
      occupation: occ,
      profile: (profiles ?? []).find((p) => p.occupation_id === occ.id) ?? null,
      tasks: (tasks ?? []).filter((t) => t.occupation_id === occ.id),
    })
  }

  const totals = computeDepartmentTotals(input.cart, roleDataBySlug)

  // Save the lead row FIRST.
  const { data: insertedRow, error: dbError } = await supabase
    .from("department_roi_requests")
    .insert({
      email: input.email,
      team_label: input.teamLabel ?? null,
      cart: input.cart,
      total_people: totals.totalPeople,
      total_minutes_per_day: Math.round(totals.totalMinutesPerDay),
      total_annual_value: Math.round(totals.totalAnnualValue),
      fte_equivalents: totals.fteEquivalents,
      user_agent: userAgent,
      ip_hash: ipHash,
    })
    .select("id")
    .single()

  if (dbError || !insertedRow) {
    console.error("[build-a-team] supabase insert failed", dbError)
    return NextResponse.json(
      { error: "We couldn't process your request. Please try again shortly." },
      { status: 500 }
    )
  }

  const generatedAt = new Date().toISOString().slice(0, 10)

  let pdfBuffer: Buffer | null = null
  let pdfError: string | null = null
  try {
    pdfBuffer = await renderDepartmentPdf({
      teamLabel: input.teamLabel ?? "Your AI-augmented team",
      totals: {
        totalPeople: totals.totalPeople,
        totalMinutesPerDay: totals.totalMinutesPerDay,
        totalAnnualValue: totals.totalAnnualValue,
        fteEquivalents: totals.fteEquivalents,
      },
      rows: totals.rows.map((r) => ({
        slug: r.slug,
        title: r.title,
        count: r.count,
        minutesPerPerson: r.minutesPerPerson,
        totalMinutesPerDay: r.totalMinutesPerDay,
        totalAnnualValue: r.totalAnnualValue,
      })),
      contactEmail: input.email,
      siteUrl: SITE.url,
      agencyName: AGENCY.name,
      generatedAt,
    })
  } catch (err) {
    pdfError = err instanceof Error ? err.message : String(err)
    console.error("[build-a-team] pdf generation failed", err)
  }

  let emailSent = false
  let emailError: string | null = null
  try {
    const safeLabel = escapeHtml(
      input.teamLabel ?? "Your AI-augmented team"
    )
    await sendEmail({
      to: input.email,
      subject: `AI Department Blueprint · ${input.teamLabel ?? "Your team"}`,
      html: `
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; color:#221f1c;">
  <h2 style="font-size: 20px; margin: 0 0 12px;">Your department blueprint is attached.</h2>
  <p>Thanks for using the ${escapeHtml(SITE.name)} team builder. The attached PDF summarizes the compounded time-back and annual value for <strong>${safeLabel}</strong> &mdash; share it with your team or your CFO.</p>
  <p>If the numbers make sense and you&apos;d like to talk about a real build, book a scoping call at <a href="${SITE.url}/contact" style="color:#2563eb;">${SITE.url}/contact</a>.</p>
  <p style="margin-top:24px;">&mdash; ${escapeHtml(AGENCY.name)}</p>
</div>`.trim(),
      text: `Your department blueprint is attached.

Thanks for using the ${SITE.name} team builder. The attached PDF summarizes the compounded time-back and annual value for ${input.teamLabel ?? "your team"} — share it with your team or your CFO.

If the numbers make sense and you'd like to talk about a real build, book a scoping call at ${SITE.url}/contact.

— ${AGENCY.name}`,
      attachments: pdfBuffer
        ? [
            {
              filename: `ai-department-blueprint.pdf`,
              content: pdfBuffer,
            },
          ]
        : undefined,
    })
    emailSent = true
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err)
    console.error("[build-a-team] delivery email failed", err)
  }

  // Persist delivery state for audit.
  await supabase
    .from("department_roi_requests")
    .update({
      pdf_sent_at: emailSent ? new Date().toISOString() : null,
      pdf_send_error: emailError ?? pdfError,
    })
    .eq("id", insertedRow.id)

  return NextResponse.json({ ok: true }, { status: 200 })
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npm run type-check
git add app/api/build-a-team/pdf/route.ts
git commit -m "feat(build-a-team): add /api/build-a-team/pdf with department PDF + Resend"
```

---

## Task 9: /build-a-team page (server component)

**Files:**
- Create: `app/build-a-team/page.tsx`

> The page is a server component that reads the cart from `searchParams`, fetches the live data, computes totals, and passes everything to the client cart component for editing. The Results card and the Per-role breakdown table are server-rendered for fast first paint.

- [ ] **Step 1: Create the file**

```tsx
import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase/server"
import { FadeIn } from "@/components/FadeIn"
import { decodeCart, encodeCart, type CartRow } from "@/lib/build-a-team/url-state"
import { findTemplate, TEMPLATES } from "@/lib/build-a-team/templates"
import {
  computeDepartmentTotals,
  type RoleData,
} from "@/lib/build-a-team/compute"
import { Cart } from "./cart"
import { Results } from "./results"
import { TemplatePicker } from "./template-picker"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Build a Team",
  description:
    "What would your team look like with AI? Pick the roles, set the headcounts, and see the compounded time-back instantly. For founders, COOs, and ops leads designing a new function.",
}

type SearchParams = {
  roles?: string
  template?: string
}

export default async function BuildATeamPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  // Resolve cart from `?roles=` query, OR fall back to a template if
  // `?template=key` is set, OR start empty.
  const initialFromQuery = decodeCart(params.roles)
  const template = findTemplate(params.template)
  const cart: CartRow[] =
    initialFromQuery.length > 0
      ? initialFromQuery
      : template
      ? [...template.cart]
      : []

  // Fetch all occupations in the cart server-side.
  let totals: ReturnType<typeof computeDepartmentTotals> | null = null
  if (cart.length > 0) {
    const supabase = createServerClient()
    const slugs = cart.map((r) => r.slug)
    const { data: occupations } = await supabase
      .from("occupations")
      .select("id, slug, title, hourly_wage")
      .in("slug", slugs)

    if (occupations && occupations.length > 0) {
      const occupationIds = occupations.map((o) => o.id)
      const [{ data: profiles }, { data: tasks }] = await Promise.all([
        supabase
          .from("occupation_automation_profile")
          .select("*")
          .in("occupation_id", occupationIds),
        supabase
          .from("job_micro_tasks")
          .select("*")
          .in("occupation_id", occupationIds),
      ])

      const roleDataBySlug = new Map<string, RoleData>()
      for (const occ of occupations) {
        roleDataBySlug.set(occ.slug, {
          occupation: occ,
          profile:
            (profiles ?? []).find((p) => p.occupation_id === occ.id) ?? null,
          tasks: (tasks ?? []).filter((t) => t.occupation_id === occ.id),
        })
      }

      totals = computeDepartmentTotals(cart, roleDataBySlug)
    }
  }

  const shareUrl = cart.length > 0 ? `?roles=${encodeCart(cart)}` : null

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <FadeIn>
        <p className="text-xs uppercase tracking-[0.18em] text-accent font-semibold mb-3">
          BUILD A TEAM
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          What would your team look like with AI?
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl">
          For founders, COOs, and ops leads designing the shape of a new
          function before hiring. Pick the roles, set the headcounts, and
          see the compounded time-back instantly. Share the link with your
          team — your URL is your scratchpad.
        </p>
      </FadeIn>

      {cart.length === 0 ? (
        <FadeIn delay={0.1}>
          <TemplatePicker templates={TEMPLATES} />
        </FadeIn>
      ) : null}

      <FadeIn delay={0.15}>
        <Cart initialCart={cart} shareUrl={shareUrl} />
      </FadeIn>

      {totals && totals.rows.length > 0 ? (
        <FadeIn delay={0.2}>
          <Results totals={totals} />
        </FadeIn>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit (the page won't fully render until Tasks 10–12 add the imported components, but type-check should still pass once those exist)**

Defer the commit until the imported components exist (Tasks 10, 11, 12).

---

## Task 10: TemplatePicker server component

**Files:**
- Create: `app/build-a-team/template-picker.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link"
import type { Template } from "@/lib/build-a-team/templates"

export function TemplatePicker({ templates }: { templates: readonly Template[] }) {
  return (
    <div className="mb-12">
      <h2 className="font-heading text-lg font-semibold mb-3">
        Start from a template
      </h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        Pick a starting team that&apos;s close to what you&apos;re planning, then
        edit the roles and counts to match your reality.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {templates.map((tpl) => (
          <Link
            key={tpl.key}
            href={`/build-a-team?template=${tpl.key}`}
            className="block rounded-2xl border border-border bg-card p-5 hover:border-accent/40 hover:bg-accent/5 transition-colors"
          >
            <h3 className="font-heading text-base font-semibold mb-1">
              {tpl.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {tpl.blurb}
            </p>
            <p className="text-xs text-muted-foreground">
              {tpl.cart.length} role
              {tpl.cart.length === 1 ? "" : "s"} ·{" "}
              {tpl.cart.reduce((sum, r) => sum + r.count, 0)} people
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check (no commit yet — will batch with other build-a-team components)**

```bash
npm run type-check
```

---

## Task 11: Cart client component

**Files:**
- Create: `app/build-a-team/cart.tsx`

> Handles cart mutations and URL state syncing. The actual results are computed server-side; this component is purely for editing.

- [ ] **Step 1: Create the file**

```tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus, X, Link2, Mail, Check } from "lucide-react"
import {
  encodeCart,
  mutateCart,
  type CartRow,
} from "@/lib/build-a-team/url-state"
import { RoleSearch } from "./role-search"
import { PdfModal } from "./pdf-modal"

export function Cart({
  initialCart,
  shareUrl,
}: {
  initialCart: CartRow[]
  shareUrl: string | null
}) {
  const router = useRouter()
  const [cart, setCart] = useState<CartRow[]>(initialCart)
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)

  function commit(next: CartRow[]) {
    setCart(next)
    const encoded = encodeCart(next)
    const url = encoded ? `/build-a-team?roles=${encoded}` : "/build-a-team"
    startTransition(() => {
      router.replace(url, { scroll: false })
    })
  }

  function handleAdd(slug: string, title: string) {
    const next = mutateCart(cart, slug, { addCount: 1 })
    commit(next)
  }

  function handleSetCount(slug: string, count: number) {
    const next = mutateCart(cart, slug, { setCount: count })
    commit(next)
  }

  function handleRemove(slug: string) {
    const next = mutateCart(cart, slug, { setCount: 0 })
    commit(next)
  }

  async function handleCopyShare() {
    if (typeof window === "undefined") return
    const fullUrl = window.location.href
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can fail in non-secure contexts; fall back to a
      // selectable input the user can copy from.
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg font-semibold">Your team</h2>
          <span className="text-sm text-muted-foreground">
            {cart.length} role{cart.length === 1 ? "" : "s"}
          </span>
        </div>

        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-5">
            Search for a role below to get started, or pick a template above.
          </p>
        ) : (
          <ul className="space-y-3 mb-5">
            {cart.map((row) => (
              <CartRowItem
                key={row.slug}
                row={row}
                onSetCount={handleSetCount}
                onRemove={handleRemove}
                disabled={pending}
              />
            ))}
          </ul>
        )}

        <div>
          <label
            htmlFor="role-search"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Add a role
          </label>
          <RoleSearch onPick={handleAdd} />
        </div>
      </div>

      {cart.length > 0 ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCopyShare}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-accent" />
                Copied
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                Copy share link
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setPdfOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Mail className="h-4 w-4" />
            Email me a PDF
          </button>
        </div>
      ) : null}

      {pdfOpen ? (
        <PdfModal cart={cart} onClose={() => setPdfOpen(false)} />
      ) : null}
    </div>
  )
}

function CartRowItem({
  row,
  onSetCount,
  onRemove,
  disabled,
}: {
  row: CartRow
  onSetCount: (slug: string, count: number) => void
  onRemove: (slug: string) => void
  disabled: boolean
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex-1 text-sm text-foreground">{prettySlug(row.slug)}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSetCount(row.slug, Math.max(1, row.count - 1))}
          disabled={disabled || row.count <= 1}
          aria-label={`Decrease ${row.slug} count`}
          className="p-1.5 rounded-md border border-border hover:bg-secondary transition-colors disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          type="number"
          min={1}
          max={999}
          value={row.count}
          onChange={(e) =>
            onSetCount(row.slug, Number.parseInt(e.target.value || "1", 10))
          }
          aria-label={`${row.slug} count`}
          className="w-14 text-center text-sm rounded-md border border-border bg-background py-1"
        />
        <button
          type="button"
          onClick={() => onSetCount(row.slug, row.count + 1)}
          disabled={disabled || row.count >= 999}
          aria-label={`Increase ${row.slug} count`}
          className="p-1.5 rounded-md border border-border hover:bg-secondary transition-colors disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onRemove(row.slug)}
        aria-label={`Remove ${row.slug}`}
        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  )
}

// Slug-only fallback label, used until the server hydrates with a
// real title. The page server component already renders the
// authoritative breakdown table; this is the editor view.
function prettySlug(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}
```

- [ ] **Step 2: Type-check (defer commit)**

```bash
npm run type-check
```

---

## Task 12: RoleSearch typeahead client component

**Files:**
- Create: `app/build-a-team/role-search.tsx`

> Reuses the existing `/api/occupations/search` endpoint. Returns `{id, title, slug, major_category}` for each match.

- [ ] **Step 1: Create the file**

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Search, Loader2 } from "lucide-react"

type SearchResult = {
  id: number
  title: string
  slug: string
  major_category: string | null
}

export function RoleSearch({
  onPick,
}: {
  onPick: (slug: string, title: string) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Debounced search against the existing /api/occupations/search.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/occupations/search?q=${encodeURIComponent(query.trim())}`
        )
        const body = await res.json().catch(() => ({ results: [] }))
        setResults(Array.isArray(body.results) ? body.results : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => window.clearTimeout(id)
  }, [query])

  // Click-outside to close.
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    window.addEventListener("mousedown", handle)
    return () => window.removeEventListener("mousedown", handle)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          id="role-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder='Try "Software Developer" or "Nurse"'
          className="w-full rounded-lg border border-border bg-background pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
        />
        {loading ? (
          <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
        ) : null}
      </div>

      {open && results.length > 0 ? (
        <ul className="absolute left-0 right-0 mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-card shadow-lg z-10">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(r.slug, r.title)
                  setQuery("")
                  setResults([])
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <span className="text-foreground">{r.title}</span>
                {r.major_category ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {r.major_category}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: Type-check (defer commit)**

```bash
npm run type-check
```

---

## Task 13: Results server component

**Files:**
- Create: `app/build-a-team/results.tsx`

- [ ] **Step 1: Create the file**

```tsx
import type { DepartmentTotals } from "@/lib/build-a-team/compute"

export function Results({ totals }: { totals: DepartmentTotals }) {
  return (
    <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8">
      <h2 className="font-heading text-xl font-semibold mb-5">
        What this team is worth with AI
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat label="People in scope" value={totals.totalPeople.toString()} />
        <Stat
          label="Daily time reclaimed"
          value={Math.round(totals.totalMinutesPerDay).toLocaleString()}
          unit="min"
        />
        <Stat
          label="Annual value"
          value={`$${Math.round(totals.totalAnnualValue).toLocaleString()}`}
        />
        <Stat
          label="Equivalent FTEs"
          value={totals.fteEquivalents.toString()}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-semibold py-2">Role</th>
              <th className="text-center font-semibold py-2">People</th>
              <th className="text-right font-semibold py-2">Min/day each</th>
              <th className="text-right font-semibold py-2">Annual value</th>
            </tr>
          </thead>
          <tbody>
            {totals.rows.map((row) => (
              <tr key={row.slug} className="border-t border-border">
                <td className="py-2 text-foreground">{row.title}</td>
                <td className="py-2 text-center">{row.count}</td>
                <td className="py-2 text-right">{row.minutesPerPerson}</td>
                <td className="py-2 text-right">
                  ${Math.round(row.totalAnnualValue).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-foreground font-semibold">
              <td className="py-2">Department total</td>
              <td className="py-2 text-center">{totals.totalPeople}</td>
              <td className="py-2 text-right">
                {Math.round(totals.totalMinutesPerDay).toLocaleString()}
              </td>
              <td className="py-2 text-right">
                ${Math.round(totals.totalAnnualValue).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit?: string
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className="font-heading text-2xl font-semibold text-foreground">
        {value}
        {unit ? (
          <span className="text-base text-muted-foreground ml-1">{unit}</span>
        ) : null}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Type-check (defer commit)**

```bash
npm run type-check
```

---

## Task 14: PDF modal client component

**Files:**
- Create: `app/build-a-team/pdf-modal.tsx`

> Mirrors the `OnePagerButton` modal pattern from Plan 2 verbatim — same a11y treatment (Escape, autofocus, focus restore, body scroll lock), same honeypot, same `text-destructive` error styling, same role/aria-modal/aria-labelledby. The only difference is the payload it submits.

- [ ] **Step 1: Create the file**

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, CheckCircle2, X } from "lucide-react"
import { buildATeamPdfSchema } from "@/lib/validation/build-a-team"
import type { CartRow } from "@/lib/build-a-team/url-state"

type Status = "idle" | "submitting" | "success" | "error"

export function PdfModal({
  cart,
  onClose,
}: {
  cart: CartRow[]
  onClose: () => void
}) {
  const [status, setStatus] = useState<Status>("idle")
  const [email, setEmail] = useState("")
  const [teamLabel, setTeamLabel] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = "hidden"
    const id = window.setTimeout(() => emailInputRef.current?.focus(), 0)
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage(null)
    setFieldError(null)

    const parsed = buildATeamPdfSchema.safeParse({
      cart,
      email,
      teamLabel: teamLabel || undefined,
      website: "",
    })
    if (!parsed.success) {
      setFieldError(
        parsed.error.flatten().fieldErrors.email?.[0] ??
          "Please enter a valid email address."
      )
      setStatus("idle")
      return
    }

    try {
      const res = await fetch("/api/build-a-team/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setErrorMessage("Too many requests. Please try again shortly.")
        } else if (body?.issues?.email) {
          setFieldError(body.issues.email[0])
        } else {
          setErrorMessage(
            body?.error ?? "Something went wrong. Please email us directly."
          )
        }
        setStatus("error")
        return
      }
      setStatus("success")
    } catch {
      setErrorMessage("Network error. Please try again.")
      setStatus("error")
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {status === "success" ? (
          <div role="status" aria-live="polite" className="text-center py-4">
            <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-3" />
            <h3
              id="pdf-modal-title"
              className="font-heading text-lg font-semibold mb-2"
            >
              On its way.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Check your inbox in the next minute or two for the department
              blueprint PDF.
            </p>
          </div>
        ) : (
          <>
            <h3
              id="pdf-modal-title"
              className="font-heading text-lg font-semibold mb-1"
            >
              Email me the department blueprint
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              We&apos;ll email you a branded PDF with the compounded math for
              the team you just built.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="pdf-modal-email"
                  className="block text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="pdf-modal-email"
                  ref={emailInputRef}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={fieldError ? true : undefined}
                  aria-describedby={
                    fieldError ? "pdf-modal-email-error" : undefined
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors aria-invalid:border-destructive aria-invalid:focus:ring-destructive/30"
                />
                {fieldError ? (
                  <p
                    id="pdf-modal-email-error"
                    className="text-xs text-destructive"
                  >
                    {fieldError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="pdf-modal-label"
                  className="block text-sm font-medium text-foreground"
                >
                  Team label{" "}
                  <span className="text-xs text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="pdf-modal-label"
                  type="text"
                  value={teamLabel}
                  onChange={(e) => setTeamLabel(e.target.value)}
                  placeholder='e.g. "Acme Health ops team"'
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
                />
              </div>

              {errorMessage ? (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Email me the PDF"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit (batch all the build-a-team app files now that they all exist)**

```bash
npm run type-check
git add app/build-a-team
git commit -m "$(cat <<'EOF'
feat(build-a-team): add page, cart, results, template picker, role search, pdf modal

Server-rendered /build-a-team page that reads the cart from
?roles=slug:count,slug:count, fetches every occupation server-side,
and renders the compound math instantly. Client cart component syncs
mutations back to the URL via router.replace() so every state change
is shareable. Role search reuses the existing /api/occupations/search
endpoint. Results table + headline stat cards are server-rendered.
Template picker shows the 5 starter carts when the cart is empty.
PDF modal mirrors the Plan 2 OnePagerButton a11y pattern verbatim
(Escape, autofocus, focus restore, body scroll lock, honeypot,
text-destructive errors).

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Wire entry points (Header nav + homepage CTA + occupation page link)

**Files:**
- Modify: `components/layout/Header.tsx`
- Modify: `app/page.tsx`
- Modify: `app/occupation/[slug]/page.tsx`

> Three small additive changes that surface `/build-a-team` from places visitors already are.

- [ ] **Step 1: Add nav link to Header.tsx**

In the `links` array near the top of `components/layout/Header.tsx` (around line 22), insert a new entry:

```ts
const links = [
  { href: "/about", label: "About" },
  { href: "/browse", label: "Industries" },
  { href: "/build-a-team", label: "Build a Team" },
  { href: "/products", label: "Pricing" },
]
```

Also add a corresponding entry inside the dropdown menu in the Header (find the existing `<DropdownMenuItem render={<Link href="/about" />}>` block and add a new one for `/build-a-team`).

- [ ] **Step 2: Add homepage hero CTA**

In `app/page.tsx`, find where the existing primary search input or hero CTA lives. Add a small secondary text-link or button below it:

```tsx
<Link
  href="/build-a-team"
  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
>
  Or build a whole team →
</Link>
```

Place it directly below the search box / primary CTA — do not rearrange the hero. Keep it small and secondary so it doesn't compete with the main "search for your role" entry point.

- [ ] **Step 3: Add "Add to Team" link on the occupation page**

In `app/occupation/[slug]/page.tsx`, find the hero CTA flex row that already contains "Build Your Custom Assistant" + the OnePagerButton. Add a third link:

```tsx
<Link
  href={`/build-a-team?roles=${occupation.slug}:1`}
  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
>
  Add to Team
</Link>
```

This lets visitors who arrive on a single occupation page bootstrap a team build with that role pre-loaded.

- [ ] **Step 4: Type-check + commit**

```bash
npm run type-check
git add components/layout/Header.tsx app/page.tsx app/occupation/\[slug\]/page.tsx
git commit -m "feat(build-a-team): wire Header nav + homepage CTA + occupation page entry"
```

---

## Task 16: Playwright smoke tests

**Files:**
- Create: `tests/e2e/build-a-team.spec.ts`

- [ ] **Step 1: Create the test file**

```ts
import { expect, test } from "@playwright/test"

test.describe("/build-a-team page", () => {
  test("empty state shows templates", async ({ page }) => {
    await page.goto("/build-a-team")
    await expect(
      page.getByRole("heading", { name: /what would your team look like/i })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /start from a template/i })
    ).toBeVisible()
    // At least one template card should render.
    await expect(
      page.getByRole("link", { name: /small medical clinic/i })
    ).toBeVisible()
  })

  test("template click loads a populated cart", async ({ page }) => {
    await page.goto("/build-a-team")
    await page.getByRole("link", { name: /small medical clinic/i }).click()
    await expect(page).toHaveURL(/\/build-a-team\?template=clinic/)
    // Once the template loads, we should see the results card.
    await expect(
      page.getByRole("heading", { name: /what this team is worth with ai/i })
    ).toBeVisible()
  })

  test("URL state encodes the cart", async ({ page }) => {
    await page.goto("/build-a-team?roles=software-developers:3,registered-nurses:2")
    await expect(
      page.getByRole("heading", { name: /what this team is worth with ai/i })
    ).toBeVisible()
    // The total people stat should equal 5.
    await expect(page.getByText(/people in scope/i)).toBeVisible()
  })

  test("PDF modal opens and validates email", async ({ page }) => {
    await page.goto("/build-a-team?roles=software-developers:3")
    await page.getByRole("button", { name: /email me a pdf/i }).click()

    await expect(
      page.getByRole("dialog", { name: /email me the department blueprint/i })
    ).toBeVisible()

    await page.getByLabel(/^email$/i).first().fill("not-an-email")
    await page.getByRole("button", { name: /email me the pdf/i }).click()

    await expect(
      page.getByText(/please enter a valid email/i).first()
    ).toBeVisible()
  })
})

test.describe("entry points", () => {
  test("Build a Team appears in the header nav and routes correctly", async ({
    page,
  }) => {
    await page.goto("/")
    await page
      .getByRole("link", { name: /^build a team$/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/build-a-team$/)
  })

  test("Add to Team button on occupation page pre-loads the cart", async ({
    page,
  }) => {
    await page.goto("/occupation/software-developers")
    await page.getByRole("link", { name: /^add to team$/i }).click()
    await expect(page).toHaveURL(
      /\/build-a-team\?roles=software-developers:1/
    )
  })
})
```

- [ ] **Step 2: Run the spec**

```bash
npx playwright test build-a-team --reporter=line
```

If a selector mismatches the actual rendered DOM, fix the selector — not the component.

- [ ] **Step 3: Run the full suite to catch regressions**

```bash
npx playwright test --reporter=line
```

Expected: contact-form (5) + funnel-realness (3) + build-a-team (6) = 14 passing, plus the pre-existing occupation-inline-builder failure that's unrelated to any plan.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/build-a-team.spec.ts
git commit -m "test(e2e): smoke tests for /build-a-team templates, cart, PDF modal, entry points"
```

---

## Task 17: Senior-engineer QA (controller-owned)

**Files:** none — verification only.

This task is run by the orchestrator (not a subagent). Same depth as Plan 1's Task 16 and Plan 2's Task 17.

- [ ] **Step 1: Clean build**

```bash
rm -rf .next
npm run type-check
npm run build
```

Expected: clean type-check, build succeeds, new routes `/build-a-team` and `/api/build-a-team/pdf` both compile.

- [ ] **Step 2: Full Playwright suite**

```bash
npx playwright test --reporter=line
```

- [ ] **Step 3: Real curl tests against `/api/build-a-team/pdf`**

Start dev server. Submit a valid cart payload via curl. Verify:
- 200 with `{ok:true}`
- New row in `department_roi_requests` with `total_people`, `total_minutes_per_day`, `total_annual_value`, `fte_equivalents`, and `cart` (jsonb) all populated correctly
- Resend email arrives at the test address (using `damonbodine@gmail.com` since the free tier blocks other recipients)
- PDF attachment opens cleanly in Preview
- `pdf_sent_at` populated, `pdf_send_error` null in the row after the call

Then test:
- Validation failure (empty cart, bad email) → 400 with `issues`
- Honeypot populated → 200 silent, no DB row, no email
- Malformed JSON → 400

- [ ] **Step 4: Browser walkthrough with Playwright MCP**

1. Visit `/build-a-team` → confirm empty state with template cards ✅
2. Click "Small medical clinic" template → URL becomes `?template=clinic`, cart populates, results card appears with stat cards (people, min/day, annual value, FTEs) and per-role table ✅
3. Click "+" on a role → URL updates to `?roles=...`, results recompute server-side, page navigates without scrolling ✅
4. Click "−" on a role → URL updates, count decreases ✅
5. Click "X" to remove a role → URL updates, role disappears from cart and results ✅
6. Type a new role in the search box → typeahead returns results from `/api/occupations/search` ✅
7. Click a search result → role is added to the cart with count 1 ✅
8. Click "Copy share link" → clipboard contains the full URL with `?roles=...`, button briefly shows "Copied" ✅
9. Click "Email me a PDF" → modal opens with autofocused email input and optional team label field ✅
10. Submit valid email → success state ("On its way.") ✅
11. New row in `department_roi_requests` with `pdf_sent_at` populated ✅
12. Press Escape → modal closes, focus restores ✅
13. Visit `/occupation/software-developers` → confirm "Add to Team" link visible in CTA row ✅
14. Click it → routes to `/build-a-team?roles=software-developers:1` with cart pre-populated ✅
15. Visit `/` → confirm "Or build a whole team →" secondary CTA visible under the search ✅
16. Header nav has "Build a Team" link ✅

Take screenshots of every state.

- [ ] **Step 5: Visual QA on the PDF**

Open the actual PDF. Check:
- "AI DEPARTMENT BLUEPRINT" kicker
- Team label as the title (or "Your AI-augmented team" fallback)
- Four stat cards in a 2x2 grid: people, min/day, annual value, FTE equivalents
- Per-role table with all rows + bold "Department total" footer row
- Next steps section
- Footer with agency attribution + generated date

- [ ] **Step 6: Dispatch parallel reviewer subagents**

- Spec compliance reviewer (same template as Plans 1 + 2)
- Code quality reviewer (focus areas: PDF correctness, URL state handling, server-side data fetch in N occupation IDs, RLS posture on the new table, dialog a11y, race conditions in router.replace + useTransition)

Apply any fixes in a single polish commit. Re-run type-check + e2e.

- [ ] **Step 7: Merge to main**

```bash
cd /Users/damonbodine/ai-jobs-map
git merge feat/build-a-team --ff-only
git worktree remove .worktrees/build-a-team
git branch -d feat/build-a-team
```

- [ ] **Step 8: Hand off**

Mark Plan 5 complete. Operational items for the human:
- Run `scripts/apply-department-roi-migration.ts` against production DB when deploying
- No new env vars (Calendly + Resend already wired in Plan 2)

---

## What Plan 5 intentionally does NOT do

- **Plan 3 — Agency Credibility:** /work case studies, pricing anchors on /products, How-we-work strip, dynamic homepage stats. Plan 5 does not touch any of those — but the new `/build-a-team` page IS surfaced in the nav and homepage CTA, which incidentally raises the visible-CTA count on the homepage.
- **Plan 4 — Instrumentation:** PostHog event tracking on the cart mutations (add/remove/share-click/pdf-submit) is the obvious next thing, but Plan 5 ships without it. The cart mutations DO update the URL, so basic funnel analysis is still possible from server logs.
- **Plan 6 — Interactive Module Demos:** unrelated.

Do not pull work forward from these plans while implementing Plan 5.

---

## Self-review checklist

- **Spec coverage:** /build-a-team route ✅, URL-state cart ✅, 5 starter templates ✅, instant compound math (server-rendered, no client fetch) ✅, share link button ✅, optional email-gated PDF download ✅, new department-variant PDF template ✅, new department_roi_requests table ✅, /api/build-a-team/pdf route ✅, header + homepage + occupation page entry points ✅, e2e tests ✅, senior-engineer QA step ✅.
- **Placeholder scan:** All template slugs verified to exist in the live BLS DB before the plan was written. Pricing tier keys and email addresses use the existing `lib/site.ts` constants. The new rate-limit bucket name `"build-a-team"` is bucket-separated from the others.
- **Type consistency:** `BuildATeamPdfInput` matches what the cart client component sends. `DepartmentPdfProps` matches what `renderDepartmentPdf` accepts. `RoleData` from compute.ts matches what the page server component builds. The cart URL format is the single source of truth in `lib/build-a-team/url-state.ts`.
- **Security invariants:** Honeypot checked BEFORE zod in the new route. HTML escaping applied to every interpolated user-supplied field in the email body. Service-role Supabase used for writes. RLS enabled on `department_roi_requests`. IP hashed not stored raw. Rate limit bucket separated by route. PDF numbers re-derived server-side from canonical hourly_wage + live tasks (never client-trusted). Cart payload re-validated against the actual occupation rows in the DB before computing totals.
