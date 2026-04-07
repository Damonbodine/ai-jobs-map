# Trust Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the trust layer of the site — legal pages, About rewrite with Place To Stand Agency framing, Contact page with working Resend-backed form, fixed header/footer, and removal of dead code — so the site no longer reads as a prototype and is safe to drive paid traffic to.

**Architecture:** Static server components for legal/marketing pages (no client JS cost), one client component for the contact form, one Next.js Route Handler (`/api/contact`) that validates with zod and sends notifications via Resend. Single source of truth for site metadata in `lib/site.ts` so every page, footer, and email references the same brand/contact info. This is Plan 1 of 4 — it intentionally does not touch the occupation builder email flow (that's Plan 2: Funnel Realness).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind 4, Supabase (already wired), Resend (new), zod (new), Playwright (existing).

**Context this plan assumes you know:**
- Site is deployed to a `*.vercel.app` URL (no custom domain yet). Use `process.env.NEXT_PUBLIC_SITE_URL` with a fallback so nothing breaks.
- Design system: Newsreader (heading) + Manrope (body), warm white + blue accent. Follow existing page patterns in `app/about/page.tsx` for layout.
- Existing components you'll reuse: `FadeIn`, `Stagger`, `StaggerItem` from `components/FadeIn`.
- Resend API key is already in `.env.local` as `RESEND_API_KEY`. You'll need to add `RESEND_FROM_EMAIL` and `CONTACT_NOTIFICATION_EMAIL` too.
- The positioning decision: **Path B — agency funnel.** Every page should read like a small, credible agency (Place To Stand Agency) offering custom AI implementation, with the occupation builder as a discovery tool. Not SaaS self-serve.

**Brand/content constants (pasted verbatim into `lib/site.ts` in Task 1):**
- Agency: **Place To Stand Agency**
- Site name: **AI Jobs Map**
- Contact email: **damon@placetostandagency.com** (same address for public-facing + internal lead notifications)
- Production URL: `https://ai-jobs-map.vercel.app` (placeholder — swap when custom domain ships)
- Proof point (for About + Footer): *"Built an internal AI assistant for Valise that reclaimed 15 hours/week from their operations team."*

---

## File Structure

**Create:**
- `lib/site.ts` — brand/contact/URL constants
- `lib/resend.ts` — lazy Resend client singleton + typed send helper
- `lib/validation/contact.ts` — zod schema for contact form
- `app/terms/page.tsx` — Terms of Service (static)
- `app/privacy/page.tsx` — Privacy Policy (static)
- `app/security/page.tsx` — Trust & Security page (static; enterprise-buyer trust signals)
- `app/contact/page.tsx` — Contact page (server component; hero + imports form)
- `app/contact/contact-form.tsx` — Client form component
- `app/api/contact/route.ts` — POST handler: validate → Supabase insert → Resend notification
- `supabase/migrations/2026-04-06-contact-messages.sql` — new `contact_messages` table
- `tests/e2e/contact-form.spec.ts` — Playwright smoke test for `/contact`

**Modify:**
- `app/layout.tsx:20-24` — real metadata (title template, description, metadataBase, openGraph)
- `app/about/page.tsx` — rewrite with Place To Stand framing + Valise proof + founder voice
- `components/layout/Header.tsx:82-87` and `116-122` — replace broken `href="#"` Sign In with `href="/contact"` "Book a Call" (desktop + mobile)
- `components/layout/Footer.tsx` — replace Legal column with **Trust** column (Terms, Privacy, **Security**), Company column gets About + Contact, add agency attribution line

**Delete:**
- `app/factory/page.tsx` — dead redirect page (confirmed: only function is to redirect to `/blueprint/:slug` or `/browse`; no other code references it)

---

## Task 1: Install dependencies and create site constants

**Files:**
- Modify: `package.json`
- Create: `lib/site.ts`

- [ ] **Step 1: Install runtime dependencies**

Run from repo root:

```bash
npm install resend zod
```

Expected: both added to `dependencies` in `package.json`. Confirm versions are current (resend ≥4.x, zod ≥3.23.x).

- [ ] **Step 2: Create `lib/site.ts` with brand constants**

Create file `lib/site.ts` with this exact content:

```ts
/**
 * Single source of truth for brand, contact, and URL metadata.
 * Every page, footer, email template, and API route must import from here —
 * NEVER hardcode these values elsewhere. If you need to change the agency
 * name or contact email, this is the only file you edit.
 */

export const SITE = {
  name: "AI Jobs Map",
  tagline: "Task-level AI analysis for 800+ occupations",
  description:
    "Discover how AI can save time in your specific occupation. Task-level analysis grounded in Bureau of Labor Statistics and O*NET data, delivered as a concrete implementation plan by Place To Stand Agency.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://ai-jobs-map.vercel.app",
} as const

export const AGENCY = {
  name: "Place To Stand Agency",
  shortName: "Place To Stand",
  url: "https://placetostandagency.com",
  tagline: "We build custom AI systems for knowledge-work teams.",
} as const

export const CONTACT = {
  // Single email for public-facing address AND internal lead notifications.
  email: "damon@placetostandagency.com",
  replyTo: "damon@placetostandagency.com",
} as const

/**
 * Proof points used across About, Footer, and case study previews.
 * These are real engagements — update only when the underlying work changes.
 */
export const PROOF_POINTS = [
  {
    client: "Valise",
    outcome: "Reclaimed 15 hours/week from their operations team",
    shortLabel: "Valise — 15 hrs/week reclaimed",
  },
] as const
```

- [ ] **Step 3: Add new env var names to `.env.local.example`** (if it exists; otherwise skip)

Check if `.env.local.example` exists. If yes, append:

```
# Resend (transactional email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=notifications@placetostandagency.com
NEXT_PUBLIC_SITE_URL=https://ai-jobs-map.vercel.app
```

If no `.env.local.example` exists, create one with the full list of env vars Plan 1 uses (these three plus whatever is already in the running `.env.local`).

- [ ] **Step 4: Verify the user's `.env.local` has the needed keys**

Remind the human reviewing this plan to ensure `.env.local` contains:
- `RESEND_API_KEY=re_xxx` (user has already added this)
- `RESEND_FROM_EMAIL=notifications@placetostandagency.com` — **must be a verified sender in Resend**. If the domain isn't verified yet, use `onboarding@resend.dev` as a temporary fallback for local testing.
- `NEXT_PUBLIC_SITE_URL=http://localhost:3050` (dev) or the real vercel.app URL (prod)

This is a human verification step — no code changes. Do not proceed to Task 2 until confirmed.

- [ ] **Step 5: Type-check**

```bash
npm run type-check
```

Expected: PASS with zero errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/site.ts .env.local.example
git commit -m "chore: add resend/zod deps and site constants for trust foundation"
```

---

## Task 2: Create Resend client helper

**Files:**
- Create: `lib/resend.ts`

- [ ] **Step 1: Create `lib/resend.ts`**

```ts
import { Resend } from "resend"
import { CONTACT } from "@/lib/site"

/**
 * Lazy singleton — the Resend SDK reads process.env once at construction, so
 * we defer instantiation until first use. This also prevents build-time
 * failures when the API key isn't present in static analysis contexts.
 */
let client: Resend | null = null

function getClient(): Resend {
  if (client) return client
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env.local or your Vercel env."
    )
  }
  client = new Resend(key)
  return client
}

type SendArgs = {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
}

/**
 * Thin wrapper so every call site uses the same From address and surfaces
 * errors consistently. Always pass both `html` and `text` — some clients
 * (and spam filters) will downgrade HTML-only messages.
 */
export async function sendEmail(args: SendArgs): Promise<void> {
  const from =
    process.env.RESEND_FROM_EMAIL ||
    `AI Jobs Map <onboarding@resend.dev>` // dev fallback only
  const resend = getClient()
  const { error } = await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo ?? CONTACT.replyTo,
  })
  if (error) {
    // Surface the full error to the server logs — do NOT swallow it.
    // API routes that call this should catch and return a 500 to the client
    // without leaking the message.
    console.error("[resend] send failed", error)
    throw new Error(`Resend send failed: ${error.message}`)
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/resend.ts
git commit -m "feat(email): add Resend client singleton with sendEmail helper"
```

---

## Task 3: Delete dead factory page

**Files:**
- Delete: `app/factory/page.tsx`

- [ ] **Step 1: Confirm nothing links to `/factory`**

```bash
grep -r "/factory" app components lib --include="*.ts" --include="*.tsx"
```

Expected: zero matches (or only matches inside `app/factory/page.tsx` itself). If any other file references `/factory`, STOP and report the references — they need to be updated first.

- [ ] **Step 2: Delete the file**

```bash
rm app/factory/page.tsx
```

- [ ] **Step 3: Remove the empty directory if Next still tries to build it**

```bash
rmdir app/factory 2>/dev/null || true
```

- [ ] **Step 4: Build to confirm nothing broke**

```bash
npm run build
```

Expected: successful build. No 404 warnings for `/factory`.

- [ ] **Step 5: Commit**

```bash
git add app/factory
git commit -m "chore: remove dead /factory redirect page"
```

---

## Task 4: Fix Header — replace broken Sign In with Book a Call

**Files:**
- Modify: `components/layout/Header.tsx:82-87` (desktop) and `116-122` (mobile)

- [ ] **Step 1: Replace desktop Sign In link**

In `components/layout/Header.tsx`, find this block (around lines 82–87):

```tsx
          <Link
            href="#"
            className="text-sm font-semibold border border-foreground text-foreground px-4 py-1.5 rounded-lg hover:bg-foreground hover:text-background transition-colors"
          >
            Sign In
          </Link>
```

Replace with:

```tsx
          <Link
            href="/contact"
            className="text-sm font-semibold bg-foreground text-background px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Book a Call
          </Link>
```

Note the style change: solid button (primary CTA) instead of outline, because this is now the main conversion action in the nav.

- [ ] **Step 2: Replace mobile Sign In link**

In the same file, find the mobile nav block (around lines 116–122):

```tsx
            <Link
              href="#"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2.5 text-sm font-semibold border border-foreground text-foreground rounded-lg active:opacity-80 transition-opacity"
            >
              Sign In
            </Link>
```

Replace with:

```tsx
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2.5 text-sm font-semibold bg-foreground text-background rounded-lg active:opacity-80 transition-opacity"
            >
              Book a Call
            </Link>
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 4: Manual smoke check**

```bash
npm run dev
```

Open `http://localhost:3050`. Confirm:
- Desktop header shows "Book a Call" as a solid button
- Clicking it navigates to `/contact` (which will 404 until Task 8 — that's expected)
- Mobile nav (resize to <640px) shows the same button

- [ ] **Step 5: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "fix(header): replace broken Sign In link with Book a Call CTA"
```

---

## Task 5: Rewrite About page with Place To Stand framing

**Files:**
- Modify: `app/about/page.tsx` (full replacement)

- [ ] **Step 1: Replace the full file contents**

Replace `app/about/page.tsx` with:

```tsx
import Link from "next/link"
import { Database, Brain, Target, Users, ArrowRight } from "lucide-react"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { AGENCY, PROOF_POINTS, SITE } from "@/lib/site"

export const metadata = {
  title: `About — ${SITE.name}`,
  description: `${SITE.name} is built by ${AGENCY.name}. Task-level AI analysis grounded in real occupational data from the BLS and O*NET, delivered as concrete implementation plans.`,
}

const INFO_SECTIONS = [
  {
    icon: Database,
    title: "Built on Real Data",
    body: "Our analysis starts with the Bureau of Labor Statistics occupation database (800+ occupations) and O*NET task data from the Department of Labor. Every time-back estimate is derived from actual task descriptions, not guesswork.",
  },
  {
    icon: Brain,
    title: "Task-Level Analysis",
    body: "Instead of broad predictions, we break each occupation into micro-tasks and score them individually for AI applicability, impact, and implementation effort.",
  },
  {
    icon: Target,
    title: "Actionable Blueprints",
    body: "For every occupation, we generate an agent blueprint — a concrete plan for which AI agents to deploy, what tools they need, and how they coordinate. Not theory: a system you can actually build.",
  },
  {
    icon: Users,
    title: "Human-Centered Approach",
    body: "AI should augment your work, not replace you. Our blueprints identify tasks where AI excels and where human judgment remains essential — including explicit checkpoints where people stay in the loop.",
  },
]

export default function AboutPage() {
  const valise = PROOF_POINTS[0]

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <FadeIn>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
          A project by {AGENCY.name}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          We help teams build AI systems that actually ship.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          {SITE.name} is the research arm of {AGENCY.name} — a small studio that
          designs and implements custom AI systems for knowledge-work teams. We
          built this site because every engagement starts with the same
          question: <em>where, concretely, is the time?</em> Now you can answer
          that question for your role in under a minute, and — if the numbers
          make sense — talk to us about building the system.
        </p>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 mb-12">
          <p className="text-xs uppercase tracking-[0.14em] text-accent font-semibold mb-2">
            Recent work
          </p>
          <p className="font-heading text-lg font-semibold mb-1">
            {valise.client}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {valise.outcome}. We mapped their operations team's week, built a
            task-level blueprint like the ones on this site, then implemented
            the system end-to-end.
          </p>
        </div>
      </FadeIn>

      <Stagger className="space-y-8 mb-12" staggerDelay={0.1}>
        {INFO_SECTIONS.map(({ icon: Icon, title, body }) => (
          <StaggerItem key={title}>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold mb-1">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn delay={0.5}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-10">
          <h2 className="font-heading text-xl font-semibold mb-3">
            Our Methodology
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Each occupation&apos;s automation profile combines multiple signals:
              O*NET task descriptions and their AI applicability scores, ability
              requirements (physical vs cognitive), knowledge domains, and work
              activity patterns.
            </p>
            <p>
              The composite score (0–100) reflects overall AI readiness.
              Time-back estimates are given as conservative-to-optimistic
              ranges, broken down by work block (intake, analysis,
              documentation, coordination, etc.).
            </p>
            <p>
              We classify occupations by archetype — desk/digital, mixed, or
              physical — with corresponding multipliers that account for the
              practical limits of AI in non-desk work.
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.6}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-10">
          <h2 className="font-heading text-xl font-semibold mb-3">
            How we work
          </h2>
          <ol className="text-sm text-muted-foreground leading-relaxed space-y-3 list-decimal list-inside">
            <li>
              <strong className="text-foreground">Discover.</strong> We use
              this site (and a 45-min call) to map where your team's time
              actually goes.
            </li>
            <li>
              <strong className="text-foreground">Blueprint.</strong> You get a
              concrete implementation plan — tools, integrations, human
              checkpoints, and an honest ROI estimate. No fluff.
            </li>
            <li>
              <strong className="text-foreground">Build.</strong> We implement
              the system with your team. Weekly demos, real code, no vendor
              lock-in.
            </li>
            <li>
              <strong className="text-foreground">Support.</strong> Ongoing
              tuning, monitoring, and improvements once you're live.
            </li>
          </ol>
        </div>
      </FadeIn>

      <FadeIn delay={0.7}>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
          >
            Explore Occupations
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Book a scoping call
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </FadeIn>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 3: Visual check**

```bash
npm run dev
```

Visit `http://localhost:3050/about`. Confirm:
- "A project by Place To Stand Agency" kicker renders above the h1
- New h1: "We help teams build AI systems that actually ship."
- Valise proof-point card renders with accent-colored border
- "How we work" 4-step section renders below methodology
- Both CTAs at bottom (Explore + Book a scoping call) are styled correctly

- [ ] **Step 4: Commit**

```bash
git add app/about/page.tsx
git commit -m "feat(about): rewrite with Place To Stand agency framing and Valise proof"
```

---

## Task 6: Create Terms of Service page

**Files:**
- Create: `app/terms/page.tsx`

> **Legal disclaimer:** The copy below is a sample draft for an early-stage agency lead-gen site. It is NOT legal advice. Before driving significant paid traffic or claiming compliance, run it past an attorney. It is deliberately short, honest about what the site does, and avoids claims (warranties, SLAs, etc.) that don't apply yet.

- [ ] **Step 1: Create the file**

```tsx
import { FadeIn } from "@/components/FadeIn"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export const metadata = {
  title: `Terms of Service — ${SITE.name}`,
  description: `Terms of Service for ${SITE.name}, a project by ${AGENCY.name}.`,
}

const LAST_UPDATED = "April 6, 2026"

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <FadeIn>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose prose-sm max-w-none text-sm text-muted-foreground leading-relaxed space-y-6">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              1. Who we are
            </h2>
            <p>
              {SITE.name} (“the Site”) is operated by {AGENCY.name} (“we”,
              “us”). The Site provides task-level AI automation research based
              on publicly available occupational data (Bureau of Labor
              Statistics, O*NET) and is offered as a lead-generation and
              research tool for our custom AI implementation services.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              2. Acceptable use
            </h2>
            <p>
              You agree to use the Site only for lawful purposes. You will not:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                Scrape, crawl, or bulk-download the Site's content for
                commercial redistribution.
              </li>
              <li>
                Attempt to reverse engineer, probe, or disrupt the Site's
                infrastructure.
              </li>
              <li>
                Submit false, misleading, or abusive content through any form
                on the Site.
              </li>
              <li>
                Use the Site to build, train, or fine-tune any AI model
                without written permission.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              3. The information we provide is research, not advice
            </h2>
            <p>
              Time-back estimates, occupation scores, and AI capability
              recommendations on the Site are research outputs derived from
              public datasets and our own analysis. They are intended as a
              starting point for conversation, not as professional, legal,
              financial, or employment advice. Actual results depend on your
              specific workflow, team, tooling, and implementation quality.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              4. Your submissions
            </h2>
            <p>
              When you submit the contact form or the occupation builder, you
              give us permission to contact you about your inquiry and to use
              the information you submitted to prepare a response or proposal.
              We will not publicly share what you submitted without your
              permission. See our{" "}
              <a href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </a>{" "}
              for details on data handling.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              5. Intellectual property
            </h2>
            <p>
              The Site's design, code, analysis, and written content are
              owned by {AGENCY.name} unless otherwise noted. Underlying
              occupational data is sourced from public government datasets and
              is used in accordance with their respective terms. You may share
              links to Site pages and quote short excerpts with attribution.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              6. No warranty
            </h2>
            <p>
              The Site is provided on an “as-is” and “as-available” basis. We
              make no warranties, express or implied, about the accuracy,
              completeness, or fitness of the Site's content for any
              particular purpose. To the fullest extent permitted by law, we
              disclaim all liability for damages arising from your use of the
              Site.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              7. Changes
            </h2>
            <p>
              We may update these Terms from time to time. The “Last updated”
              date at the top of this page reflects the most recent change.
              Continued use of the Site after an update constitutes acceptance
              of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              8. Contact
            </h2>
            <p>
              Questions about these Terms? Email us at{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>
              .
            </p>
          </section>
        </div>
      </FadeIn>
    </div>
  )
}
```

- [ ] **Step 2: Visual check**

```bash
npm run dev
```

Visit `http://localhost:3050/terms`. Confirm page renders with all 8 sections, date, and a working mailto link at the bottom.

- [ ] **Step 3: Commit**

```bash
git add app/terms/page.tsx
git commit -m "feat(legal): add Terms of Service page"
```

---

## Task 7: Create Privacy Policy page

**Files:**
- Create: `app/privacy/page.tsx`

> **Legal disclaimer:** Same as Task 6 — this is a sample draft. The policy reflects the site's actual data practices as of Plan 1: Supabase as the database, Resend as the email processor, no third-party analytics yet, no user accounts, no payments. When Plan 4 adds PostHog and Plan 2 adds richer email flows, you'll need to update this file.

- [ ] **Step 1: Create the file**

```tsx
import { FadeIn } from "@/components/FadeIn"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export const metadata = {
  title: `Privacy Policy — ${SITE.name}`,
  description: `How ${SITE.name} collects, uses, and protects your information.`,
}

const LAST_UPDATED = "April 6, 2026"

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <FadeIn>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose prose-sm max-w-none text-sm text-muted-foreground leading-relaxed space-y-6">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              Summary
            </h2>
            <p>
              {SITE.name} is operated by {AGENCY.name}. We collect only the
              information you voluntarily give us through our contact form or
              occupation builder. We use it to respond to your inquiry. We
              don't sell it, we don't use it for advertising, and we keep it
              only as long as we need it to do business with you.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              1. What we collect
            </h2>
            <p>We collect the following information, and only this:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong className="text-foreground">Contact form
                submissions:</strong> your name, email address, optional
                company name, and your message.
              </li>
              <li>
                <strong className="text-foreground">Occupation builder
                submissions:</strong> the occupation you selected, the tasks
                and modules you toggled, your team size, any custom requests
                you typed, and your name and email.
              </li>
              <li>
                <strong className="text-foreground">Server logs:</strong>{" "}
                standard request metadata (IP address, user agent, timestamp,
                referring URL) retained for up to 30 days for security and
                debugging purposes.
              </li>
            </ul>
            <p className="mt-2">
              We do <em>not</em> use cookies for tracking, advertising, or
              analytics on this Site as of the “Last updated” date above.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              2. How we use it
            </h2>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>To respond to your inquiry or scoping request.</li>
              <li>
                To prepare a proposal, blueprint, or implementation plan for
                you.
              </li>
              <li>
                To send you relevant follow-up about your specific engagement.
                We do not send marketing newsletters from this Site.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              3. Who we share it with
            </h2>
            <p>
              We share your information only with the service providers we use
              to operate the Site:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong className="text-foreground">Supabase</strong> — stores
                form submissions in an encrypted Postgres database.
              </li>
              <li>
                <strong className="text-foreground">Resend</strong> — delivers
                transactional email (confirmations, notifications).
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> — hosts
                and serves the Site.
              </li>
            </ul>
            <p className="mt-2">
              Each of these providers processes data under their own terms and
              security controls. We do not sell your information to anyone,
              ever.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              4. How long we keep it
            </h2>
            <p>
              We keep form submissions for as long as it takes to respond to
              your inquiry and complete any engagement that follows. You can
              ask us to delete your data at any time by emailing{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>
              . We'll delete it within 30 days and confirm when it's done.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              5. Your rights
            </h2>
            <p>
              Depending on where you live, you may have rights under laws like
              GDPR (EU/UK) or CCPA (California) to access, correct, delete, or
              port your data. To exercise any of these rights, email{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>
              . We'll respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              6. Security
            </h2>
            <p>
              We use industry-standard encryption in transit (HTTPS) and at
              rest (Supabase managed Postgres). No system is perfectly secure,
              but we take reasonable care to protect your information and will
              notify you promptly if we learn of a breach affecting your data.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              7. Children
            </h2>
            <p>
              This Site is not directed to children under 16, and we do not
              knowingly collect information from them. If you believe a child
              has submitted information to us, please email{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>{" "}
              and we'll delete it.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              8. Changes
            </h2>
            <p>
              We'll update this policy when our data practices change. The
              “Last updated” date at the top reflects the most recent change.
              For material changes, we'll note them on the homepage for at
              least 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
              9. Contact
            </h2>
            <p>
              Questions about privacy? Email{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>
              .
            </p>
          </section>
        </div>
      </FadeIn>
    </div>
  )
}
```

- [ ] **Step 2: Visual check**

Visit `http://localhost:3050/privacy`. Confirm all 9 sections render and the mailto links work.

- [ ] **Step 3: Commit**

```bash
git add app/privacy/page.tsx
git commit -m "feat(legal): add Privacy Policy page"
```

---

## Task 8: Create contact_messages Supabase table

**Files:**
- Create: `supabase/migrations/2026-04-06-contact-messages.sql`

- [ ] **Step 1: Check existing migrations directory convention**

```bash
ls supabase/migrations 2>/dev/null || ls supabase 2>/dev/null || echo "NO_MIGRATIONS_DIR"
```

If no `supabase/migrations` directory exists yet, create it. If the project uses a different migration tool (check `package.json` scripts for `db:*` commands and `scripts/` directory), follow THAT convention instead of creating a new one. The `package.json` already has `db:seed`; look at `scripts/seed-occupations.ts` to see how DB access is done.

- [ ] **Step 2: Create the migration SQL**

```sql
-- 2026-04-06-contact-messages.sql
-- Stores submissions from the /contact page form.
-- Separate from assistant_inquiries (which is for occupation-builder leads)
-- so the two lead sources stay cleanly partitioned for CRM reporting.

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  source text not null default 'contact-page',
  -- Operational fields
  user_agent text,
  ip_hash text, -- sha256 of IP, never the raw IP
  -- Lifecycle
  responded_at timestamptz,
  responded_by text
);

create index if not exists contact_messages_created_at_idx
  on contact_messages (created_at desc);

create index if not exists contact_messages_email_idx
  on contact_messages (email);

-- RLS: nobody reads from the client; only the server-side service role key
-- (used in /api/contact) writes. Lock it down.
alter table contact_messages enable row level security;

-- No policies = no client access. Intentional.
```

- [ ] **Step 3: Apply the migration**

The exact command depends on your Supabase setup. Most likely one of:

```bash
# If using Supabase CLI
supabase db push

# Or if using psql directly against the DB URL
psql "$SUPABASE_DB_URL" -f supabase/migrations/2026-04-06-contact-messages.sql
```

If neither is wired up, check `scripts/seed-occupations.ts` to see how the project connects to the DB and run the SQL through whatever pattern that script uses. Report back if unclear — do not guess.

- [ ] **Step 4: Verify the table exists**

Through the Supabase dashboard or psql:

```sql
select column_name, data_type from information_schema.columns
where table_name = 'contact_messages';
```

Expected: rows for id, created_at, name, email, company, message, source, user_agent, ip_hash, responded_at, responded_by.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/2026-04-06-contact-messages.sql
git commit -m "feat(db): add contact_messages table for /contact form submissions"
```

---

## Task 9: Create contact form validation schema

**Files:**
- Create: `lib/validation/contact.ts`

- [ ] **Step 1: Create the file**

```ts
import { z } from "zod"

/**
 * Single source of truth for contact form validation. Used by:
 * - app/contact/contact-form.tsx (client-side preflight)
 * - app/api/contact/route.ts (authoritative server-side validation)
 *
 * Never trust client-side validation alone. The server revalidates.
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(120, "Name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(254, "Email is too long"),
  company: z
    .string()
    .trim()
    .max(200, "Company name is too long")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please include a few details about what you're looking to build")
    .max(5000, "Message is too long (max 5000 characters)"),
  // Honeypot: real users leave it empty. Bots fill every field.
  // If this has ANY value, silently succeed but don't do anything.
  website: z.string().max(0).optional().or(z.literal("")),
})

export type ContactFormInput = z.infer<typeof contactFormSchema>
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/validation/contact.ts
git commit -m "feat(contact): add zod schema with honeypot for contact form"
```

---

## Task 10: Create /api/contact route handler

**Files:**
- Create: `app/api/contact/route.ts`

- [ ] **Step 1: Read the existing Supabase server client for pattern reference**

```bash
cat lib/supabase/server.ts 2>/dev/null || find lib -name "*.ts" | xargs grep -l "createClient" 2>/dev/null
```

Use whatever pattern the rest of the codebase uses for server-side Supabase access. If the project uses a service-role client for privileged writes, use that. If it uses anon key only, you'll need to add a service-role client (create `lib/supabase/admin.ts` if needed) — but FIRST check what exists. Do not duplicate.

- [ ] **Step 2: Create the route handler**

Adjust the Supabase import to match the pattern you found in Step 1. This template assumes a `createAdminClient()` helper exists in `lib/supabase/admin.ts`; if it's named differently, update the import.

```ts
import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { contactFormSchema } from "@/lib/validation/contact"
import { sendEmail } from "@/lib/resend"
import { CONTACT, AGENCY, SITE } from "@/lib/site"
// Adjust this import to match your project's server Supabase helper.
// If you don't have a service-role helper yet, create one in lib/supabase/admin.ts.
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

// Minimal in-memory rate limit: 5 submissions per IP per 10 minutes.
// This resets on every cold start — good enough as a speed bump against
// casual abuse. For real protection, add Vercel BotID or upstash ratelimit
// in Plan 4 (instrumentation).
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function isRateLimited(ipHash: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ipHash) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ipHash, recent)
    return true
  }
  recent.push(now)
  hits.set(ipHash, recent)
  return false
}

function hashIp(ip: string | null): string {
  return createHash("sha256")
    .update(ip ?? "unknown")
    .digest("hex")
    .slice(0, 32)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  const ipHash = hashIp(ip)
  const userAgent = request.headers.get("user-agent") ?? null

  if (isRateLimited(ipHash)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  const parsed = contactFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  // Honeypot: if `website` is non-empty, pretend success but do nothing.
  // This is intentional — we don't want bots learning they were detected.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const { name, email, company, message } = parsed.data

  // Insert into Supabase
  const supabase = createAdminClient()
  const { error: dbError } = await supabase.from("contact_messages").insert({
    name,
    email,
    company: company || null,
    message,
    source: "contact-page",
    user_agent: userAgent,
    ip_hash: ipHash,
  })

  if (dbError) {
    console.error("[contact] supabase insert failed", dbError)
    return NextResponse.json(
      { error: "We couldn't save your message. Please try again shortly." },
      { status: 500 }
    )
  }

  // Notify damon@placetostandagency.com via Resend
  try {
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeCompany = company ? escapeHtml(company) : ""
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>")
    await sendEmail({
      to: CONTACT.email,
      replyTo: email,
      subject: `New contact: ${name}${company ? ` (${company})` : ""}`,
      html: `
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px;">
  <h2 style="font-size: 18px; margin: 0 0 12px;">New contact form submission</h2>
  <p style="margin: 0 0 8px;"><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
  ${safeCompany ? `<p style="margin: 0 0 8px;"><strong>Company:</strong> ${safeCompany}</p>` : ""}
  <p style="margin: 16px 0 8px;"><strong>Message:</strong></p>
  <div style="padding: 12px; background: #f7f5f0; border-radius: 8px; border-left: 3px solid #2563eb;">
    ${safeMessage}
  </div>
  <p style="margin: 24px 0 0; font-size: 12px; color: #777;">
    Submitted via ${SITE.name} — ${AGENCY.name}
  </p>
</div>
      `.trim(),
      text: `New contact form submission

From: ${name} <${email}>
${company ? `Company: ${company}\n` : ""}
Message:
${message}

Submitted via ${SITE.name} — ${AGENCY.name}`,
    })
  } catch (err) {
    // DB already succeeded — the message is saved even if email failed.
    // Log loudly so we can follow up manually and fix Resend config.
    console.error("[contact] resend notification failed", err)
    // Do NOT fail the request; the user's message was saved. We'll see it
    // in Supabase even if the email didn't go.
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
```

- [ ] **Step 3: If `lib/supabase/admin.ts` doesn't exist, create it**

Only do this if Step 1 confirmed there is no existing admin/service-role Supabase client. Otherwise, skip.

```ts
// lib/supabase/admin.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client for privileged server-side writes.
 * NEVER import this from a client component — it uses the secret
 * SUPABASE_SERVICE_ROLE_KEY which must never reach the browser.
 */
let adminClient: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    )
  }
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return adminClient
}
```

Confirm `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`. If not, pull it from Supabase dashboard → Project Settings → API → `service_role` key and add it.

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 5: Manual smoke test via curl**

Start the dev server in one terminal:

```bash
npm run dev
```

In another terminal:

```bash
curl -i -X POST http://localhost:3050/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "company":"Test Co",
    "message":"This is a smoke test from curl to verify the endpoint works end to end."
  }'
```

Expected:
- HTTP 200 with body `{"ok":true}`
- New row visible in Supabase `contact_messages` table
- Email arrives at damon@placetostandagency.com within ~10 seconds

Now test validation failure:

```bash
curl -i -X POST http://localhost:3050/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"x","email":"bad","message":"too short"}'
```

Expected: HTTP 400 with `issues` field containing per-field errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/contact/route.ts lib/supabase/admin.ts
git commit -m "feat(contact): add /api/contact route handler with zod + Resend"
```

---

## Task 11: Create /contact page and form

**Files:**
- Create: `app/contact/page.tsx`
- Create: `app/contact/contact-form.tsx`

- [ ] **Step 1: Create the contact form client component**

```tsx
// app/contact/contact-form.tsx
"use client"

import { useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"
import { contactFormSchema } from "@/lib/validation/contact"

type Status = "idle" | "submitting" | "success" | "error"

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "email" | "company" | "message", string>>
  >({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""), // honeypot
    }

    // Client-side preflight — fast feedback. Server revalidates authoritatively.
    const parsed = contactFormSchema.safeParse(data)
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors
      setFieldErrors({
        name: flat.name?.[0],
        email: flat.email?.[0],
        company: flat.company?.[0],
        message: flat.message?.[0],
      })
      setStatus("idle")
      return
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setErrorMessage(
            "Too many requests. Please try again in a few minutes."
          )
        } else if (body?.issues) {
          setFieldErrors({
            name: body.issues.name?.[0],
            email: body.issues.email?.[0],
            company: body.issues.company?.[0],
            message: body.issues.message?.[0],
          })
        } else {
          setErrorMessage(
            body?.error ||
              "Something went wrong on our end. Please email us directly."
          )
        }
        setStatus("error")
        return
      }

      setStatus("success")
    } catch {
      setErrorMessage(
        "Network error. Please check your connection and try again."
      )
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-4" />
        <h2 className="font-heading text-xl font-semibold mb-2">
          Message received
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          Thanks for reaching out. We read every message personally and will
          get back to you within one business day — usually much faster.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Honeypot — hidden from humans, irresistible to bots */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label>
          Website (leave empty)
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <Field
        label="Your name"
        name="name"
        type="text"
        required
        autoComplete="name"
        error={fieldErrors.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        error={fieldErrors.email}
      />
      <Field
        label="Company (optional)"
        name="company"
        type="text"
        autoComplete="organization"
        error={fieldErrors.company}
      />

      <div className="space-y-1.5">
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-foreground"
        >
          What are you trying to build?
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          minLength={10}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
          placeholder="Tell us about your team, the workflow you'd like to automate, and any constraints we should know about."
        />
        {fieldErrors.message ? (
          <p className="text-xs text-red-600">{fieldErrors.message}</p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send message"
        )}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type,
  required,
  autoComplete,
  error,
}: {
  label: string
  name: string
  type: string
  required?: boolean
  autoComplete?: string
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={`contact-${name}`}
        className="block text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <input
        id={`contact-${name}`}
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
```

- [ ] **Step 2: Create the contact page (server component)**

```tsx
// app/contact/page.tsx
import { Mail } from "lucide-react"
import { FadeIn } from "@/components/FadeIn"
import { ContactForm } from "./contact-form"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export const metadata = {
  title: `Contact — ${SITE.name}`,
  description: `Talk to ${AGENCY.name} about building an AI system for your team. We read every message personally.`,
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <FadeIn>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
          {AGENCY.name}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          Let&apos;s talk.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-10">
          Tell us about your team and the workflow you&apos;d like to automate.
          We&apos;ll reply within one business day — usually much faster — with
          an honest take on whether this is something we can help with.
        </p>
      </FadeIn>

      <FadeIn delay={0.15}>
        <ContactForm />
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="mt-12 pt-8 border-t border-border flex items-center gap-3 text-sm text-muted-foreground">
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
      </FadeIn>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 4: Visual + end-to-end smoke test**

Visit `http://localhost:3050/contact`. Fill out the form with valid data and submit. Confirm:
- Loading spinner appears during submit
- Success state renders after ~1s
- New row in Supabase `contact_messages`
- Email arrived at damon@placetostandagency.com

Try submitting with invalid data (empty name, bad email, 3-char message). Confirm inline field errors render.

- [ ] **Step 5: Commit**

```bash
git add app/contact
git commit -m "feat(contact): add Contact page with client form component"
```

---

## Task 12: Create Trust & Security page

**Files:**
- Create: `app/security/page.tsx`

> **Content accuracy note:** This page will be read carefully by enterprise IT and legal reviewers. Every claim must be literally true. The copy below reflects the confirmed posture: (1) LLM data handling is configurable per engagement — zero-retention enterprise APIs by default, with client-hosted models available for regulated workloads; (2) we are not currently executing HIPAA engagements, but can scope them on request. Do NOT strengthen any claim beyond what's written. If in doubt, soften rather than embellish.

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link"
import { Shield, Lock, Server, Database, FileCheck, AlertCircle } from "lucide-react"
import { FadeIn, Stagger, StaggerItem } from "@/components/FadeIn"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export const metadata = {
  title: `Trust & Security — ${SITE.name}`,
  description: `How ${AGENCY.name} handles data, LLM interactions, and security during AI implementation engagements.`,
}

const LAST_UPDATED = "April 6, 2026"

const PILLARS = [
  {
    icon: Lock,
    title: "Your data stays yours",
    body: "We never use client data to train models. Every engagement runs on enterprise LLM endpoints with zero-retention agreements, or on client-hosted models (Bedrock, Azure OpenAI, self-hosted) when regulatory requirements demand it.",
  },
  {
    icon: Server,
    title: "Infrastructure you can audit",
    body: "Our production stack runs on Vercel (SOC 2 Type II) and Supabase (SOC 2 Type II, managed Postgres with encryption at rest and in transit). We document exactly which systems touch your data and can provide sub-processor lists on request.",
  },
  {
    icon: Database,
    title: "Least-privilege data access",
    body: "During engagements, we work with the minimum data needed to build and test the system. We use scoped credentials, short-lived tokens where possible, and we hand over admin access to your team at the end of every build.",
  },
  {
    icon: FileCheck,
    title: "Clear data lifecycle",
    body: "We document every system's data retention policy in writing before kickoff. You decide how long we keep engagement artifacts, and we delete them on request — typically within 30 days of project close.",
  },
]

export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <FadeIn>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-accent font-semibold mb-3">
          <Shield className="h-3.5 w-3.5" />
          Trust &amp; Security
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
          How we handle your data.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-3">
          {AGENCY.name} builds custom AI systems for knowledge-work teams.
          That means we touch sensitive operational data during engagements —
          and we treat that as a responsibility, not a footnote.
        </p>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: {LAST_UPDATED}
        </p>
      </FadeIn>

      <Stagger className="grid sm:grid-cols-2 gap-5 mb-12" staggerDelay={0.1}>
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <StaggerItem key={title}>
            <div className="rounded-2xl border border-border bg-card p-6 h-full">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-heading text-base font-semibold mb-2">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {body}
              </p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn delay={0.4}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">
            LLM data handling
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              <strong className="text-foreground">Default posture.</strong>{" "}
              We use enterprise API endpoints from OpenAI, Anthropic, and
              Amazon Bedrock with zero-retention and no-training agreements
              for production workloads. Prompts and completions are not
              logged beyond what's needed for real-time delivery.
            </p>
            <p>
              <strong className="text-foreground">Configurable per engagement.</strong>{" "}
              When client requirements or regulations demand stricter
              controls, we deploy into your cloud tenant (Azure OpenAI,
              Bedrock in your AWS account) or use self-hosted open models.
              You keep the keys, you keep the logs, you keep the model.
            </p>
            <p>
              <strong className="text-foreground">Evaluation and tuning.</strong>{" "}
              Prompt engineering and evaluation work happens on synthetic or
              anonymized data whenever possible. If real data is required for
              a specific test, we document exactly what is used, where it
              lives, and how long it's retained — in writing, before the work
              starts.
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.5}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">
            This website
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Separately from client engagements, this website ({SITE.name})
              collects only what you voluntarily submit through the contact
              form or occupation builder. See our{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>{" "}
              for the full breakdown of what's collected, why, and how long
              it's kept. Highlights:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>No tracking cookies, no advertising, no third-party analytics (as of the date above).</li>
              <li>Submitted form data is stored in Supabase (encrypted at rest, RLS-locked).</li>
              <li>Notification email is delivered via Resend; no marketing newsletters.</li>
              <li>You can request full deletion at any time by emailing{" "}
                <a href={`mailto:${CONTACT.email}`} className="text-accent hover:underline">
                  {CONTACT.email}
                </a>
                .
              </li>
            </ul>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.6}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-8">
          <h2 className="font-heading text-xl font-semibold mb-4">
            Regulated data
          </h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              We are not currently executing HIPAA, PCI, or FedRAMP-scoped
              engagements, but we can scope them on request. For HIPAA-capable
              builds, we work with covered entities to sign a BAA, deploy
              exclusively to client-hosted infrastructure, and use LLM
              providers that support BAAs (AWS Bedrock, Azure OpenAI).
            </p>
            <p>
              If you have a specific compliance requirement, tell us up front —
              it shapes the architecture decisions we make in week one, and
              it's much cheaper to plan for than to retrofit.
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.7}>
        <div className="rounded-2xl border border-border bg-card p-8 mb-10">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <h2 className="font-heading text-xl font-semibold">
              Incident response
            </h2>
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              If you believe you've found a security issue in this website or
              in an engagement we've delivered, please email{" "}
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-accent hover:underline"
              >
                {CONTACT.email}
              </a>{" "}
              with the subject line <em>“Security”</em>. We acknowledge every
              report within one business day and will work with you on
              responsible disclosure.
            </p>
            <p>
              For active client engagements, incident response procedures are
              defined in your statement of work and include named contacts,
              notification timelines, and escalation paths.
            </p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.8}>
        <div className="text-sm text-muted-foreground text-center">
          Questions we didn&apos;t answer here?{" "}
          <Link href="/contact" className="text-foreground hover:text-accent transition-colors">
            Start a conversation
          </Link>
          .
        </div>
      </FadeIn>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 3: Visual check**

Visit `http://localhost:3050/security`. Confirm:
- Shield icon + "Trust & Security" kicker above h1
- 4 pillar cards render in a 2-column grid (single column on mobile)
- LLM data handling, This website, Regulated data, Incident response sections all render
- "Last updated" date visible under the hero paragraph
- "Start a conversation" link at the bottom routes to `/contact`

- [ ] **Step 4: Commit**

```bash
git add app/security/page.tsx
git commit -m "feat(trust): add /security page with LLM handling and compliance posture"
```

---

## Task 13: Update Footer with legal/contact columns and agency attribution

**Files:**
- Modify: `components/layout/Footer.tsx` (full replacement)

- [ ] **Step 1: Replace file contents**

```tsx
import Link from "next/link"
import { AGENCY, CONTACT, SITE } from "@/lib/site"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <h3 className="font-heading text-base font-semibold mb-2">
              {SITE.name}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-3">
              Task-level AI analysis for 800+ occupations. A project by{" "}
              <a
                href={AGENCY.url}
                target="_blank"
                rel="noopener"
                className="text-foreground hover:text-accent transition-colors"
              >
                {AGENCY.name}
              </a>
              .
            </p>
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {CONTACT.email}
            </a>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Explore</h4>
            <div className="space-y-2">
              <Link
                href="/browse"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse Occupations
              </Link>
              <Link
                href="/products"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <div className="space-y-2">
              <Link
                href="/about"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Trust</h4>
            <div className="space-y-2">
              <Link
                href="/security"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Security
              </Link>
              <Link
                href="/terms"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {year} {AGENCY.name}. Built from public occupation data and our
            own task-level analysis.
          </p>
          <p>
            Data sources: U.S. Bureau of Labor Statistics &middot; O*NET
          </p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 3: Visual check**

Visit any page and scroll to the footer. Confirm four columns on desktop (Brand, Explore, Company, Trust), two on mobile. All links route correctly: `/about`, `/contact`, `/security`, `/terms`, `/privacy`, `/browse`, `/products`. The Place To Stand Agency link opens in a new tab.

- [ ] **Step 4: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "feat(footer): add legal/contact columns and agency attribution"
```

---

## Task 14: Update root layout metadata

**Files:**
- Modify: `app/layout.tsx:20-24`

- [ ] **Step 1: Replace the metadata export**

Find this block in `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "AI Jobs Map",
  description:
    "Discover how AI can save time in your specific occupation. Task-level analysis for 800+ roles.",
}
```

Replace with:

```tsx
import { SITE, AGENCY } from "@/lib/site"

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
  authors: [{ name: AGENCY.name, url: AGENCY.url }],
  creator: AGENCY.name,
  publisher: AGENCY.name,
}
```

Note: the import goes at the top of the file with the other imports.

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 3: Verify page titles**

Start dev server and visit each page. Check browser tab title:
- `/` → "AI Jobs Map"
- `/about` → "About — AI Jobs Map"
- `/contact` → "Contact — AI Jobs Map"
- `/terms` → "Terms of Service — AI Jobs Map"
- `/privacy` → "Privacy Policy — AI Jobs Map"

The title template (`%s — AI Jobs Map`) should automatically append the site name to per-page titles.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(seo): add metadataBase, title template, and OG metadata"
```

---

## Task 15: Add Playwright smoke test for contact form and trust pages

**Files:**
- Create: `tests/e2e/contact-form.spec.ts`

- [ ] **Step 1: Create the test**

```ts
import { expect, test } from "@playwright/test"

test.describe("/contact page", () => {
  test("renders trust copy and form fields", async ({ page }) => {
    await page.goto("/contact")

    await expect(
      page.getByRole("heading", { name: /let['’]s talk/i })
    ).toBeVisible()

    await expect(
      page.getByText(/place to stand agency/i).first()
    ).toBeVisible()

    await expect(page.getByLabel(/your name/i)).toBeVisible()
    await expect(page.getByLabel(/^email$/i)).toBeVisible()
    await expect(page.getByLabel(/company \(optional\)/i)).toBeVisible()
    await expect(page.getByLabel(/what are you trying to build/i)).toBeVisible()
    await expect(
      page.getByRole("button", { name: /send message/i })
    ).toBeVisible()

    // Email fallback link
    await expect(
      page.getByRole("link", { name: /damon@placetostandagency\.com/i })
    ).toBeVisible()
  })

  test("shows inline validation errors for empty submission", async ({
    page,
  }) => {
    await page.goto("/contact")
    await page.getByRole("button", { name: /send message/i }).click()

    await expect(page.getByText(/please enter your name/i)).toBeVisible()
    // Email error may be "please enter a valid email" from zod since
    // the field is empty; the client preflight catches it.
    await expect(
      page.getByText(/please enter a valid email address/i)
    ).toBeVisible()
    await expect(
      page.getByText(/few details about what you're looking to build/i)
    ).toBeVisible()
  })
})

test.describe("header navigation", () => {
  test("Book a Call CTA routes to /contact", async ({ page }) => {
    await page.goto("/")
    await page
      .getByRole("link", { name: /^book a call$/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/contact$/)
  })
})

test.describe("footer trust links", () => {
  test("Security, Terms, and Privacy are reachable from footer", async ({
    page,
  }) => {
    await page.goto("/")

    await page
      .getByRole("link", { name: /^security$/i })
      .first()
      .click()
    await expect(page).toHaveURL(/\/security$/)
    await expect(
      page.getByRole("heading", { name: /how we handle your data/i })
    ).toBeVisible()

    await page.goto("/")
    await page.getByRole("link", { name: /terms of service/i }).click()
    await expect(page).toHaveURL(/\/terms$/)
    await expect(
      page.getByRole("heading", { name: /terms of service/i })
    ).toBeVisible()

    await page.goto("/")
    await page.getByRole("link", { name: /privacy policy/i }).click()
    await expect(page).toHaveURL(/\/privacy$/)
    await expect(
      page.getByRole("heading", { name: /privacy policy/i })
    ).toBeVisible()
  })
})

test.describe("/security page", () => {
  test("renders pillars and compliance copy", async ({ page }) => {
    await page.goto("/security")

    await expect(
      page.getByRole("heading", { name: /how we handle your data/i })
    ).toBeVisible()
    await expect(page.getByText(/your data stays yours/i)).toBeVisible()
    await expect(
      page.getByText(/infrastructure you can audit/i)
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /^llm data handling$/i })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /^regulated data$/i })
    ).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the test**

Start the dev server in one terminal (`npm run dev`), then in another:

```bash
npm run test:e2e -- contact-form
```

Expected: all tests PASS. If any fail, read the error carefully — the most likely cause is a label mismatch with the form component. Fix the selector OR the component, whichever is less surprising.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/contact-form.spec.ts
git commit -m "test(e2e): add smoke tests for /contact, header CTA, and footer legal links"
```

---

## Task 16: Final verification and plan wrap-up

**Files:** none — verification only.

- [ ] **Step 1: Full type-check**

```bash
npm run type-check
```

Expected: PASS with zero errors.

- [ ] **Step 2: Full build**

```bash
npm run build
```

Expected: successful build. Pay attention to:
- No 404s for /factory (it's gone)
- New routes for /terms, /privacy, /security, /contact, /api/contact all compile
- No warnings about missing metadataBase

- [ ] **Step 3: Full e2e suite**

```bash
npm run test:e2e
```

Expected: all tests PASS including the pre-existing `occupation-inline-builder.spec.ts`.

- [ ] **Step 4: Manual walkthrough as a first-time visitor**

With `npm run dev` running:

1. Visit `/` — confirm "Book a Call" button in header.
2. Click Book a Call → lands on `/contact`. Confirm no 404.
3. Submit the form with real (test) data. Confirm success state.
4. Check Supabase `contact_messages` for the new row.
5. Check damon@placetostandagency.com for the notification email.
6. Navigate to `/about` — confirm Place To Stand framing, Valise card, "How we work" section.
7. Scroll to footer — confirm Trust column (Security, Terms, Privacy), agency attribution, mailto link.
8. Click Security → confirm 4 pillars + LLM/Regulated-data sections render.
9. Click Terms, then Privacy — confirm both render end-to-end.
10. Visit `/factory` — confirm 404 (expected).
11. Visit `/factory?occupation=foo` — confirm 404 (was a redirect, now gone).

- [ ] **Step 5: Update TaskList**

Mark the "Write Plan 1" parent task as complete. Create a new task "Execute Plan 1: Trust Foundation" for the actual build work, with reference to this plan file.

- [ ] **Step 6: Final commit if anything lingers**

If any uncommitted changes remain from verification fixes, commit them with a clear message. Otherwise, skip.

---

## What Plan 1 intentionally does NOT do (handled by later plans)

- **Plan 2 — Funnel Realness:** Occupation builder confirmation emails, generated blueprint artifacts, Cal.com embed on the builder success screen, richer Resend templates.
- **Plan 3 — Agency Credibility:** `/work` case studies page, "How we work" homepage section (this plan only puts it on About), engagement FAQ on `/products`, DB-computed stats on homepage.
- **Plan 4 — Instrumentation:** PostHog, Sentry, admin dashboard for viewing `contact_messages` and `assistant_inquiries`, proper rate limiting with Vercel BotID or upstash.

Do not be tempted to pull work forward from these plans while implementing Plan 1. The point of splitting is that each plan ships independently.

---

## Self-review notes

- **Placeholder scan:** the only values that are environment-dependent are `process.env.RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL`. These are explicitly documented in Task 1 Step 4. No "TBD" or "add appropriate handling" language anywhere.
- **Type consistency:** `ContactFormInput` from `lib/validation/contact.ts` is the authoritative type for the form payload. Both the client component and the route handler parse with the same schema. The `contact_messages` table columns match the parsed fields (name, email, company, message) plus operational fields (source, user_agent, ip_hash).
- **Spec coverage check:** trust layer = legal pages ✅, **Trust & Security page ✅**, About rewrite with agency framing ✅, Contact page with working form ✅, header fix ✅, footer rebuild with Trust column ✅, dead code removal ✅. Resend is wired for the contact form only (intentional — builder email is Plan 2). Supabase service-role client is introduced here because no existing pattern was confirmed; Task 10 Step 1 explicitly says to check for an existing helper first. The `/security` page is carefully scoped to honest claims: default zero-retention LLM posture with per-engagement configurability, and no active HIPAA/PCI/FedRAMP engagements (scopable on request).
