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
