import { NextResponse } from "next/server"
import { buildATeamPdfSchema } from "@/lib/validation/build-a-team"
import { sendEmail } from "@/lib/resend"
import { db } from "@/lib/db/client"
import { occupations, occupationAutomationProfile, jobMicroTasks, departmentRoiRequests } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import { renderDepartmentPdf } from "@/lib/pdf/render"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"
import { AGENCY, SITE } from "@/lib/site"
import { computeDepartmentTotals, type RoleData } from "@/lib/build-a-team/compute"
import { EMAIL_STYLES } from "@/lib/email/brand"

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

  // Fetch every occupation in the cart. We never trust
  // client-sent display values — the PDF numbers are computed from the
  // canonical hourly_wage and the live task list.
  const slugs = input.cart.map((c) => c.slug)
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

  if (occupationsList.length === 0) {
    return NextResponse.json(
      { error: "Unknown roles in cart" },
      { status: 400 }
    )
  }

  // Fetch profiles + tasks for every occupation in parallel.
  const occupationIds = occupationsList.map((o) => o.id)
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

  // Build the per-slug RoleData map for the compute helper.
  const roleDataBySlug = new Map<string, RoleData>()
  for (const occ of occupationsList) {
    roleDataBySlug.set(occ.slug, {
      occupation: occ as any,
      profile: (profiles ?? []).find((p) => p.occupation_id === occ.id) as any ?? null,
      tasks: (tasks ?? []).filter((t) => t.occupation_id === occ.id) as any[],
    })
  }

  const totals = computeDepartmentTotals(input.cart, roleDataBySlug)

  // Save the lead row FIRST.
  let insertedRow: { id: string } | undefined
  try {
    const results = await db
      .insert(departmentRoiRequests)
      .values({
        email: input.email,
        teamLabel: input.teamLabel ?? null,
        cart: input.cart,
        totalPeople: totals.totalPeople,
        totalMinutesPerDay: Math.round(totals.totalMinutesPerDay),
        totalAnnualValue: Math.round(totals.totalAnnualValue),
        fteEquivalents: totals.fteEquivalents ? String(totals.fteEquivalents) : null,
        userAgent: userAgent,
        ipHash: ipHash,
      })
      .returning({ id: departmentRoiRequests.id })
    insertedRow = results[0]
  } catch (dbErr) {
    console.error("[build-a-team] database insert failed", dbErr)
    return NextResponse.json(
      { error: "We couldn't process your request. Please try again shortly." },
      { status: 500 }
    )
  }

  if (!insertedRow) {
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
<div style="${EMAIL_STYLES.shell}">
  <h2 style="font-size: 20px; margin: 0 0 12px;">Your department blueprint is attached.</h2>
  <p>Thanks for using the ${escapeHtml(SITE.name)} team builder. The attached PDF summarizes the compounded time-back and annual value for <strong>${safeLabel}</strong> &mdash; share it with your team or your CFO.</p>
  <p>If the numbers make sense and you&apos;d like to talk about a real build, start with an audit at <a href="${AGENCY.enquireUrl}" style="${EMAIL_STYLES.link}">${AGENCY.enquireUrl}</a>.</p>
  <p style="margin-top:24px;">&mdash; ${escapeHtml(AGENCY.name)}</p>
</div>`.trim(),
      text: `Your department blueprint is attached.

Thanks for using the ${SITE.name} team builder. The attached PDF summarizes the compounded time-back and annual value for ${input.teamLabel ?? "your team"} — share it with your team or your CFO.

If the numbers make sense and you'd like to talk about a real build, start with an audit at ${AGENCY.enquireUrl}.

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

  try {
    await db
      .update(departmentRoiRequests)
      .set({
        pdfSentAt: emailSent ? new Date().toISOString() : null,
        pdfSendError: emailError ?? pdfError,
      })
      .where(eq(departmentRoiRequests.id, insertedRow.id))
  } catch (updateErr) {
    console.error("[build-a-team] update status failed", updateErr)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
