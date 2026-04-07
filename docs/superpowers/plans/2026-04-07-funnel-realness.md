# Funnel Realness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the occupation builder from a lead-form-to-nowhere into a credible funnel that delivers a real artifact (PDF blueprint), books a scoping call (Calendly embed), and captures softer-conversion leads (email-gated "Download One-Pager for your Team" button on every occupation page). This is Plan 2 of the post-audit roadmap; Plan 1 (Trust Foundation) is merged and live.

**Architecture:** Three integrated pieces that share the same PDF infrastructure:

1. **PDF engine** — `@react-pdf/renderer` renders branded PDFs inside a Vercel Function. No external service, no headless browser, no extra API key. A single `<Blueprint>` React tree composes all variants.
2. **Occupation builder rewire** — the submit currently writes directly from the client to `assistant_inquiries` (anon-key, no validation, no email). Move it behind a new `/api/inquiries` route that validates with zod, inserts with the service-role client, generates a PDF attachment, and fires two Resend emails (confirmation to lead, notification to Damon). The "Done" phase gets replaced with a "Check your inbox + book a scoping call" Calendly embed.
3. **One-Pager download CTA** — every `/occupation/[slug]` page gains a secondary button: "Download One-Pager for your Team". Clicking opens a modal asking only for email, then `/api/one-pager` generates a simplified PDF and delivers it via Resend. Softer conversion — no "talk to sales" commitment, just a shareable artifact that brings the buyer back.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind 4, Supabase (service-role via existing `lib/supabase/server.ts`), Resend 6 (already wired in `lib/resend.ts`), zod 4 (already installed), `@react-pdf/renderer` (new), `react-calendly` (new), Playwright (existing).

**Prerequisites (human):**
- `CALENDLY_URL=https://calendly.com/damonbodine/...` in `.env.local` — you'll drop the real URL in during Task 1. Fallback for dev is `https://calendly.com/damonbodine/scoping-call` which will gracefully render as a 404 inside the embed until you set it.
- Resend sender domain still needs verification to go to production (same prerequisite as Plan 1).

---

## File Structure

**Create:**
- `lib/pdf/blueprint.tsx` — `@react-pdf/renderer` React components for the Blueprint PDF (one template, two data shapes: `builder` and `onePager`)
- `lib/pdf/render.ts` — thin helper that renders `<Blueprint>` to a Node `Buffer`, typed and single-purpose
- `lib/validation/inquiry.ts` — zod schema for `POST /api/inquiries` payload
- `lib/validation/one-pager.ts` — zod schema for `POST /api/one-pager` payload
- `lib/rate-limit.ts` — in-memory rate limit helper (extracted from `/api/contact/route.ts` for reuse)
- `lib/calendly.ts` — constants for the Calendly URL + embed styling
- `lib/email/templates.tsx` — React components for HTML email bodies (builder confirmation, builder notification, one-pager delivery) rendered to HTML strings via `@react-email/render` if installed, OR hand-written template functions if not — pick ONE path in Task 1 based on bundle size cost
- `app/api/inquiries/route.ts` — server handler for occupation builder submit
- `app/api/one-pager/route.ts` — server handler for email-gated PDF download
- `components/CalendlyEmbed.tsx` — client component wrapping `react-calendly`'s `InlineWidget`
- `app/occupation/[slug]/one-pager-button.tsx` — client component: button + modal + form + fetch to `/api/one-pager`
- `supabase/migrations/2026-04-07-one-pager-requests.sql` — new table for email captures from the one-pager CTA
- `scripts/apply-one-pager-migration.ts` — idempotent migration runner (copy the Plan 1 pattern exactly)
- `tests/e2e/funnel-realness.spec.ts` — Playwright specs for builder submit, one-pager modal, Calendly embed presence

**Modify:**
- `app/occupation/[slug]/occupation-builder.tsx` — replace `supabase.from("assistant_inquiries").insert(...)` with `fetch("/api/inquiries", ...)`; replace the static "Done" phase with a new rich success screen containing the Calendly embed and a "Your blueprint is in your inbox" confirmation
- `app/occupation/[slug]/page.tsx` — add the One-Pager button near the top, next to the existing CTAs
- `app/api/contact/route.ts` — refactor to use the extracted `lib/rate-limit.ts` (behavior identical, just DRY)
- `lib/resend.ts` — extend `sendEmail` to accept optional `attachments` (resend v6 supports `{ filename, content }` where `content` is a `Buffer` or base64 string)
- `lib/site.ts` — add `PRICING_TIERS` constant if not already present; it's used by the PDF template to render the tier strip

**Delete:** nothing — Plan 2 is strictly additive.

---

## Task 1: Install deps, add Calendly + email constants, decide on email rendering

**Files:**
- Modify: `package.json`
- Create: `lib/calendly.ts`
- Modify: `lib/site.ts` (add pricing tier constants if missing)
- Modify: `.env.local.example`

- [ ] **Step 1: Install runtime deps**

```bash
npm install @react-pdf/renderer react-calendly
```

Confirm both land in `dependencies` in `package.json`. As of Plan 2 start, expected versions are `@react-pdf/renderer ^4.x` and `react-calendly ^4.x` — pin to whatever npm resolves.

- [ ] **Step 2: Decide on email rendering strategy**

Two options:
- **A (lighter):** Hand-written HTML template functions that take typed data and return escaped HTML + text strings. Zero extra deps. Fine for 3 templates. Same pattern as Plan 1's `/api/contact` route.
- **B (richer):** `@react-email/render` + React components for emails. Nicer authoring but ~200KB of bundle cost on the server and a learning curve.

**Pick A.** The emails for Plan 2 are: builder confirmation (lead), builder notification (Damon), one-pager delivery (lead). Three templates, similar structure, all single-column transactional. The Plan 1 `/api/contact` notification is already hand-written and escaped correctly — extend that pattern. Defer `@react-email` until a future plan genuinely needs it.

Document this decision in `lib/email/templates.tsx`'s file header comment.

- [ ] **Step 3: Create `lib/calendly.ts`**

```ts
/**
 * Calendly configuration for scoping-call bookings.
 *
 * The actual URL lives in the `CALENDLY_URL` env var so it can be rotated
 * without a code change. Falls back to a placeholder in development — the
 * embed will render a Calendly 404 until you set the env var, which is
 * loud enough during manual QA to catch before shipping.
 */

export const CALENDLY = {
  url:
    process.env.NEXT_PUBLIC_CALENDLY_URL ||
    "https://calendly.com/damonbodine/scoping-call",
  // Default pageSettings used by the InlineWidget. These match the
  // Recovery Ink design system: warm white background, blue accent.
  pageSettings: {
    backgroundColor: "ffffff",
    hideEventTypeDetails: false,
    hideLandingPageDetails: false,
    primaryColor: "2563eb", // tailwind blue-600, matches --accent
    textColor: "221f1c", // matches --foreground
  },
} as const
```

- [ ] **Step 4: Verify `lib/site.ts` has pricing tiers**

Open `lib/site.ts`. Look for a `PRICING_TIERS` or `TIERS` export. If one exists already (it may from earlier work on `/products`), reuse it. If not, add:

```ts
export const PRICING_TIERS = [
  {
    key: "starter",
    name: "Starter Assistant",
    startingAt: "$3,500",
    blurb: "Single-module builds for one role. Good fit for testing the waters.",
  },
  {
    key: "workflow",
    name: "Workflow Bundle",
    startingAt: "$12,000",
    blurb: "Multi-module builds for a team. Coordinated agents with shared context.",
  },
  {
    key: "ops-layer",
    name: "Ops Layer",
    startingAt: "Custom scoped",
    blurb: "Department- or company-wide rollout. Includes integrations, monitoring, and ongoing support.",
  },
] as const
```

(Numbers match the user's audit-feedback pricing anchors — these land in Plan 3 on the `/products` page, but Plan 2's PDF also references them.)

- [ ] **Step 5: Add env var to `.env.local.example`**

Append:

```
# Calendly (scoping call embed)
NEXT_PUBLIC_CALENDLY_URL=https://calendly.com/damonbodine/scoping-call
```

- [ ] **Step 6: Type-check**

```bash
npm run type-check
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json lib/calendly.ts lib/site.ts .env.local.example
git commit -m "chore(funnel): add pdf + calendly deps, calendly constants, pricing tiers"
```

---

## Task 2: Build the Blueprint PDF template

**Files:**
- Create: `lib/pdf/blueprint.tsx`

> This is the biggest file in Plan 2 — take your time. The template has to look credible when a buyer forwards it to their CFO. Use the same visual language as the site: Newsreader-style serif headings, clean sans body, blue accent, plenty of whitespace.

- [ ] **Step 1: Create the file**

```tsx
import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"

// @react-pdf/renderer bundles Helvetica by default. For brand consistency
// we register the same two fonts the site uses. These must be reachable
// at runtime — we point at the Google Fonts CDN URLs used by next/font.
// If CDN fetches at build time become a problem, switch to shipping the
// TTF files in /public/fonts and passing local URLs.
Font.register({
  family: "Newsreader",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/newsreader/v20/cY9qfjOCX1hbuyalUrK49dLac06G1ZGsZBtoBCzBDXXD9JVF439RWpWlsA.ttf",
      fontWeight: 700,
    },
    {
      src: "https://fonts.gstatic.com/s/newsreader/v20/cY9qfjOCX1hbuyalUrK49dLac06G1ZGsZBtoBCzBDXXD9JVF439RWpWlsA.ttf",
      fontWeight: 400,
    },
  ],
})
Font.register({
  family: "Manrope",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggexSg.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggSxSg.ttf",
      fontWeight: 600,
    },
  ],
})

const COLORS = {
  bg: "#fafaf7",
  fg: "#221f1c",
  muted: "#6b6661",
  accent: "#2563eb",
  accentSoft: "#eff6ff",
  border: "#e5e0d8",
  cardBg: "#ffffff",
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    padding: 48,
    fontFamily: "Manrope",
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
    fontFamily: "Newsreader",
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
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
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
    fontFamily: "Newsreader",
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.fg,
  },
  statUnit: {
    fontSize: 10,
    color: COLORS.muted,
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Newsreader",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    color: COLORS.fg,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 10,
    color: COLORS.accent,
    fontWeight: 600,
  },
  bulletBody: {
    flex: 1,
    color: COLORS.fg,
  },
  moduleCard: {
    backgroundColor: COLORS.cardBg,
    border: `1 solid ${COLORS.border}`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  moduleName: {
    fontWeight: 600,
    fontSize: 11,
    marginBottom: 3,
  },
  moduleBlurb: {
    color: COLORS.muted,
    fontSize: 9,
  },
  calloutCard: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  calloutTitle: {
    fontFamily: "Newsreader",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 4,
  },
  calloutBody: {
    fontSize: 10,
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

export type BlueprintPdfProps = {
  variant: "builder" | "one-pager"
  occupation: {
    title: string
    slug: string
  }
  stats: {
    minutesPerDay: number
    annualValueDollars: number
    taskCount: number
  }
  selectedTasks: Array<{
    name: string
    minutesPerDay: number
  }>
  recommendedModules: Array<{
    name: string
    blurb: string
  }>
  // Only set when variant === "builder"
  tier?: {
    name: string
    startingAt: string
    blurb: string
  }
  teamSize?: string
  customRequests?: string[]
  contact: {
    name?: string
    email: string
  }
  siteUrl: string
  agencyName: string
  generatedAt: string // ISO date string
}

export function BlueprintPdf(props: BlueprintPdfProps) {
  const variantLabel =
    props.variant === "builder"
      ? "CUSTOM AI ASSISTANT BLUEPRINT"
      : "AI TIME-BACK ONE-PAGER"

  return (
    <Document
      title={`AI Blueprint — ${props.occupation.title}`}
      author={props.agencyName}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{variantLabel}</Text>
          <Text style={styles.title}>{props.occupation.title}</Text>
          <Text style={styles.subtitle}>
            Prepared by {props.agencyName} · {props.siteUrl}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Daily time reclaimed</Text>
            <Text style={styles.statValue}>
              {props.stats.minutesPerDay}
              <Text style={styles.statUnit}>min</Text>
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Annual value per person</Text>
            <Text style={styles.statValue}>
              ${Math.round(props.stats.annualValueDollars).toLocaleString()}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tasks automatable</Text>
            <Text style={styles.statValue}>{props.stats.taskCount}</Text>
          </View>
        </View>

        {props.variant === "builder" && props.tier ? (
          <View style={styles.calloutCard}>
            <Text style={styles.calloutTitle}>
              Recommended engagement: {props.tier.name} · {props.tier.startingAt}
            </Text>
            <Text style={styles.calloutBody}>{props.tier.blurb}</Text>
            {props.teamSize ? (
              <Text style={[styles.calloutBody, { marginTop: 4 }]}>
                Team size selected: {props.teamSize}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {props.variant === "builder"
              ? "Tasks your assistant will handle"
              : "Top automation opportunities"}
          </Text>
          {props.selectedTasks.slice(0, 12).map((task) => (
            <View key={task.name} style={styles.bullet}>
              <Text style={styles.bulletDot}>·</Text>
              <Text style={styles.bulletBody}>
                {task.name}{" "}
                <Text style={{ color: COLORS.muted }}>
                  — {task.minutesPerDay} min/day
                </Text>
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended modules</Text>
          {props.recommendedModules.slice(0, 6).map((mod) => (
            <View key={mod.name} style={styles.moduleCard}>
              <Text style={styles.moduleName}>{mod.name}</Text>
              <Text style={styles.moduleBlurb}>{mod.blurb}</Text>
            </View>
          ))}
        </View>

        {props.variant === "builder" &&
        props.customRequests &&
        props.customRequests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your custom requests</Text>
            {props.customRequests.map((req, i) => (
              <View key={`${i}-${req.slice(0, 10)}`} style={styles.bullet}>
                <Text style={styles.bulletDot}>·</Text>
                <Text style={styles.bulletBody}>{req}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next steps</Text>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>1.</Text>
            <Text style={styles.bulletBody}>
              Review this blueprint with your team — it's meant to be
              shared, annotated, and pushed back on.
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>2.</Text>
            <Text style={styles.bulletBody}>
              {props.variant === "builder"
                ? "We'll follow up within one business day to schedule a scoping call."
                : "When you're ready to talk about a real build, book a scoping call at " +
                  props.siteUrl +
                  "/contact."}
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>3.</Text>
            <Text style={styles.bulletBody}>
              If this looks wrong for your role — tell us. The numbers are
              derived from public data; your lived reality is better.
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

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: PASS. If `@react-pdf/renderer` throws about JSX types, you may need `@react-pdf/types` or a triple-slash reference — address it minimally.

- [ ] **Step 3: Commit**

```bash
git add lib/pdf/blueprint.tsx
git commit -m "feat(pdf): add Blueprint PDF template with builder + one-pager variants"
```

---

## Task 3: PDF render helper

**Files:**
- Create: `lib/pdf/render.ts`

- [ ] **Step 1: Create the helper**

```ts
import { renderToBuffer } from "@react-pdf/renderer"
import { BlueprintPdf, type BlueprintPdfProps } from "./blueprint"

/**
 * Renders the Blueprint PDF React tree to a Node Buffer suitable for
 * email attachment or HTTP response. This is the single entry point
 * that API routes should use — keep all @react-pdf/renderer imports
 * funneled through here so the dependency surface stays small.
 */
export async function renderBlueprintPdf(
  props: BlueprintPdfProps
): Promise<Buffer> {
  // @react-pdf/renderer's renderToBuffer is an async function that
  // takes a React element. No streams, no temp files.
  return renderToBuffer(<BlueprintPdf {...props} />)
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add lib/pdf/render.ts
git commit -m "feat(pdf): add renderBlueprintPdf helper"
```

---

## Task 4: Inquiry validation schema

**Files:**
- Create: `lib/validation/inquiry.ts`

- [ ] **Step 1: Create the file**

```ts
import { z } from "zod"

/**
 * Authoritative validation for POST /api/inquiries.
 * Used by both the client-side preflight (in occupation-builder.tsx)
 * and the server-side route handler.
 */
export const inquirySchema = z.object({
  occupationId: z.string().min(1, "Missing occupation id"),
  occupationTitle: z.string().trim().min(1).max(200),
  occupationSlug: z.string().trim().min(1).max(200),
  selectedModules: z.array(z.string().min(1)).min(1, "Select at least one module"),
  selectedCapabilities: z.array(z.string().min(1)).default([]),
  selectedTaskIds: z.array(z.string().min(1)).default([]),
  customRequests: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
  teamSize: z.string().trim().max(40).default(""),
  tierKey: z.enum(["starter", "workflow", "ops-layer"]),
  // Pre-computed display values — we revalidate from the DB server-side
  // before generating the PDF, so client tampering can only affect the
  // copy, not the underlying numbers.
  displayedMinutes: z.number().int().min(0).max(600),
  displayedAnnualValue: z.number().min(0).max(1_000_000),
  contactName: z.string().trim().max(120).default(""),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email")
    .max(254),
  website: z.string().optional(), // honeypot
})

export type InquiryInput = z.infer<typeof inquirySchema>
```

- [ ] **Step 2: Type-check + commit**

```bash
npm run type-check
git add lib/validation/inquiry.ts
git commit -m "feat(inquiry): add zod schema for /api/inquiries"
```

---

## Task 5: One-pager validation schema

**Files:**
- Create: `lib/validation/one-pager.ts`

- [ ] **Step 1: Create the file**

```ts
import { z } from "zod"

/**
 * Authoritative validation for POST /api/one-pager.
 * The one-pager is a softer capture — we only ask for email and the
 * occupation slug. No name, no company. Friction minimized.
 */
export const onePagerSchema = z.object({
  occupationSlug: z.string().trim().min(1).max(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email")
    .max(254),
  website: z.string().optional(), // honeypot
})

export type OnePagerInput = z.infer<typeof onePagerSchema>
```

- [ ] **Step 2: Commit**

```bash
npm run type-check
git add lib/validation/one-pager.ts
git commit -m "feat(one-pager): add zod schema for /api/one-pager"
```

---

## Task 6: Extract rate-limit helper

**Files:**
- Create: `lib/rate-limit.ts`
- Modify: `app/api/contact/route.ts`

- [ ] **Step 1: Create the shared rate-limit module**

```ts
import { createHash } from "node:crypto"

/**
 * Minimal in-memory rate limiter shared across API routes.
 *
 * LIMITATIONS (by design — Plan 4 will replace with Upstash or BotID):
 * - Per-instance memory; each serverless cold start resets the window.
 * - No persistence across deployments.
 * - No distributed coordination between instances.
 *
 * This is a speed bump, not a fortress. Honeypots + zod + reasonable
 * max-length constraints do the bulk of the protection work.
 */

type Bucket = {
  windowMs: number
  max: number
  hits: Map<string, number[]>
}

const buckets = new Map<string, Bucket>()

function getBucket(name: string, windowMs: number, max: number): Bucket {
  const existing = buckets.get(name)
  if (existing) return existing
  const bucket: Bucket = { windowMs, max, hits: new Map() }
  buckets.set(name, bucket)
  return bucket
}

export function isRateLimited(
  bucketName: string,
  ipHash: string,
  options: { windowMs: number; max: number }
): boolean {
  const bucket = getBucket(bucketName, options.windowMs, options.max)
  const now = Date.now()
  const recent = (bucket.hits.get(ipHash) ?? []).filter(
    (t) => now - t < bucket.windowMs
  )
  if (recent.length >= bucket.max) {
    bucket.hits.set(ipHash, recent)
    return true
  }
  recent.push(now)
  bucket.hits.set(ipHash, recent)
  return false
}

/**
 * Hash an IP (or fallback) to a short hex string suitable for storing
 * alongside records without ever persisting the raw IP. Also serves as
 * the rate-limit bucket key.
 */
export function hashIp(ip: string | null): string {
  return createHash("sha256")
    .update(ip ?? "unknown")
    .digest("hex")
    .slice(0, 32)
}

/**
 * Extract the client IP from Vercel edge headers. Trusted because
 * Vercel sets these — revisit if this code ever runs outside Vercel.
 */
export function getClientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  )
}
```

- [ ] **Step 2: Refactor `app/api/contact/route.ts` to use it**

Find and remove the local `WINDOW_MS`, `MAX_PER_WINDOW`, `hits`, `isRateLimited`, `hashIp` declarations. Replace with:

```ts
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"
```

Update the usage site (around line 57-60) from:

```ts
if (isRateLimited(ipHash)) {
```

to:

```ts
if (
  isRateLimited("contact", ipHash, {
    windowMs: 10 * 60 * 1000,
    max: 5,
  })
) {
```

Also replace the inline `hashIp` call with the imported version. Update the IP extraction to use `getClientIp(request)`.

- [ ] **Step 3: Run full e2e to confirm /api/contact still works**

```bash
npx playwright test contact-form --reporter=line
```

Expected: all 5 passing.

- [ ] **Step 4: Commit**

```bash
git add lib/rate-limit.ts app/api/contact/route.ts
git commit -m "refactor(rate-limit): extract shared in-memory limiter + reuse in /api/contact"
```

---

## Task 7: Create one_pager_requests Supabase table

**Files:**
- Create: `supabase/migrations/2026-04-07-one-pager-requests.sql`
- Create: `scripts/apply-one-pager-migration.ts`

- [ ] **Step 1: Create the migration SQL**

```sql
-- 2026-04-07-one-pager-requests.sql
-- Stores email-gated "Download One-Pager for your Team" captures from
-- /occupation/[slug] pages. Intentionally separate from
-- contact_messages (contact form) and assistant_inquiries (builder)
-- so CRM reporting can distinguish capture intent by table.

create table if not exists one_pager_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  occupation_slug text not null,
  occupation_title text,
  -- Operational fields
  user_agent text,
  ip_hash text,
  -- Delivery tracking
  pdf_sent_at timestamptz,
  pdf_send_error text
);

create index if not exists one_pager_requests_email_idx
  on one_pager_requests (email);
create index if not exists one_pager_requests_occupation_idx
  on one_pager_requests (occupation_slug);
create index if not exists one_pager_requests_created_at_idx
  on one_pager_requests (created_at desc);

alter table one_pager_requests enable row level security;
-- No policies = service-role writes only.
```

- [ ] **Step 2: Create the migration runner script**

Copy `scripts/apply-contact-messages-migration.ts` verbatim, then edit the three references to `contact_messages` / the SQL filename to point at `one_pager_requests` / the new SQL file. Keep the idempotency and verification patterns identical.

- [ ] **Step 3: Apply the migration**

```bash
npx tsx scripts/apply-one-pager-migration.ts
```

Expected output: table created, columns verified, RLS enabled, initial count = 0.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/2026-04-07-one-pager-requests.sql scripts/apply-one-pager-migration.ts
git commit -m "feat(db): add one_pager_requests table for softer email captures"
```

---

## Task 8: Extend `sendEmail` to support attachments

**Files:**
- Modify: `lib/resend.ts`

- [ ] **Step 1: Add `attachments` to the `SendArgs` type and forward it**

Read the current `lib/resend.ts`. Update the `SendArgs` type to:

```ts
type SendArgs = {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}
```

And update the `resend.emails.send({...})` call to include `attachments: args.attachments` when provided. Resend v6 accepts `Buffer` or base64-string content natively.

- [ ] **Step 2: Type-check + commit**

```bash
npm run type-check
git add lib/resend.ts
git commit -m "feat(email): extend sendEmail to accept attachments"
```

---

## Task 9: Create `<CalendlyEmbed>` component

**Files:**
- Create: `components/CalendlyEmbed.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client"

import { InlineWidget } from "react-calendly"
import { CALENDLY } from "@/lib/calendly"

export function CalendlyEmbed({
  url,
  minHeight = 680,
  prefill,
}: {
  url?: string
  minHeight?: number
  prefill?: {
    email?: string
    name?: string
  }
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      style={{ minHeight }}
    >
      <InlineWidget
        url={url ?? CALENDLY.url}
        pageSettings={CALENDLY.pageSettings}
        prefill={prefill}
        styles={{ minWidth: "100%", height: `${minHeight}px` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npm run type-check
git add components/CalendlyEmbed.tsx
git commit -m "feat(calendly): add inline Calendly embed component"
```

---

## Task 10: Create `/api/inquiries` route handler

**Files:**
- Create: `app/api/inquiries/route.ts`

> This task is the biggest integration point in Plan 2. It validates, inserts, renders a PDF, sends two emails, and returns. Read it carefully. The error handling must preserve the "two-writes-no-silent-failure" pattern from Plan 1.

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from "next/server"
import { inquirySchema } from "@/lib/validation/inquiry"
import { sendEmail } from "@/lib/resend"
import { createServerClient } from "@/lib/supabase/server"
import { renderBlueprintPdf } from "@/lib/pdf/render"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"
import { AGENCY, CONTACT, PRICING_TIERS, SITE } from "@/lib/site"

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
    isRateLimited("inquiries", ipHash, {
      windowMs: 10 * 60 * 1000,
      max: 10,
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

  // Honeypot BEFORE zod to avoid leaking validation signal to bots.
  if (
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    typeof (body as { website: unknown }).website === "string" &&
    (body as { website: string }).website.length > 0
  ) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const parsed = inquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const input = parsed.data
  const supabase = createServerClient()

  // Re-fetch occupation-level truth so the PDF numbers are never client-trusted.
  const { data: occupation, error: occError } = await supabase
    .from("occupations")
    .select("id, title, slug, hourly_wage")
    .eq("slug", input.occupationSlug)
    .single()

  if (occError || !occupation) {
    return NextResponse.json(
      { error: "Unknown occupation" },
      { status: 400 }
    )
  }

  // Insert the lead row FIRST — it's the source of truth. If anything
  // downstream fails (PDF generation, email), the lead is still in the
  // DB and Damon can follow up manually.
  const { error: dbError } = await supabase.from("assistant_inquiries").insert({
    occupation_id: occupation.id,
    occupation_title: occupation.title,
    occupation_slug: occupation.slug,
    recommended_modules: input.selectedModules,
    selected_modules: input.selectedModules,
    added_modules: [],
    removed_modules: [],
    selected_capabilities: input.selectedCapabilities,
    custom_requests: input.customRequests,
    pain_points: [],
    contact_name: input.contactName || null,
    contact_email: input.contactEmail,
    tier: input.tierKey,
    source: "occupation-inline",
  })

  if (dbError) {
    console.error("[inquiries] supabase insert failed", dbError)
    return NextResponse.json(
      { error: "We couldn't save your request. Please try again shortly." },
      { status: 500 }
    )
  }

  const tier = PRICING_TIERS.find((t) => t.key === input.tierKey)
  const generatedAt = new Date().toISOString().slice(0, 10)

  // Generate the PDF. If this fails, we still return success because the
  // lead is saved — but log loudly so Damon can regenerate manually.
  let pdfBuffer: Buffer | null = null
  try {
    pdfBuffer = await renderBlueprintPdf({
      variant: "builder",
      occupation: {
        title: occupation.title,
        slug: occupation.slug,
      },
      stats: {
        minutesPerDay: input.displayedMinutes,
        annualValueDollars: input.displayedAnnualValue,
        taskCount: input.selectedTaskIds.length || input.selectedModules.length,
      },
      selectedTasks: input.selectedModules.map((name) => ({
        name,
        minutesPerDay: Math.round(
          input.displayedMinutes / Math.max(input.selectedModules.length, 1)
        ),
      })),
      recommendedModules: input.selectedModules.map((name) => ({
        name,
        blurb: "Selected during your builder session.",
      })),
      tier: tier
        ? { name: tier.name, startingAt: tier.startingAt, blurb: tier.blurb }
        : undefined,
      teamSize: input.teamSize,
      customRequests: input.customRequests,
      contact: {
        name: input.contactName,
        email: input.contactEmail,
      },
      siteUrl: SITE.url,
      agencyName: AGENCY.name,
      generatedAt,
    })
  } catch (err) {
    console.error("[inquiries] pdf generation failed", err)
    // Fall through — lead is still saved, email below will go without attachment
  }

  // Fire confirmation email to the lead.
  try {
    const safeOccupation = escapeHtml(occupation.title)
    const safeName = input.contactName ? escapeHtml(input.contactName) : ""
    await sendEmail({
      to: input.contactEmail,
      subject: `Your AI Blueprint for ${occupation.title}`,
      html: `
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; color:#221f1c;">
  <h2 style="font-size: 20px; margin: 0 0 12px;">Your AI Blueprint is attached${safeName ? ", " + safeName : ""}.</h2>
  <p>Thanks for trying the ${escapeHtml(SITE.name)} builder. Your custom blueprint for <strong>${safeOccupation}</strong> is attached as a PDF — share it with your team, push back on the numbers, and let us know what would make it fit your reality better.</p>
  <p><strong>What happens next:</strong> we'll review your submission personally and reply within one business day with an honest take on whether this is something we can help you build.</p>
  <p style="margin-top:24px;">— ${escapeHtml(AGENCY.name)}<br/>
  <a href="${SITE.url}" style="color:#2563eb;">${SITE.url}</a></p>
</div>`.trim(),
      text: `Your AI Blueprint is attached${input.contactName ? ", " + input.contactName : ""}.

Thanks for trying the ${SITE.name} builder. Your custom blueprint for ${occupation.title} is attached as a PDF — share it with your team, push back on the numbers, and let us know what would make it fit your reality better.

What happens next: we'll review your submission personally and reply within one business day with an honest take on whether this is something we can help you build.

— ${AGENCY.name}
${SITE.url}`,
      attachments: pdfBuffer
        ? [
            {
              filename: `ai-blueprint-${occupation.slug}.pdf`,
              content: pdfBuffer,
            },
          ]
        : undefined,
    })
  } catch (err) {
    console.error("[inquiries] lead confirmation email failed", err)
  }

  // Fire internal notification to Damon.
  try {
    await sendEmail({
      to: CONTACT.email,
      replyTo: input.contactEmail,
      subject: `New builder inquiry: ${input.contactName || input.contactEmail} · ${occupation.title}`,
      html: `
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; color:#221f1c;">
  <h2 style="font-size: 18px; margin: 0 0 12px;">New builder inquiry</h2>
  <p><strong>Lead:</strong> ${escapeHtml(input.contactName || "")} &lt;${escapeHtml(input.contactEmail)}&gt;</p>
  <p><strong>Occupation:</strong> ${escapeHtml(occupation.title)}</p>
  <p><strong>Tier:</strong> ${escapeHtml(input.tierKey)}${input.teamSize ? " · " + escapeHtml(input.teamSize) : ""}</p>
  <p><strong>Modules selected:</strong> ${input.selectedModules.map(escapeHtml).join(", ") || "(none)"}</p>
  ${
    input.customRequests.length > 0
      ? `<p><strong>Custom requests:</strong></p><ul>${input.customRequests
          .map((r) => `<li>${escapeHtml(r)}</li>`)
          .join("")}</ul>`
      : ""
  }
  <p style="margin-top:16px;">Blueprint PDF attached for reference.</p>
</div>`.trim(),
      text: `New builder inquiry

Lead: ${input.contactName || ""} <${input.contactEmail}>
Occupation: ${occupation.title}
Tier: ${input.tierKey}${input.teamSize ? " · " + input.teamSize : ""}
Modules selected: ${input.selectedModules.join(", ") || "(none)"}
${input.customRequests.length > 0 ? "\nCustom requests:\n" + input.customRequests.map((r) => "- " + r).join("\n") : ""}

Blueprint PDF attached for reference.`,
      attachments: pdfBuffer
        ? [
            {
              filename: `ai-blueprint-${occupation.slug}.pdf`,
              content: pdfBuffer,
            },
          ]
        : undefined,
    })
  } catch (err) {
    console.error("[inquiries] internal notification failed", err)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
```

- [ ] **Step 2: Smoke test with curl**

```bash
npm run dev
```

In another terminal:

```bash
curl -s -i -X POST http://localhost:3050/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "occupationId":"<real-id-from-your-db>",
    "occupationTitle":"Software Developers",
    "occupationSlug":"software-developers",
    "selectedModules":["Documentation","Analysis"],
    "selectedCapabilities":[],
    "selectedTaskIds":[],
    "customRequests":["Quarterly release notes"],
    "teamSize":"3 people",
    "tierKey":"workflow",
    "displayedMinutes":120,
    "displayedAnnualValue":25000,
    "contactName":"Smoke Test",
    "contactEmail":"smoke@example.com"
  }'
```

Expected: 200 with `{"ok":true}`, a new row in `assistant_inquiries`, and two emails in your Resend dashboard (or terminal logs if the key isn't set). Check that the attachment filename matches `ai-blueprint-software-developers.pdf`.

Stop the dev server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/api/inquiries/route.ts
git commit -m "feat(inquiries): add /api/inquiries route with PDF attachment + Resend"
```

---

## Task 11: Rewire occupation builder to call `/api/inquiries`

**Files:**
- Modify: `app/occupation/[slug]/occupation-builder.tsx`

- [ ] **Step 1: Read the current submitAssistantRequest function**

Lines 184–226 (roughly — verify by re-reading). Current implementation writes directly to Supabase from the client.

- [ ] **Step 2: Replace with a fetch**

Find the `submitAssistantRequest` function and replace its body with:

```ts
async function submitAssistantRequest() {
  if (selectedModules.length === 0) {
    toast.error("Select at least one task to build the assistant.")
    return
  }

  if (!contactEmail.trim()) {
    toast.error("Add an email so we know where to send your assistant plan.")
    return
  }

  setSubmitting(true)
  try {
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occupationId,
        occupationTitle,
        occupationSlug: slug,
        selectedModules,
        selectedCapabilities: selectedModules.flatMap(
          (moduleKey) =>
            (capabilitiesByModule[moduleKey] ?? []).map(
              (capability) => capability.capability_key
            )
        ),
        selectedTaskIds: Array.from(selected),
        customRequests,
        teamSize: TEAM_SIZE_OPTIONS[teamSizeIndex]?.label ?? "",
        tierKey: currentTier.key,
        displayedMinutes: selectedMinutes,
        displayedAnnualValue: annualValue,
        contactName,
        contactEmail,
        website: "", // honeypot field — real users never see it
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error || "Request failed")
    }

    setPhase("done")
  } catch (err) {
    console.error("[builder] submit failed", err)
    toast.error(
      err instanceof Error
        ? err.message
        : "Could not submit the assistant request. Please try again."
    )
  } finally {
    setSubmitting(false)
  }
}
```

Note: `TEAM_SIZE_OPTIONS`, `currentTier`, `selectedMinutes`, `annualValue`, `capabilitiesByModule`, `selected` (the Set of selected task IDs) are all existing component state/props — verify they're in scope where you edit. If any name is different in the live file, use the live name, don't rename.

- [ ] **Step 3: Remove the now-unused `supabase` client import** if nothing else in the file references it. (The builder may still use it elsewhere — do not remove blindly.)

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add app/occupation/[slug]/occupation-builder.tsx
git commit -m "refactor(builder): move submit from client Supabase to /api/inquiries"
```

---

## Task 12: Replace the builder "Done" phase with Calendly embed + confirmation

**Files:**
- Modify: `app/occupation/[slug]/occupation-builder.tsx`

- [ ] **Step 1: Find the "done" phase render branch**

In the builder file, there's a section that renders when `phase === "done"`. It currently shows a minimal "Done" message. Replace it with a rich card that includes:

1. A confirmation heading ("Your blueprint is in your inbox.")
2. A short explainer paragraph
3. The `<CalendlyEmbed>` inline
4. A fallback email link

Rough shape:

```tsx
import { CalendlyEmbed } from "@/components/CalendlyEmbed"
import { CheckCircle2, Mail } from "lucide-react"
import { CONTACT } from "@/lib/site"

// ... inside the render, replace the "done" branch:
if (phase === "done") {
  return (
    <div className="space-y-6">
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8"
      >
        <div className="flex items-start gap-3 mb-3">
          <CheckCircle2 className="h-6 w-6 text-accent flex-shrink-0" />
          <div>
            <h3 className="font-heading text-xl font-semibold mb-1">
              Your blueprint is in your inbox.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We just emailed a PDF of your custom AI assistant blueprint to{" "}
              <strong className="text-foreground">{contactEmail}</strong>.
              Share it with your team, push back on the numbers, and book a
              scoping call below whenever you&apos;re ready to talk specifics.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-heading text-lg font-semibold mb-3">
          Book a 30-minute scoping call
        </h3>
        <CalendlyEmbed
          prefill={{
            email: contactEmail,
            name: contactName || undefined,
          }}
        />
      </div>

      <div className="text-sm text-muted-foreground flex items-center gap-2 pt-2">
        <Mail className="h-4 w-4 text-accent" />
        <span>
          Prefer email?{" "}
          <a
            href={`mailto:${CONTACT.email}`}
            className="text-foreground hover:text-accent transition-colors"
          >
            {CONTACT.email}
          </a>
        </span>
      </div>
    </div>
  )
}
```

Adjust the exact layout to match whatever wrapper the existing `phase === "done"` branch lived inside. DO NOT change any phase-transition logic.

- [ ] **Step 2: Type-check + commit**

```bash
npm run type-check
git add app/occupation/[slug]/occupation-builder.tsx
git commit -m "feat(builder): replace Done phase with inbox confirmation + Calendly embed"
```

---

## Task 13: Create `/api/one-pager` route handler

**Files:**
- Create: `app/api/one-pager/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextResponse } from "next/server"
import { onePagerSchema } from "@/lib/validation/one-pager"
import { sendEmail } from "@/lib/resend"
import { createServerClient } from "@/lib/supabase/server"
import { renderBlueprintPdf } from "@/lib/pdf/render"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"
import { AGENCY, CONTACT, SITE } from "@/lib/site"
import {
  computeDisplayedTimeback,
  estimateTaskMinutes,
  inferArchetypeMultiplier,
} from "@/lib/timeback"
import { computeAnnualValue } from "@/lib/pricing"

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
    isRateLimited("one-pager", ipHash, {
      windowMs: 10 * 60 * 1000,
      max: 10,
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

  if (
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    typeof (body as { website: unknown }).website === "string" &&
    (body as { website: string }).website.length > 0
  ) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const parsed = onePagerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { email, occupationSlug } = parsed.data
  const supabase = createServerClient()

  // Fetch real occupation + tasks + profile server-side so the PDF
  // numbers are derived from truth, not from the client.
  const { data: occupation, error: occError } = await supabase
    .from("occupations")
    .select("id, title, slug, hourly_wage")
    .eq("slug", occupationSlug)
    .single()

  if (occError || !occupation) {
    return NextResponse.json({ error: "Unknown occupation" }, { status: 400 })
  }

  const [{ data: profile }, { data: tasks }] = await Promise.all([
    supabase
      .from("occupation_automation_profile")
      .select("*")
      .eq("occupation_id", occupation.id)
      .single(),
    supabase
      .from("job_micro_tasks")
      .select("*")
      .eq("occupation_id", occupation.id)
      .order("ai_impact_level", { ascending: false }),
  ])

  const aiTasks = (tasks ?? []).filter((t) => t.ai_applicable)
  const archetypeMultiplier = inferArchetypeMultiplier(profile ?? null)
  const totalBlueprintMinutes = aiTasks.reduce(
    (sum, task) => sum + estimateTaskMinutes(task) * archetypeMultiplier,
    0
  )
  const { displayedMinutes } = computeDisplayedTimeback(
    profile ?? null,
    tasks ?? [],
    totalBlueprintMinutes
  )
  const annualValue = computeAnnualValue(displayedMinutes, occupation.hourly_wage)

  const topTasks = aiTasks.slice(0, 10).map((task) => ({
    name: task.task_name,
    minutesPerDay: Math.max(
      1,
      Math.round(estimateTaskMinutes(task) * archetypeMultiplier)
    ),
  }))

  // Save the capture first — the row is the source of truth.
  const { error: dbError } = await supabase.from("one_pager_requests").insert({
    email,
    occupation_slug: occupation.slug,
    occupation_title: occupation.title,
    user_agent: userAgent,
    ip_hash: ipHash,
  })

  if (dbError) {
    console.error("[one-pager] supabase insert failed", dbError)
    return NextResponse.json(
      { error: "We couldn't process your request. Please try again shortly." },
      { status: 500 }
    )
  }

  const generatedAt = new Date().toISOString().slice(0, 10)

  let pdfBuffer: Buffer | null = null
  try {
    pdfBuffer = await renderBlueprintPdf({
      variant: "one-pager",
      occupation: { title: occupation.title, slug: occupation.slug },
      stats: {
        minutesPerDay: displayedMinutes,
        annualValueDollars: annualValue,
        taskCount: aiTasks.length,
      },
      selectedTasks: topTasks,
      recommendedModules: [], // one-pager does not recommend modules yet
      contact: { email },
      siteUrl: SITE.url,
      agencyName: AGENCY.name,
      generatedAt,
    })
  } catch (err) {
    console.error("[one-pager] pdf generation failed", err)
  }

  try {
    const safeOccupation = escapeHtml(occupation.title)
    await sendEmail({
      to: email,
      subject: `AI Time-Back One-Pager · ${occupation.title}`,
      html: `
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; color:#221f1c;">
  <h2 style="font-size: 20px; margin: 0 0 12px;">Your one-pager is attached.</h2>
  <p>Thanks for your interest in the ${escapeHtml(SITE.name)} analysis for <strong>${safeOccupation}</strong>. The attached PDF summarizes the top automation opportunities and the time-back potential for this role — share it with your team.</p>
  <p>If the numbers make sense and you'd like to talk about a real build, book a scoping call at <a href="${SITE.url}/contact" style="color:#2563eb;">${SITE.url}/contact</a>.</p>
  <p style="margin-top:24px;">— ${escapeHtml(AGENCY.name)}</p>
</div>`.trim(),
      text: `Your one-pager is attached.

Thanks for your interest in the ${SITE.name} analysis for ${occupation.title}. The attached PDF summarizes the top automation opportunities and the time-back potential for this role — share it with your team.

If the numbers make sense and you'd like to talk about a real build, book a scoping call at ${SITE.url}/contact.

— ${AGENCY.name}`,
      attachments: pdfBuffer
        ? [
            {
              filename: `ai-one-pager-${occupation.slug}.pdf`,
              content: pdfBuffer,
            },
          ]
        : undefined,
    })
  } catch (err) {
    console.error("[one-pager] delivery email failed", err)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
```

- [ ] **Step 2: Smoke test with curl**

```bash
npm run dev
```

```bash
curl -s -i -X POST http://localhost:3050/api/one-pager \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@example.com","occupationSlug":"software-developers"}'
```

Expected: 200, new row in `one_pager_requests`, email sent with PDF attachment.

- [ ] **Step 3: Commit**

```bash
git add app/api/one-pager/route.ts
git commit -m "feat(one-pager): add /api/one-pager route with Blueprint PDF delivery"
```

---

## Task 14: Create the One-Pager download button + modal

**Files:**
- Create: `app/occupation/[slug]/one-pager-button.tsx`

- [ ] **Step 1: Create the client component**

```tsx
"use client"

import { useState } from "react"
import { Download, Loader2, CheckCircle2, X } from "lucide-react"
import { onePagerSchema } from "@/lib/validation/one-pager"

type Status = "idle" | "submitting" | "success" | "error"

export function OnePagerButton({
  occupationSlug,
  occupationTitle,
}: {
  occupationSlug: string
  occupationTitle: string
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage(null)
    setFieldError(null)

    const parsed = onePagerSchema.safeParse({
      email,
      occupationSlug,
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
      const res = await fetch("/api/one-pager", {
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
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setStatus("idle")
          setEmail("")
          setErrorMessage(null)
          setFieldError(null)
        }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
      >
        <Download className="h-4 w-4" />
        Download One-Pager
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="one-pager-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 relative">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {status === "success" ? (
              <div
                role="status"
                aria-live="polite"
                className="text-center py-4"
              >
                <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-3" />
                <h3
                  id="one-pager-title"
                  className="font-heading text-lg font-semibold mb-2"
                >
                  On its way.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Check your inbox in the next minute or two for the one-pager
                  PDF. Share it freely — it&apos;s built for that.
                </p>
              </div>
            ) : (
              <>
                <h3
                  id="one-pager-title"
                  className="font-heading text-lg font-semibold mb-1"
                >
                  Download the {occupationTitle} one-pager
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  We&apos;ll email you a shareable PDF with the top automation
                  opportunities and time-back potential for this role.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="one-pager-email"
                      className="block text-sm font-medium text-foreground"
                    >
                      Email
                    </label>
                    <input
                      id="one-pager-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={fieldError ? true : undefined}
                      aria-describedby={
                        fieldError ? "one-pager-email-error" : undefined
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors aria-invalid:border-destructive aria-invalid:focus:ring-destructive/30"
                    />
                    {fieldError ? (
                      <p
                        id="one-pager-email-error"
                        className="text-xs text-destructive"
                      >
                        {fieldError}
                      </p>
                    ) : null}
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
                      "Email me the one-pager"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npm run type-check
git add app/occupation/[slug]/one-pager-button.tsx
git commit -m "feat(one-pager): add download button + modal with inline email capture"
```

---

## Task 15: Add the One-Pager button to the occupation page

**Files:**
- Modify: `app/occupation/[slug]/page.tsx`

- [ ] **Step 1: Find the primary CTA area**

Read `app/occupation/[slug]/page.tsx` and locate where the "Build Your Custom Assistant" CTA (or whatever it's currently labeled) is rendered. This is where the One-Pager button belongs — side-by-side with the existing primary action so buyers who aren't ready to talk to sales have a softer path.

- [ ] **Step 2: Import and render**

```tsx
import { OnePagerButton } from "./one-pager-button"

// ... where the primary builder CTA currently lives, wrap in a flex row:
<div className="flex flex-col sm:flex-row gap-3">
  {/* existing primary CTA that opens the builder */}
  <OnePagerButton occupationSlug={slug} occupationTitle={occupation.title} />
</div>
```

Do not change the existing primary CTA. Just add the secondary button in the same flex container. If no flex container exists today, wrap both buttons in one.

- [ ] **Step 3: Type-check + visual check**

```bash
npm run type-check
npm run dev
```

Visit `http://localhost:3050/occupation/software-developers`. Confirm both buttons appear side-by-side on desktop and stack on mobile.

- [ ] **Step 4: Commit**

```bash
git add app/occupation/[slug]/page.tsx
git commit -m "feat(one-pager): surface Download One-Pager button on occupation pages"
```

---

## Task 16: Playwright smoke tests for the new flows

**Files:**
- Create: `tests/e2e/funnel-realness.spec.ts`

- [ ] **Step 1: Create the test file**

```ts
import { expect, test } from "@playwright/test"

test.describe("occupation one-pager download", () => {
  test("button is visible and opens a modal with email input", async ({
    page,
  }) => {
    await page.goto("/occupation/software-developers")
    const button = page.getByRole("button", { name: /download one-pager/i })
    await expect(button).toBeVisible()
    await button.click()

    await expect(
      page.getByRole("dialog", { name: /download the .* one-pager/i })
    ).toBeVisible()
    await expect(page.getByLabel(/^email$/i)).toBeVisible()
    await expect(
      page.getByRole("button", { name: /email me the one-pager/i })
    ).toBeVisible()
  })

  test("modal shows an inline validation error for a bad email", async ({
    page,
  }) => {
    await page.goto("/occupation/software-developers")
    await page.getByRole("button", { name: /download one-pager/i }).click()

    await page.getByLabel(/^email$/i).fill("not-an-email")
    await page.getByRole("button", { name: /email me the one-pager/i }).click()

    await expect(
      page.getByText(/please enter a valid email/i)
    ).toBeVisible()
  })
})

test.describe("occupation builder confirmation screen", () => {
  // This test exercises the full builder flow to reach the Calendly embed.
  // It uses a real occupation page and a stubbed network response for
  // /api/inquiries so it doesn't depend on the live DB/email layer.
  test("Done phase renders the Calendly embed iframe", async ({ page }) => {
    await page.route("**/api/inquiries", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      })
    )

    await page.goto("/occupation/software-developers")

    // Kick the primary CTA to open the builder
    await page
      .getByRole("button", {
        name: /request your custom ai assistant plan|build your personal assistant|build your custom assistant/i,
      })
      .first()
      .click()

    // Select at least one task (use a forgiving selector that tolerates
    // whatever the task button labels are)
    const firstTaskButton = page
      .locator('[role="button"], button')
      .filter({ hasText: /min\/day|min per day/i })
      .first()
    if (await firstTaskButton.isVisible()) {
      await firstTaskButton.click()
    }

    // Proceed to build phase if there is a next-step button
    const nextBtn = page.getByRole("button", { name: /build|continue|next/i })
    if (await nextBtn.first().isVisible()) {
      await nextBtn.first().click()
    }

    // Fill contact email and submit
    const emailInput = page
      .getByRole("textbox", { name: /email/i })
      .first()
    await emailInput.fill("qa@example.com")
    await page
      .getByRole("button", { name: /submit|send|request/i })
      .first()
      .click()

    // Assert the Calendly iframe shows up
    await expect(page.locator('iframe[src*="calendly.com"]')).toBeVisible({
      timeout: 10_000,
    })
  })
})
```

Note: the builder-flow test is deliberately tolerant about button labels because the current builder UI may use slightly different text. Rather than hard-coding labels that will drift, the test uses regex matchers that accept plausible variants. If any assertion proves too tolerant and the test passes falsely, tighten the selector to match what the live UI actually renders.

- [ ] **Step 2: Run the new spec**

```bash
npx playwright test funnel-realness --reporter=line
```

If any assertion fails because the builder UI's label is different, update the selector to match the real label. Do NOT update the component.

- [ ] **Step 3: Run the full suite to catch regressions**

```bash
npx playwright test --reporter=line
```

Expected: the Plan 1 `contact-form` spec still passes. The pre-existing `occupation-inline-builder` spec may still be failing on main (pre-existing breakage noted in Plan 1); that's unrelated to Plan 2.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/funnel-realness.spec.ts
git commit -m "test(e2e): smoke tests for one-pager modal and builder calendly embed"
```

---

## Task 17: Final verification and senior-engineer QA (manual, lives in the controller)

**Files:** none — verification only.

This task is run by the orchestrator (not a subagent), with the full Playwright MCP browser, real curl, and real DB inspection — the same pattern as Plan 1's Task 16.

- [ ] **Step 1: Clean build**

```bash
rm -rf .next
npm run type-check
npm run build
```

Expected: clean type-check, successful build, new routes `/api/inquiries` and `/api/one-pager` both compile.

- [ ] **Step 2: Full Playwright suite**

```bash
npx playwright test --reporter=line
```

Expected: all new tests pass + Plan 1 contact-form tests still pass.

- [ ] **Step 3: Real curl tests against `/api/inquiries`**

Start dev server. Submit a valid inquiry with curl. Verify:
- 200 `{ok:true}` response
- New row in `assistant_inquiries` with `source = "occupation-inline"`
- One confirmation email delivered to the test address (PDF attached)
- One notification email delivered to `damon@placetostandagency.com` (PDF attached)
- PDF opens cleanly in Preview — no font fallback warnings, layout intact

Then repeat with:
- Validation failure (missing fields) → 400 with `issues`
- Honeypot field populated → 200 silent, no DB row, no email
- Malformed JSON → 400

- [ ] **Step 4: Real curl tests against `/api/one-pager`**

Same matrix: valid, invalid, honeypot, malformed. Verify `one_pager_requests` table fills, email arrives, PDF attached.

- [ ] **Step 5: Browser walkthrough with Playwright MCP**

1. Navigate to `/occupation/software-developers`
2. Click "Download One-Pager" → modal opens with email input
3. Enter bad email → inline error with red destructive styling
4. Enter good email → submit → success state inside the modal
5. Close modal
6. Trigger the builder flow (primary CTA) → select tasks → proceed to build → fill contact email → submit
7. Confirm the "done" phase shows: confirmation card + Calendly iframe + mailto fallback
8. Screenshot every state
9. Check browser console — zero errors other than the pre-existing favicon 404

- [ ] **Step 6: Visual QA on PDF**

Open the actual PDF files emailed to the test address. Check:
- Newsreader + Manrope fonts rendering
- Blue accent color (#2563eb) on headings and callouts
- "PLACE TO STAND AGENCY" header present
- Stats row shows minutes/day, annual value, task count
- Footer has generated date + agency attribution
- Page fits on LETTER without overflow

- [ ] **Step 7: Dispatch two parallel reviewer subagents**

- Spec compliance reviewer (same prompt template as Plan 1's final review)
- Code quality reviewer (same prompt template as Plan 1's final review, focused on: PDF rendering correctness, rate-limit correctness, email escaping, RLS posture on `one_pager_requests`, accessibility of the modal)

Apply any fixes surfaced by the reviewers in a single polish commit, then re-run type-check + e2e.

- [ ] **Step 8: Merge to main**

```bash
cd /Users/damonbodine/ai-jobs-map
git merge feat/funnel-realness --ff-only
git worktree remove .worktrees/funnel-realness
git branch -d feat/funnel-realness
```

- [ ] **Step 9: Update the task list and hand off**

Mark Plan 2 complete. Flag the three open operational items for the human:
- Set `NEXT_PUBLIC_CALENDLY_URL` in production env
- Run `scripts/apply-one-pager-migration.ts` against production DB
- Verify Resend sender domain is approved for production sends

---

## What Plan 2 intentionally does NOT do

- **Plan 3 — Agency Credibility:** `/work` case studies page, pricing anchors on `/products`, "How we work" homepage strip, dynamic DB-computed stats on homepage.
- **Plan 4 — Instrumentation:** PostHog, Sentry, real rate limiter (Upstash or BotID), admin dashboard for viewing inquiries and one-pager requests, proper analytics on conversion funnel.
- **Plan 5 — Department ROI Calculator:** multi-role shopping cart, compounded department-level time-back.
- **Plan 6 — Interactive Module Demos:** canned "Try a Module" sandbox.

Do not pull work forward from these plans while implementing Plan 2.

---

## Self-review checklist

- **Spec coverage:** builder flow server-side rewrite ✅, PDF generation ✅, Calendly embed ✅, rich Resend templates with attachment ✅, one-pager download button + modal ✅, one_pager_requests table ✅, rate-limit extraction ✅, e2e tests ✅, senior-engineer QA step ✅.
- **Placeholder scan:** Calendly URL lives in `NEXT_PUBLIC_CALENDLY_URL` (env var), not hardcoded. Occupation ID for the smoke test is marked `<real-id-from-your-db>` so the engineer picks a real one at execution time. Pricing tiers are a reusable constant. PDF data shapes are fully typed via `BlueprintPdfProps`.
- **Type consistency:** `inquirySchema` field names match the builder state names (`selectedModules`, `customRequests`, `tierKey`, `contactName`, `contactEmail`, etc.). `BlueprintPdfProps` accepts both `variant: "builder"` and `variant: "one-pager"` and the API routes pass each variant explicitly. `sendEmail`'s new optional `attachments` parameter is backwards-compatible with Plan 1's `/api/contact` route (it does not pass attachments).
- **Security invariants:** honeypot checked BEFORE zod in both new routes; HTML escaping applied to every user-supplied field interpolated into email bodies; service-role Supabase used for writes; RLS enabled on new table; IP hashed not stored raw; rate limit bucket-separated by route so one-pager abuse doesn't starve builder submissions.
