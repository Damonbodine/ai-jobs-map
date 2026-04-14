# Build-a-Team Inquiry Flow — Implementation Plan

**Goal:** Extend `/build-a-team` so each role in the cart has an expandable module/task selector (identical UI language to the occupation builder), and the page gains a three-phase inquiry flow — configure → contact → done — that submits the whole team to a new `/api/build-a-team/inquiry` route and ends on a Calendly embed.

**Preserves:** The existing PDF modal ("Email me a PDF") stays. The new "Build Team Assistant →" CTA is additive.

**Tech stack:** Same as Plans 1–5. No new dependencies.

---

## Files to CREATE

- `app/build-a-team/role-builder.tsx` — client component. Per-role module/task toggle list. Mirrors occupation-builder UI exactly (same module cards, accent colours, expand/collapse tasks).
- `app/build-a-team/team-contact-form.tsx` — client component. Team size picker + name/email/custom requests + submit button.
- `app/build-a-team/team-done.tsx` — client component. Success confirmation card + inline CalendlyEmbed.
- `app/api/build-a-team/inquiry/route.ts` — POST handler. Validates payload, re-derives all math server-side, inserts into `team_inquiry_requests`, sends Resend email + department PDF.
- `supabase/migrations/2026-04-07-team-inquiry-requests.sql`
- `scripts/apply-team-inquiry-migration.ts`
- `lib/validation/build-a-team-inquiry.ts` — zod schema for the new route.

## Files to MODIFY

- `app/build-a-team/page.tsx` — call `getAllCapabilities()` in the parallel fetch; compute per-role `TaskItem[]` (with displayLow/displayHigh) for each occupation; pass `roleTaskData` + `capabilitiesByModule` to `<Cart>`.
- `app/build-a-team/cart.tsx` — accept new props; add phase state (`"configure" | "contact" | "done"`); add per-role selected-task state; embed `<RoleBuilder>` per role in an expandable panel; add "Build Team Assistant →" CTA; wire `<TeamContactForm>` and `<TeamDone>`.

---

## Task 1 — Zod schema

**File:** `lib/validation/build-a-team-inquiry.ts`

```ts
import { z } from "zod"

export const buildATeamInquirySchema = z.object({
  roles: z
    .array(
      z.object({
        slug: z.string().trim().regex(/^[a-z0-9-]{1,200}$/),
        count: z.coerce.number().int().min(1).max(999),
        selectedModules: z.array(z.string()).min(0),
        selectedTaskIds: z.array(z.number().int()),
      })
    )
    .min(1, "Add at least one role")
    .max(20),
  teamSize: z.string().trim().max(60),
  tierKey: z.string().trim().max(60),
  contactName: z.string().trim().max(120).optional(),
  contactEmail: z.string().trim().toLowerCase().email().max(254),
  customRequests: z.array(z.string().trim().max(500)).max(10),
  website: z.string().optional(), // honeypot
})

export type BuildATeamInquiryInput = z.infer<typeof buildATeamInquirySchema>
```

Commit:
```bash
npm run type-check
git add lib/validation/build-a-team-inquiry.ts
git commit -m "feat(build-a-team): add zod schema for team inquiry submission"
```

---

## Task 2 — DB migration

**File:** `supabase/migrations/2026-04-07-team-inquiry-requests.sql`

```sql
create table if not exists team_inquiry_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contact_email text not null,
  contact_name text,
  -- Per-role selection: [{slug, count, selectedModules, selectedTaskIds}]
  roles_json jsonb not null,
  team_size text,
  tier text,
  custom_requests jsonb,
  -- Computed totals snapshot
  total_people int,
  total_minutes_per_day int,
  total_annual_value int,
  fte_equivalents numeric(5,1),
  -- Metadata
  user_agent text,
  ip_hash text,
  -- Delivery
  pdf_sent_at timestamptz,
  pdf_send_error text
);

create index if not exists team_inquiry_requests_email_idx
  on team_inquiry_requests (contact_email);
create index if not exists team_inquiry_requests_created_at_idx
  on team_inquiry_requests (created_at desc);

alter table team_inquiry_requests enable row level security;
```

**File:** `scripts/apply-team-inquiry-migration.ts`

Copy `scripts/apply-department-roi-migration.ts`, update:
- SQL filename → `2026-04-07-team-inquiry-requests.sql`
- Table name → `team_inquiry_requests`
- Expected column count → 16
- Log strings

Run: `npx tsx scripts/apply-team-inquiry-migration.ts`

Commit:
```bash
git add supabase/migrations/2026-04-07-team-inquiry-requests.sql scripts/apply-team-inquiry-migration.ts
git commit -m "feat(db): add team_inquiry_requests table for /build-a-team inquiry flow"
```

---

## Task 3 — `/api/build-a-team/inquiry` route

**File:** `app/api/build-a-team/inquiry/route.ts`

```ts
import { NextResponse } from "next/server"
import { buildATeamInquirySchema } from "@/lib/validation/build-a-team-inquiry"
import { sendEmail } from "@/lib/resend"
import { createServerClient } from "@/lib/supabase/server"
import { renderDepartmentPdf } from "@/lib/pdf/render"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"
import { AGENCY, CONTACT, SITE } from "@/lib/site"
import { computeDepartmentTotals, type RoleData } from "@/lib/build-a-team/compute"
import { PRICING_TIERS } from "@/lib/pricing"

export const runtime = "nodejs"

function escapeHtml(v: string) {
  return v
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const ipHash = hashIp(ip)
  const userAgent = request.headers.get("user-agent") ?? null

  if (isRateLimited("build-a-team-inquiry", ipHash, { windowMs: 10 * 60 * 1000, max: 5 })) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // Honeypot
  if (typeof body === "object" && body !== null && "website" in body &&
      typeof (body as { website: unknown }).website === "string" &&
      (body as { website: string }).website.length > 0) {
    return NextResponse.json({ ok: true })
  }

  const parsed = buildATeamInquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const input = parsed.data
  const supabase = createServerClient()

  // Fetch all occupations in the submitted cart server-side.
  const slugs = input.roles.map(r => r.slug)
  const { data: occupations, error: occError } = await supabase
    .from("occupations").select("id, slug, title, hourly_wage").in("slug", slugs)
  if (occError || !occupations?.length) {
    return NextResponse.json({ error: "Unknown roles in cart" }, { status: 400 })
  }

  const occupationIds = occupations.map(o => o.id)
  const [{ data: profiles }, { data: tasks }] = await Promise.all([
    supabase.from("occupation_automation_profile").select("*").in("occupation_id", occupationIds),
    supabase.from("job_micro_tasks").select("*").in("occupation_id", occupationIds),
  ])

  const roleDataBySlug = new Map<string, RoleData>()
  for (const occ of occupations) {
    roleDataBySlug.set(occ.slug, {
      occupation: occ,
      profile: (profiles ?? []).find(p => p.occupation_id === occ.id) ?? null,
      tasks: (tasks ?? []).filter(t => t.occupation_id === occ.id),
    })
  }

  // Re-derive totals from canonical DB data (never trust client numbers).
  const cartForCompute = input.roles.map(r => ({ slug: r.slug, count: r.count }))
  const totals = computeDepartmentTotals(cartForCompute, roleDataBySlug)

  // Build the roles_json snapshot including module selections.
  const rolesJson = input.roles.map(r => ({
    slug: r.slug,
    count: r.count,
    selectedModules: r.selectedModules,
    selectedTaskIds: r.selectedTaskIds,
    title: occupations.find(o => o.slug === r.slug)?.title ?? r.slug,
  }))

  const tier = PRICING_TIERS.find(t => t.key === input.tierKey) ?? PRICING_TIERS[0]

  // Insert lead row FIRST (two-writes-no-silent-failure pattern).
  const { data: insertedRow, error: dbError } = await supabase
    .from("team_inquiry_requests")
    .insert({
      contact_email: input.contactEmail,
      contact_name: input.contactName ?? null,
      roles_json: rolesJson,
      team_size: input.teamSize || null,
      tier: tier.key,
      custom_requests: input.customRequests,
      total_people: totals.totalPeople,
      total_minutes_per_day: Math.round(totals.totalMinutesPerDay),
      total_annual_value: Math.round(totals.totalAnnualValue),
      fte_equivalents: totals.fteEquivalents,
      user_agent: userAgent,
      ip_hash: ipHash,
    })
    .select("id").single()

  if (dbError || !insertedRow) {
    console.error("[build-a-team/inquiry] db insert failed", dbError)
    return NextResponse.json({ error: "We couldn't process your request. Please try again shortly." }, { status: 500 })
  }

  const generatedAt = new Date().toISOString().slice(0, 10)
  let pdfBuffer: Buffer | null = null
  let pdfError: string | null = null

  try {
    pdfBuffer = await renderDepartmentPdf({
      teamLabel: `${input.contactName ?? input.contactEmail}'s team`,
      totals: {
        totalPeople: totals.totalPeople,
        totalMinutesPerDay: totals.totalMinutesPerDay,
        totalAnnualValue: totals.totalAnnualValue,
        fteEquivalents: totals.fteEquivalents,
      },
      rows: totals.rows.map(r => ({
        slug: r.slug, title: r.title, count: r.count,
        minutesPerPerson: r.minutesPerPerson,
        totalMinutesPerDay: r.totalMinutesPerDay,
        totalAnnualValue: r.totalAnnualValue,
      })),
      contactEmail: input.contactEmail,
      siteUrl: SITE.url,
      agencyName: AGENCY.name,
      generatedAt,
    })
  } catch (err) {
    pdfError = err instanceof Error ? err.message : String(err)
    console.error("[build-a-team/inquiry] pdf failed", err)
  }

  let emailSent = false
  let emailError: string | null = null
  const safeName = escapeHtml(input.contactName ?? input.contactEmail)

  try {
    await sendEmail({
      to: input.contactEmail,
      subject: `Your AI Team Blueprint — ${AGENCY.name}`,
      html: `
<div style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;color:#221f1c;">
  <h2 style="font-size:20px;margin:0 0 12px;">Your team blueprint is attached.</h2>
  <p>Thanks for using the team builder, ${safeName}. The PDF summarises the compounded AI value for your ${totals.totalPeople}-person team — ${totals.fteEquivalents} FTE-equivalents of time reclaimed per day.</p>
  <p>We'll be in touch shortly to talk through the build. If you'd like to move faster, book a scoping call at <a href="${SITE.url}/contact" style="color:#2563eb;">${SITE.url}/contact</a>.</p>
  <p style="margin-top:24px;">&mdash; ${escapeHtml(AGENCY.name)}</p>
</div>`.trim(),
      text: `Your team blueprint is attached.\n\nThanks ${input.contactName ?? input.contactEmail}. The PDF covers your ${totals.totalPeople}-person team (${totals.fteEquivalents} FTEs reclaimed/day).\n\nBook a call: ${SITE.url}/contact\n\n— ${AGENCY.name}`,
      attachments: pdfBuffer ? [{ filename: "ai-team-blueprint.pdf", content: pdfBuffer }] : undefined,
    })
    emailSent = true

    // Internal notification
    await sendEmail({
      to: CONTACT.email,
      subject: `New team inquiry — ${input.contactEmail} (${totals.totalPeople} people)`,
      html: `<p><strong>Email:</strong> ${escapeHtml(input.contactEmail)}<br><strong>Name:</strong> ${safeName}<br><strong>Team size:</strong> ${input.teamSize}<br><strong>People:</strong> ${totals.totalPeople}<br><strong>Annual value:</strong> $${Math.round(totals.totalAnnualValue).toLocaleString()}<br><strong>FTEs:</strong> ${totals.fteEquivalents}<br><strong>Roles:</strong> ${rolesJson.map(r => `${r.title} x${r.count}`).join(", ")}</p>`,
      text: `New team inquiry from ${input.contactEmail}\nTeam: ${totals.totalPeople} people, $${Math.round(totals.totalAnnualValue).toLocaleString()}/yr`,
    }).catch(err => console.error("[build-a-team/inquiry] internal notify failed", err))
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err)
    console.error("[build-a-team/inquiry] email failed", err)
  }

  await supabase.from("team_inquiry_requests")
    .update({ pdf_sent_at: emailSent ? new Date().toISOString() : null, pdf_send_error: emailError ?? pdfError })
    .eq("id", insertedRow.id)

  return NextResponse.json({ ok: true })
}
```

Commit:
```bash
npm run type-check
git add app/api/build-a-team/inquiry/route.ts
git commit -m "feat(build-a-team): add /api/build-a-team/inquiry route with team-level PDF + Resend"
```

---

## Task 4 — RoleBuilder client component

**File:** `app/build-a-team/role-builder.tsx`

This is a stripped-down version of the occupation builder's module list — same card UI, same accent colours, same expand/collapse tasks — but it only handles the "select" phase (no contact form, no pricing).

```tsx
"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { MODULE_REGISTRY } from "@/lib/modules"
import { cn } from "@/lib/utils"

const MODULE_ACCENTS: Record<string, string> = {
  intake: "#06b6d4",
  analysis: "#6366f1",
  documentation: "#8b5cf6",
  coordination: "#10b981",
  exceptions: "#f59e0b",
  learning: "#f43f5e",
  research: "#14b8a6",
  compliance: "#ef4444",
  communication: "#f97316",
  data_reporting: "#0ea5e9",
}

export type TaskItem = {
  id: number
  task_name: string
  displayLow: number
  displayHigh: number
  ai_impact_level: number | null
  ai_how_it_helps: string | null
  moduleKey: string
}

type ModuleGroup = {
  moduleKey: string
  tasks: TaskItem[]
  groupMinutes: number
  selectedCount: number
}

export function RoleBuilder({
  tasks,
  selected,
  onToggleModule,
  onToggleTask,
}: {
  tasks: TaskItem[]
  selected: Set<number>
  onToggleModule: (moduleKey: string, taskIds: number[]) => void
  onToggleTask: (id: number) => void
}) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Group tasks by module
  const groups: ModuleGroup[] = []
  const seen = new Map<string, TaskItem[]>()
  for (const task of tasks) {
    const arr = seen.get(task.moduleKey) ?? []
    arr.push(task)
    seen.set(task.moduleKey, arr)
  }
  for (const [moduleKey, moduleTasks] of seen) {
    const groupMinutes = moduleTasks.reduce((s, t) => s + Math.round((t.displayLow + t.displayHigh) / 2), 0)
    const selectedCount = moduleTasks.filter(t => selected.has(t.id)).length
    groups.push({ moduleKey, tasks: moduleTasks, groupMinutes, selectedCount })
  }

  function toggleExpand(moduleKey: string) {
    setExpandedModules(prev => {
      const next = new Set(prev)
      next.has(moduleKey) ? next.delete(moduleKey) : next.add(moduleKey)
      return next
    })
  }

  if (groups.length === 0) return (
    <p className="text-sm text-muted-foreground py-4 px-1">No AI-applicable tasks found for this role.</p>
  )

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden mt-3">
      {groups.map(({ moduleKey, tasks: groupTasks, groupMinutes, selectedCount }) => {
        const allSelected = selectedCount === groupTasks.length
        const someSelected = selectedCount > 0
        const accent = MODULE_ACCENTS[moduleKey] ?? "#6b7280"
        const definition = MODULE_REGISTRY[moduleKey as keyof typeof MODULE_REGISTRY]
        const Icon = definition?.icon
        const isExpanded = expandedModules.has(moduleKey)

        return (
          <div key={moduleKey} className="border-b border-border last:border-b-0">
            <div
              className={cn(
                "border-l-4 px-4 py-3 flex items-center justify-between gap-3",
                allSelected ? "bg-white" : someSelected ? "bg-secondary/10" : "bg-card"
              )}
              style={{ borderLeftColor: accent }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {Icon && (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background"
                    style={{ borderColor: `${accent}40`, color: accent }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold", allSelected ? "text-black" : "text-foreground")}>
                    {definition?.label ?? moduleKey}
                    <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                      {groupMinutes} min/day
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleExpand(moduleKey)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? "Hide tasks" : `${groupTasks.length} tasks`}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleModule(moduleKey, groupTasks.map(t => t.id))}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  allSelected
                    ? "bg-black text-white hover:opacity-90"
                    : someSelected
                    ? "bg-secondary text-foreground hover:bg-secondary/80"
                    : "bg-accent text-white hover:opacity-90"
                )}
              >
                <Check className="h-3 w-3" />
                {allSelected ? "Selected" : someSelected ? "Partial" : "Select"}
              </button>
            </div>

            {isExpanded && (
              <ul className="divide-y divide-border border-t border-border bg-secondary/5">
                {groupTasks.map(task => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => onToggleTask(task.id)}
                  >
                    <div className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors flex items-center justify-center",
                      selected.has(task.id) ? "bg-black border-black" : "border-border bg-background"
                    )}>
                      {selected.has(task.id) && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground leading-snug">{task.task_name}</p>
                      {task.ai_how_it_helps && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{task.ai_how_it_helps}</p>
                      )}
                    </div>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums pt-0.5">
                      {Math.round((task.displayLow + task.displayHigh) / 2)} min
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

Commit:
```bash
npm run type-check
git add app/build-a-team/role-builder.tsx
git commit -m "feat(build-a-team): add RoleBuilder per-role module/task selector"
```

---

## Task 5 — TeamDone component

**File:** `app/build-a-team/team-done.tsx`

```tsx
"use client"

import { CheckCircle2 } from "lucide-react"
import { CalendlyEmbed } from "@/components/CalendlyEmbed"
import { CONTACT } from "@/lib/site"

export function TeamDone({
  email,
  totalPeople,
  annualValue,
}: {
  email: string
  totalPeople: number
  annualValue: number
}) {
  return (
    <div className="space-y-8">
      <div role="status" aria-live="polite" className="rounded-2xl border border-accent/30 bg-accent/5 p-6 flex items-start gap-4">
        <CheckCircle2 className="h-6 w-6 text-accent shrink-0 mt-0.5" />
        <div>
          <h3 className="font-heading text-lg font-semibold mb-1">Your team blueprint is on its way.</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a PDF to <strong>{email}</strong> covering your {totalPeople}-person team
            ({annualValue > 0 ? `$${Math.round(annualValue).toLocaleString()} in annual AI value` : "full ROI breakdown"}).
            Book a scoping call below and we&apos;ll walk through the build together.
          </p>
        </div>
      </div>
      <CalendlyEmbed prefill={{ email }} />
    </div>
  )
}
```

Commit:
```bash
npm run type-check
git add app/build-a-team/team-done.tsx
git commit -m "feat(build-a-team): add TeamDone confirmation + Calendly component"
```

---

## Task 6 — TeamContactForm component

**File:** `app/build-a-team/team-contact-form.tsx`

```tsx
"use client"

import { useState } from "react"
import { Loader2, Plus, X } from "lucide-react"
import { TEAM_SIZES, computeDynamicPrice } from "@/lib/pricing"

export function TeamContactForm({
  totalModules,
  onSubmit,
  onBack,
}: {
  totalModules: number
  onSubmit: (data: {
    contactName: string
    contactEmail: string
    teamSizeLabel: string
    tierKey: string
    customRequests: string[]
  }) => Promise<void>
  onBack: () => void
}) {
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [teamSizeIndex, setTeamSizeIndex] = useState(0)
  const [customRequests, setCustomRequests] = useState<string[]>([])
  const [newRequest, setNewRequest] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const tier = computeDynamicPrice(totalModules)

  function addRequest() {
    const t = newRequest.trim()
    if (!t) return
    setCustomRequests(p => [...p, t])
    setNewRequest("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null)
    if (!contactEmail.trim()) {
      setEmailError("Email is required.")
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({
        contactName,
        contactEmail: contactEmail.trim().toLowerCase(),
        teamSizeLabel: TEAM_SIZES[teamSizeIndex]?.label ?? "",
        tierKey: tier.key,
        customRequests,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div>
        <h2 className="font-heading text-lg font-semibold">Request your team assistant plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We'll send a PDF blueprint and follow up to scope the build.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Team size */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            How many people total will use AI assistants?
          </label>
          <div className="flex flex-wrap gap-2">
            {TEAM_SIZES.map((size, i) => (
              <button
                key={size.label}
                type="button"
                onClick={() => setTeamSizeIndex(i)}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  i === teamSizeIndex
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-secondary"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="team-contact-name" className="block text-sm font-medium text-foreground">
            Name <span className="text-xs text-muted-foreground">(optional)</span>
          </label>
          <input
            id="team-contact-name"
            type="text"
            autoComplete="name"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="team-contact-email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="team-contact-email"
            type="email"
            required
            autoComplete="email"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "team-email-error" : undefined}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors aria-invalid:border-destructive aria-invalid:focus:ring-destructive/30"
          />
          {emailError && (
            <p id="team-email-error" className="text-xs text-destructive">{emailError}</p>
          )}
        </div>

        {/* Custom requests */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Anything specific you want to flag? <span className="text-xs text-muted-foreground">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRequest}
              onChange={e => setNewRequest(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRequest() } }}
              placeholder="e.g. HIPAA compliance needed"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
            <button type="button" onClick={addRequest} className="px-3 py-2.5 rounded-lg border border-border hover:bg-secondary transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {customRequests.length > 0 && (
            <ul className="space-y-1.5 mt-2">
              {customRequests.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-sm bg-secondary/30 rounded-lg px-3 py-1.5">
                  <span className="flex-1">{req}</span>
                  <button type="button" onClick={() => setCustomRequests(p => p.filter((_, j) => j !== i))}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : "Send me the team blueprint →"}
          </button>
        </div>
      </form>
    </div>
  )
}
```

Commit:
```bash
npm run type-check
git add app/build-a-team/team-contact-form.tsx
git commit -m "feat(build-a-team): add TeamContactForm with team size picker + contact fields"
```

---

## Task 7 — Update page.tsx to pass task data

Read the current `app/build-a-team/page.tsx`. The page already fetches `profiles` and `tasks` for all roles in the cart. Make these changes:

1. Import `getAllCapabilities` from `@/lib/capabilities` and `estimateTaskMinutes`, `inferArchetypeMultiplier`, `computeDisplayedTimeback` from `@/lib/timeback`.

2. Add `getAllCapabilities()` to the existing `Promise.all` fetch.

3. After building `roleDataBySlug`, compute per-role `TaskItem[]` with scaled display minutes (same logic as `app/occupation/[slug]/page.tsx` lines 62–80):

```ts
// Compute per-role task items with display-minute scaling
const roleTaskData: Array<{
  slug: string
  title: string
  occupationId: number
  hourlyWage: number | null
  tasks: Array<{
    id: number
    task_name: string
    displayLow: number
    displayHigh: number
    ai_impact_level: number | null
    ai_how_it_helps: string | null
    moduleKey: string
  }>
  displayedMinutes: number
  annualValue: number
}> = []

for (const [slug, roleData] of roleDataBySlug) {
  const archetypeMultiplier = inferArchetypeMultiplier(roleData.profile)
  const aiTasks = roleData.tasks.filter(t => t.ai_applicable)
  const rawTotal = aiTasks.reduce((s, t) => s + estimateTaskMinutes(t) * archetypeMultiplier, 0)
  const { displayedMinutes } = computeDisplayedTimeback(roleData.profile, roleData.tasks, rawTotal)

  const taskItems = aiTasks.map(task => {
    const raw = estimateTaskMinutes(task) * archetypeMultiplier
    const share = rawTotal > 0 && displayedMinutes > 0
      ? Math.max(1, Math.round((raw / rawTotal) * displayedMinutes))
      : Math.max(1, Math.round(raw))
    const low = Math.max(1, Math.round(share * 0.78))
    const high = Math.max(low + 1, Math.round(share * 1.22))
    return {
      id: task.id,
      task_name: task.task_name,
      displayLow: low,
      displayHigh: high,
      ai_impact_level: task.ai_impact_level ?? null,
      ai_how_it_helps: task.ai_how_it_helps ?? null,
      moduleKey: task.module_key ?? "general",
    }
  })

  const occ = roleData.occupation
  roleTaskData.push({
    slug,
    title: occ.title,
    occupationId: occ.id,
    hourlyWage: occ.hourly_wage ?? null,
    tasks: taskItems,
    displayedMinutes,
    annualValue: computeAnnualValue(displayedMinutes, occ.hourly_wage),
  })
}
```

4. Pass `roleTaskData` and `capabilitiesByModule` to `<Cart>`:
```tsx
<Cart
  initialCart={cart}
  shareUrl={shareUrl}
  roleTaskData={roleTaskData}
  capabilitiesByModule={capabilitiesByModule}
/>
```

(The `capabilitiesByModule` variable comes from `getAllCapabilities()` in the parallel fetch.)

When cart is empty, `roleTaskData` is `[]` and `capabilitiesByModule` is `{}` — pass them anyway so the prop types are consistent.

Commit:
```bash
npm run type-check
git add app/build-a-team/page.tsx
git commit -m "feat(build-a-team): pass per-role task items + capabilitiesByModule to Cart"
```

---

## Task 8 — Update cart.tsx

This is the biggest change. The `Cart` component needs to:
1. Accept `roleTaskData` and `capabilitiesByModule` props
2. Add phase state (`"configure" | "contact" | "done"`)
3. Add per-role selected-task state (`Map<slug, Set<number>>` — default all selected)
4. Add an expandable task panel per cart row (using `RoleBuilder`)
5. Add "Build Team Assistant →" CTA in configure phase
6. Render `TeamContactForm` in contact phase
7. Render `TeamDone` in done phase

Read the current `app/build-a-team/cart.tsx` fully before editing.

Replace the file with this updated version:

```tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus, X, Link2, Mail, Check, ChevronDown, ChevronUp, ArrowRight } from "lucide-react"
import {
  encodeCart,
  mutateCart,
  type CartRow,
} from "@/lib/build-a-team/url-state"
import { MODULE_REGISTRY } from "@/lib/modules"
import type { ModuleCapability } from "@/types"
import { RoleSearch } from "./role-search"
import { PdfModal } from "./pdf-modal"
import { RoleBuilder, type TaskItem } from "./role-builder"
import { TeamContactForm } from "./team-contact-form"
import { TeamDone } from "./team-done"

type RoleTaskData = {
  slug: string
  title: string
  occupationId: number
  hourlyWage: number | null
  tasks: TaskItem[]
  displayedMinutes: number
  annualValue: number
}

type Phase = "configure" | "contact" | "done"

export function Cart({
  initialCart,
  shareUrl,
  roleTaskData,
  capabilitiesByModule,
}: {
  initialCart: CartRow[]
  shareUrl: string | null
  roleTaskData: RoleTaskData[]
  capabilitiesByModule: Record<string, ModuleCapability[]>
}) {
  const router = useRouter()
  const [cart, setCart] = useState<CartRow[]>(initialCart)
  const [pending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>("configure")
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())

  // Per-role selected task IDs — default: all tasks selected
  const [selectedTasksBySlug, setSelectedTasksBySlug] = useState<Map<string, Set<number>>>(
    () => {
      const m = new Map<string, Set<number>>()
      for (const rd of roleTaskData) {
        m.set(rd.slug, new Set(rd.tasks.map(t => t.id)))
      }
      return m
    }
  )

  // Contact form result (set when done)
  const [doneEmail, setDoneEmail] = useState("")
  const [doneTotalPeople, setDoneTotalPeople] = useState(0)
  const [doneAnnualValue, setDoneAnnualValue] = useState(0)

  function commit(next: CartRow[]) {
    setCart(next)
    const encoded = encodeCart(next)
    const url = encoded ? `/build-a-team?roles=${encoded}` : "/build-a-team"
    startTransition(() => { router.replace(url, { scroll: false }) })
  }

  function handleAdd(slug: string, _title: string) {
    commit(mutateCart(cart, slug, { addCount: 1 }))
  }

  function handleSetCount(slug: string, count: number) {
    commit(mutateCart(cart, slug, { setCount: count }))
  }

  function handleRemove(slug: string) {
    commit(mutateCart(cart, slug, { setCount: 0 }))
  }

  async function handleCopyShare() {
    if (typeof window === "undefined") return
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  function toggleRoleExpand(slug: string) {
    setExpandedRoles(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  function handleToggleModule(slug: string, moduleKey: string, taskIds: number[]) {
    setSelectedTasksBySlug(prev => {
      const current = new Set(prev.get(slug) ?? [])
      const allSelected = taskIds.every(id => current.has(id))
      if (allSelected) {
        taskIds.forEach(id => current.delete(id))
      } else {
        taskIds.forEach(id => current.add(id))
      }
      const next = new Map(prev)
      next.set(slug, current)
      return next
    })
  }

  function handleToggleTask(slug: string, taskId: number) {
    setSelectedTasksBySlug(prev => {
      const current = new Set(prev.get(slug) ?? [])
      current.has(taskId) ? current.delete(taskId) : current.add(taskId)
      const next = new Map(prev)
      next.set(slug, current)
      return next
    })
  }

  // Compute total selected modules across all roles (for tier pricing)
  const allSelectedModules = new Set<string>()
  for (const rd of roleTaskData) {
    const selected = selectedTasksBySlug.get(rd.slug) ?? new Set()
    for (const task of rd.tasks) {
      if (selected.has(task.id)) allSelectedModules.add(task.moduleKey)
    }
  }

  async function handleInquirySubmit(data: {
    contactName: string
    contactEmail: string
    teamSizeLabel: string
    tierKey: string
    customRequests: string[]
  }) {
    const roles = cart.map(cartRow => {
      const rd = roleTaskData.find(r => r.slug === cartRow.slug)
      const selected = selectedTasksBySlug.get(cartRow.slug) ?? new Set()
      const selectedTaskIds = Array.from(selected)
      const selectedModules = Array.from(
        new Set(
          (rd?.tasks ?? [])
            .filter(t => selected.has(t.id))
            .map(t => t.moduleKey)
        )
      )
      return {
        slug: cartRow.slug,
        count: cartRow.count,
        selectedModules,
        selectedTaskIds,
      }
    })

    const res = await fetch("/api/build-a-team/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roles,
        teamSize: data.teamSizeLabel,
        tierKey: data.tierKey,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        customRequests: data.customRequests,
        website: "",
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error ?? "Could not submit. Please try again.")
    }

    // Compute totals for done screen
    const totalPeople = cart.reduce((s, r) => s + r.count, 0)
    const totalAnnualValue = roleTaskData.reduce((s, rd) => {
      const cartRow = cart.find(r => r.slug === rd.slug)
      return s + rd.annualValue * (cartRow?.count ?? 0)
    }, 0)

    setDoneEmail(data.contactEmail)
    setDoneTotalPeople(totalPeople)
    setDoneAnnualValue(totalAnnualValue)
    setPhase("done")
  }

  // ── Done phase ──
  if (phase === "done") {
    return (
      <TeamDone
        email={doneEmail}
        totalPeople={doneTotalPeople}
        annualValue={doneAnnualValue}
      />
    )
  }

  // ── Contact phase ──
  if (phase === "contact") {
    return (
      <TeamContactForm
        totalModules={allSelectedModules.size}
        onSubmit={handleInquirySubmit}
        onBack={() => setPhase("configure")}
      />
    )
  }

  // ── Configure phase ──
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
          <ul className="space-y-2 mb-5">
            {cart.map(row => {
              const rd = roleTaskData.find(r => r.slug === row.slug)
              const selected = selectedTasksBySlug.get(row.slug) ?? new Set()
              const isExpanded = expandedRoles.has(row.slug)
              const selectedCount = rd ? rd.tasks.filter(t => selected.has(t.id)).length : 0
              const totalCount = rd?.tasks.length ?? 0

              return (
                <li key={row.slug} className="rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <span className="flex-1 text-sm text-foreground font-medium">{prettySlug(row.slug)}</span>

                    {/* Task selection badge */}
                    {totalCount > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleRoleExpand(row.slug)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
                      >
                        {selectedCount}/{totalCount} tasks
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSetCount(row.slug, Math.max(1, row.count - 1))}
                        disabled={pending || row.count <= 1}
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
                        onChange={e => handleSetCount(row.slug, Number.parseInt(e.target.value || "1", 10))}
                        aria-label={`${row.slug} count`}
                        className="w-14 text-center text-sm rounded-md border border-border bg-background py-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleSetCount(row.slug, row.count + 1)}
                        disabled={pending || row.count >= 999}
                        aria-label={`Increase ${row.slug} count`}
                        className="p-1.5 rounded-md border border-border hover:bg-secondary transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(row.slug)}
                      aria-label={`Remove ${row.slug}`}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {isExpanded && rd && (
                    <div className="px-3 pb-3 border-t border-border bg-secondary/5">
                      <RoleBuilder
                        tasks={rd.tasks}
                        selected={selected}
                        onToggleModule={(moduleKey, taskIds) => handleToggleModule(row.slug, moduleKey, taskIds)}
                        onToggleTask={taskId => handleToggleTask(row.slug, taskId)}
                      />
                    </div>
                  )}
                </li>
              )
            })}
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
            {copied ? <><Check className="h-4 w-4 text-accent" />Copied</> : <><Link2 className="h-4 w-4" />Copy share link</>}
          </button>
          <button
            type="button"
            onClick={() => setPdfOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-foreground/20 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Email PDF
          </button>
          <button
            type="button"
            onClick={() => setPhase("contact")}
            className="sm:ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Build Team Assistant
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {pdfOpen ? (
        <PdfModal cart={cart} onClose={() => setPdfOpen(false)} />
      ) : null}
    </div>
  )
}

function prettySlug(slug: string): string {
  return slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")
}
```

Commit:
```bash
npm run type-check
git add app/build-a-team/cart.tsx
git commit -m "feat(build-a-team): add per-role task selection + three-phase inquiry flow to Cart"
```

---

## Task 9 — QA

```bash
rm -rf .next
npm run type-check
npm run build
npx playwright test build-a-team --reporter=line
```

Expected: clean build, all 6 build-a-team tests passing. The new cart phase flow isn't tested by existing specs (they only test configure phase) — that's acceptable.

Fix any type errors before committing. Then run the full suite:

```bash
npx playwright test --reporter=line
```

Expected: 14 passing, 1 pre-existing failure.

Commit if any fixes were needed:
```bash
git add -A
git commit -m "fix(build-a-team): address type-check and build issues from inquiry flow"
```

---

## Self-review checklist

- Per-role task selection matches occupation builder UI language ✅
- Phase transitions: configure → contact → done ✅  
- Server-side re-derivation in `/api/build-a-team/inquiry` (never trust client math) ✅
- Two-writes-no-silent-failure pattern ✅
- Honeypot in zod schema + checked before parse in route ✅
- HTML escaping on all user-supplied fields in email body ✅
- Rate limit bucket separated (`"build-a-team-inquiry"`) ✅
- `selectedTasksBySlug` initialised from `roleTaskData` (all selected by default) ✅
- `capabilitiesByModule` accepted but not yet used (passed for future PDF enhancement) ✅
- Existing PDF modal preserved ✅
- `CalendlyEmbed` in `TeamDone` uses `prefillEmail` prop ✅
