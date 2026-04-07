import { NextResponse } from "next/server"
import { inquirySchema } from "@/lib/validation/inquiry"
import { sendEmail } from "@/lib/resend"
import { createServerClient } from "@/lib/supabase/server"
import { renderBlueprintPdf } from "@/lib/pdf/render"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"
import { AGENCY, CONTACT, SITE } from "@/lib/site"
import { PRICING_TIERS } from "@/lib/pricing"

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

  // Re-fetch occupation-level truth so the PDF numbers are never
  // client-trusted for identity, even though the displayed minutes/value
  // flow through from the client (they are derived view state, not DB facts).
  const { data: occupation, error: occError } = await supabase
    .from("occupations")
    .select("id, title, slug, hourly_wage")
    .eq("slug", input.occupationSlug)
    .single()

  if (occError || !occupation) {
    return NextResponse.json({ error: "Unknown occupation" }, { status: 400 })
  }

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
        minutesPerDay: input.displayedMinutes,
        annualValueDollars: input.displayedAnnualValue,
        taskCount:
          input.selectedTaskIds.length || input.selectedModules.length,
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
