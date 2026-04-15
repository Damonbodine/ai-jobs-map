import { NextResponse } from "next/server"
import { onePagerSchema } from "@/lib/validation/one-pager"
import { sendEmail } from "@/lib/resend"
import { createServerClient } from "@/lib/supabase/server"
import { renderBlueprintPdf } from "@/lib/pdf/render"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"
import { AGENCY, SITE } from "@/lib/site"
import {
  computeDisplayedTimeback,
  estimateTaskMinutes,
  inferArchetypeMultiplier,
} from "@/lib/timeback"
import { computeAnnualValue } from "@/lib/pricing"
import { getBlockForTask } from "@/lib/blueprint"
import { MODULE_REGISTRY } from "@/lib/modules"
import { PDF_MODULE_ACCENTS } from "@/lib/pdf/styles"

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
      // PDF generation per call is expensive — keep the cap tight.
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

  // Compute module breakdown for one-pager page 2
  const moduleMap = new Map<string, { rawMinutes: number; taskNames: string[] }>()
  for (const task of aiTasks) {
    const key = getBlockForTask(task)
    const existing = moduleMap.get(key) ?? { rawMinutes: 0, taskNames: [] }
    existing.rawMinutes += estimateTaskMinutes(task) * archetypeMultiplier
    if (existing.taskNames.length < 3) existing.taskNames.push(task.task_name)
    moduleMap.set(key, existing)
  }
  const moduleBreakdown = [...moduleMap.entries()]
    .map(([moduleKey, data]) => ({
      moduleKey,
      label: MODULE_REGISTRY[moduleKey as keyof typeof MODULE_REGISTRY]?.label ?? moduleKey,
      accentColor: PDF_MODULE_ACCENTS[moduleKey] ?? "#6b7280",
      // Scale raw minutes proportionally to displayedMinutes
      minutesPerDay: totalBlueprintMinutes > 0
        ? Math.max(1, Math.round((data.rawMinutes / totalBlueprintMinutes) * displayedMinutes))
        : Math.max(1, Math.round(data.rawMinutes)),
      topTaskNames: data.taskNames,
    }))
    .sort((a, b) => b.minutesPerDay - a.minutesPerDay)

  const topTasks = aiTasks.slice(0, 10).map((task) => ({
    name: task.task_name,
    minutesPerDay: Math.max(
      1,
      Math.round(estimateTaskMinutes(task) * archetypeMultiplier)
    ),
  }))

  // Save the capture first — the row is the source of truth. Capture
  // the inserted id so we can update pdf_sent_at / pdf_send_error after
  // the email attempt.
  const { data: insertedRow, error: dbError } = await supabase
    .from("one_pager_requests")
    .insert({
      email,
      occupation_slug: occupation.slug,
      occupation_title: occupation.title,
      user_agent: userAgent,
      ip_hash: ipHash,
    })
    .select("id")
    .single()

  if (dbError || !insertedRow) {
    console.error("[one-pager] supabase insert failed", dbError)
    return NextResponse.json(
      { error: "We couldn't process your request. Please try again shortly." },
      { status: 500 }
    )
  }

  const generatedAt = new Date().toISOString().slice(0, 10)

  let pdfBuffer: Buffer | null = null
  let pdfError: string | null = null
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
      recommendedModules: [],
      contact: { email },
      moduleBreakdown,
      siteUrl: SITE.url,
      agencyName: AGENCY.name,
      generatedAt,
    })
  } catch (err) {
    pdfError = err instanceof Error ? err.message : String(err)
    console.error("[one-pager] pdf generation failed", err)
  }

  let emailSent = false
  let emailError: string | null = null
  try {
    const safeOccupation = escapeHtml(occupation.title)
    await sendEmail({
      to: email,
      subject: `AI Time-Back One-Pager · ${occupation.title}`,
      html: `
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; color:#221f1c;">
  <h2 style="font-size: 20px; margin: 0 0 12px;">Your one-pager is attached.</h2>
  <p>Thanks for your interest in the ${escapeHtml(SITE.name)} analysis for <strong>${safeOccupation}</strong>. The attached PDF summarizes the top automation opportunities and the time-back potential for this role &mdash; share it with your team.</p>
  <p>If the numbers make sense and you'd like to talk about a real build, book a scoping call at <a href="${SITE.url}/contact" style="color:#2563eb;">${SITE.url}/contact</a>.</p>
  <p style="margin-top:24px;">&mdash; ${escapeHtml(AGENCY.name)}</p>
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
    emailSent = true
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err)
    console.error("[one-pager] delivery email failed", err)
  }

  // Persist delivery state on the row so we can audit failures later.
  await supabase
    .from("one_pager_requests")
    .update({
      pdf_sent_at: emailSent ? new Date().toISOString() : null,
      pdf_send_error: emailError ?? pdfError,
    })
    .eq("id", insertedRow.id)

  return NextResponse.json({ ok: true }, { status: 200 })
}
