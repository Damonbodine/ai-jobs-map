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
