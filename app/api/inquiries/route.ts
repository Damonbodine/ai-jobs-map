import { NextResponse } from "next/server"
import { inquirySchema } from "@/lib/validation/inquiry"
import { sendEmail } from "@/lib/resend"
import { createServerClient } from "@/lib/supabase/server"
import { renderBlueprintPdf } from "@/lib/pdf/render"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"
import { AGENCY, CONTACT, SITE } from "@/lib/site"
import { PRICING_TIERS, computeAnnualValue } from "@/lib/pricing"
import {
  computeDisplayedTimeback,
  estimateTaskMinutes,
  inferArchetypeMultiplier,
} from "@/lib/timeback"

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

  if (
    isRateLimited("inquiries", ipHash, {
      windowMs: 10 * 60 * 1000,
      // PDF generation + two emails per call makes this expensive;
      // keep the cap tight even though the route is less spammy than /contact.
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

  // Re-fetch occupation truth so the PDF identity (id, title, hourly_wage)
  // is never client-trusted.
  const { data: occupation, error: occError } = await supabase
    .from("occupations")
    .select("id, title, slug, hourly_wage")
    .eq("slug", input.occupationSlug)
    .single()

  if (occError || !occupation) {
    return NextResponse.json({ error: "Unknown occupation" }, { status: 400 })
  }

  // Re-fetch the task list AND profile in parallel. Client-sent
  // displayedMinutes / displayedAnnualValue are NOT trusted — we
  // recompute from the subset of tasks the user actually selected.
  const [{ data: profile }, { data: allTasks }] = await Promise.all([
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

  // Insert the lead row FIRST — source of truth. If PDF/email fail
  // downstream, the lead is still saved and followable manually.
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
    source: input.source,
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

  // ---- Server-derived display values (NOT client-trusted) ----
  // The client tells us which task IDs the user selected. From there
  // we recompute every number that ends up in the PDF + email so a
  // tampered or stale client cannot produce a misleading blueprint.
  const archetypeMultiplier = inferArchetypeMultiplier(profile ?? null)
  const aiTasks = (allTasks ?? []).filter((t) => t.ai_applicable)

  const selectedIdSet = new Set(input.selectedTaskIds)
  const selectedTasksFromDb = aiTasks.filter((t) => selectedIdSet.has(t.id))
  // If the client somehow sends an empty selectedTaskIds array but did
  // pass selectedModules, fall back to all AI-applicable tasks for
  // those module categories. This preserves the legacy behavior where
  // the builder doesn't always sync individual task IDs.
  const tasksForPdf =
    selectedTasksFromDb.length > 0 ? selectedTasksFromDb : aiTasks

  // Sum the selected minutes from the same source the occupation page uses.
  const selectedTotalMinutes = tasksForPdf.reduce(
    (sum, task) => sum + estimateTaskMinutes(task) * archetypeMultiplier,
    0
  )
  const { displayedMinutes: serverMinutes } = computeDisplayedTimeback(
    profile ?? null,
    tasksForPdf,
    selectedTotalMinutes
  )
  const serverAnnualValue = computeAnnualValue(
    serverMinutes,
    occupation.hourly_wage
  )

  const taskListForPdf = tasksForPdf.slice(0, 12).map((task) => ({
    name: task.task_name,
    minutesPerDay: Math.max(
      1,
      Math.round(estimateTaskMinutes(task) * archetypeMultiplier)
    ),
  }))
  const truncatedCount = Math.max(0, tasksForPdf.length - taskListForPdf.length)
  if (truncatedCount > 0) {
    taskListForPdf.push({
      name: `+ ${truncatedCount} more task${truncatedCount === 1 ? "" : "s"}`,
      minutesPerDay: 0,
    })
  }

  // Generate the PDF. If this fails, we still return success because
  // the lead is saved — but log loudly so Damon can regenerate manually.
  let pdfBuffer: Buffer | null = null
  try {
    pdfBuffer = await renderBlueprintPdf({
      variant: "builder",
      occupation: {
        title: occupation.title,
        slug: occupation.slug,
      },
      stats: {
        minutesPerDay: serverMinutes,
        annualValueDollars: serverAnnualValue,
        taskCount: tasksForPdf.length,
      },
      selectedTasks: taskListForPdf,
      recommendedModules: input.selectedModules.map((name) => ({
        name,
        blurb: "Selected during your builder session.",
      })),
      tier: tier ? { label: tier.label, basePrice: tier.basePrice } : undefined,
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
  <p>Thanks for trying the ${escapeHtml(SITE.name)} builder. Your custom blueprint for <strong>${safeOccupation}</strong> is attached as a PDF &mdash; share it with your team, push back on the numbers, and let us know what would make it fit your reality better.</p>
  <p><strong>What happens next:</strong> we'll review your submission personally and reply within one business day with an honest take on whether this is something we can help you build.</p>
  <p style="margin-top:24px;">&mdash; ${escapeHtml(AGENCY.name)}<br/>
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
    const safeName = escapeHtml(input.contactName || "")
    const safeEmail = escapeHtml(input.contactEmail)
    const safeOccupation = escapeHtml(occupation.title)
    const safeTier = escapeHtml(input.tierKey)
    const safeTeam = input.teamSize ? escapeHtml(input.teamSize) : ""
    const safeModules = input.selectedModules.map(escapeHtml).join(", ") || "(none)"
    const safeRequestsHtml =
      input.customRequests.length > 0
        ? `<p><strong>Custom requests:</strong></p><ul>${input.customRequests
            .map((r) => `<li>${escapeHtml(r)}</li>`)
            .join("")}</ul>`
        : ""
    await sendEmail({
      to: CONTACT.email,
      replyTo: input.contactEmail,
      subject: `New builder inquiry: ${input.contactName || input.contactEmail} - ${occupation.title}`,
      html: `
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; color:#221f1c;">
  <h2 style="font-size: 18px; margin: 0 0 12px;">New builder inquiry</h2>
  <p><strong>Lead:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
  <p><strong>Occupation:</strong> ${safeOccupation}</p>
  <p><strong>Tier:</strong> ${safeTier}${safeTeam ? " &middot; " + safeTeam : ""}</p>
  <p><strong>Modules selected:</strong> ${safeModules}</p>
  ${safeRequestsHtml}
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
