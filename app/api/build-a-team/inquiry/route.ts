import { NextResponse } from "next/server"
import { buildATeamInquirySchema } from "@/lib/validation/build-a-team-inquiry"
import { sendEmail } from "@/lib/resend"
import { db } from "@/lib/db/client"
import { occupations, occupationAutomationProfile, jobMicroTasks, teamInquiryRequests } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import { renderTeamDeckPdf } from "@/lib/pdf/render"
import { computeRoleSections, computeTopModules, computePhases, type CartItemWithSelection } from "@/lib/pdf/team-deck-data"
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

  // Fetch all occupations in the submitted cart server-side.
  const slugs = input.roles.map(r => r.slug)
  const occupationsData = await db
    .select({
      id: occupations.id,
      slug: occupations.slug,
      title: occupations.title,
      hourly_wage: occupations.hourlyWage,
    })
    .from(occupations)
    .where(inArray(occupations.slug, slugs))

  const occupationsList = occupationsData.map(o => ({
    ...o,
    hourly_wage: o.hourly_wage ? parseFloat(o.hourly_wage) : null,
  }))

  if (!occupationsList.length) {
    return NextResponse.json({ error: "Unknown roles in cart" }, { status: 400 })
  }

  const occupationIds = occupationsList.map(o => o.id)
  const [profiles, tasks] = await Promise.all([
    db
      .select({
        id: occupationAutomationProfile.id,
        occupation_id: occupationAutomationProfile.occupationId,
        composite_score: occupationAutomationProfile.compositeScore,
        work_activity_automation_potential: occupationAutomationProfile.workActivityAutomationPotential,
        time_range_low: occupationAutomationProfile.timeRangeLow,
        time_range_high: occupationAutomationProfile.timeRangeHigh,
        time_range_by_block: occupationAutomationProfile.timeRangeByBlock,
        block_example_tasks: occupationAutomationProfile.blockExampleTasks,
        top_automatable_activities: occupationAutomationProfile.topAutomatableActivities,
        top_blocking_abilities: occupationAutomationProfile.topBlockingAbilities,
        physical_ability_avg: occupationAutomationProfile.physicalAbilityAvg,
      })
      .from(occupationAutomationProfile)
      .where(inArray(occupationAutomationProfile.occupationId, occupationIds)),
    db
      .select({
        id: jobMicroTasks.id,
        occupation_id: jobMicroTasks.occupationId,
        task_name: jobMicroTasks.taskName,
        task_description: jobMicroTasks.taskDescription,
        frequency: jobMicroTasks.frequency,
        ai_applicable: jobMicroTasks.aiApplicable,
        ai_how_it_helps: jobMicroTasks.aiHowItHelps,
        ai_impact_level: jobMicroTasks.aiImpactLevel,
        ai_effort_to_implement: jobMicroTasks.aiEffortToImplement,
        ai_category: jobMicroTasks.aiCategory,
        ai_tools: jobMicroTasks.aiTools,
      })
      .from(jobMicroTasks)
      .where(inArray(jobMicroTasks.occupationId, occupationIds)),
  ])

  const roleDataBySlug = new Map<string, RoleData>()
  for (const occ of occupationsList) {
    roleDataBySlug.set(occ.slug, {
      occupation: occ as any,
      profile: (profiles ?? []).find(p => p.occupation_id === occ.id) as any ?? null,
      tasks: (tasks ?? []).filter(t => t.occupation_id === occ.id) as any[],
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
    title: occupationsList.find(o => o.slug === r.slug)?.title ?? r.slug,
  }))

  const tier = PRICING_TIERS.find(t => t.key === input.tierKey) ?? PRICING_TIERS[0]

  // Insert lead row FIRST (two-writes-no-silent-failure pattern).
  let insertedRow: { id: string } | undefined
  try {
    const results = await db
      .insert(teamInquiryRequests)
      .values({
        contactEmail: input.contactEmail,
        contactName: input.contactName ?? null,
        rolesJson: rolesJson,
        teamSize: input.teamSize || null,
        tier: tier.key,
        customRequests: input.customRequests,
        totalPeople: totals.totalPeople,
        totalMinutesPerDay: Math.round(totals.totalMinutesPerDay),
        totalAnnualValue: Math.round(totals.totalAnnualValue),
        fteEquivalents: totals.fteEquivalents ? String(totals.fteEquivalents) : null,
        userAgent: userAgent,
        ipHash: ipHash,
      })
      .returning({ id: teamInquiryRequests.id })
    insertedRow = results[0]
  } catch (dbErr) {
    console.error("[build-a-team/inquiry] db insert failed", dbErr)
    return NextResponse.json({ error: "We couldn't process your request. Please try again shortly." }, { status: 500 })
  }

  if (!insertedRow) {
    return NextResponse.json({ error: "We couldn't process your request. Please try again shortly." }, { status: 500 })
  }

  const generatedAt = new Date().toISOString().slice(0, 10)
  let pdfBuffer: Buffer | null = null
  let pdfError: string | null = null

  try {
    const cartWithSelections: CartItemWithSelection[] = input.roles.map(r => ({
      slug: r.slug,
      count: r.count,
      selectedTaskIds: r.selectedTaskIds,
    }))
    const roleSections = computeRoleSections(cartWithSelections, roleDataBySlug)
    const topModules = computeTopModules(roleSections)
    const allTasks = roleSections.flatMap(r => r.topTasks)
    const phases = computePhases(allTasks)

    pdfBuffer = await renderTeamDeckPdf({
      teamLabel: `${input.contactName ?? input.contactEmail}'s team`,
      contactEmail: input.contactEmail,
      contactName: input.contactName,
      customRequests: input.customRequests,
      totals,
      roles: roleSections,
      topModules,
      phases,
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
  <p>We'll be in touch shortly to talk through the build. If you'd like to move faster, start with an audit at <a href="${AGENCY.enquireUrl}" style="color:#2563eb;">${AGENCY.enquireUrl}</a>.</p>
  <p style="margin-top:24px;">&mdash; ${escapeHtml(AGENCY.name)}</p>
</div>`.trim(),
      text: `Your team blueprint is attached.\n\nThanks ${input.contactName ?? input.contactEmail}. The PDF covers your ${totals.totalPeople}-person team (${totals.fteEquivalents} FTEs reclaimed/day).\n\nStart with an audit: ${AGENCY.enquireUrl}\n\n— ${AGENCY.name}`,
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

  try {
    await db
      .update(teamInquiryRequests)
      .set({
        pdfSentAt: emailSent ? new Date().toISOString() : null,
        pdfSendError: emailError ?? pdfError,
      })
      .where(eq(teamInquiryRequests.id, insertedRow.id))
  } catch (updateErr) {
    console.error("[build-a-team/inquiry] update status failed", updateErr)
  }

  return NextResponse.json({ ok: true })
}
