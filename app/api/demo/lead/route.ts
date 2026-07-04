// app/api/demo/lead/route.ts
// POST captures an email + the task description that generated the custom demo.
// Writes to Postgres first (source of truth), then notifies Damon via Resend.
// If Resend fails we still return success — the lead is saved and followable manually.

import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { demoLeads, demoGenerations } from "@/lib/db/schema"
import { sendEmail } from "@/lib/resend"
import { CONTACT, AGENCY, SITE } from "@/lib/site"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"
import type { DemoRoleData } from "@/lib/demo/types"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export const runtime = "nodejs"

const requestSchema = z.object({
  email: z.string().trim().email().max(200),
  taskDescription: z.string().trim().min(1).max(800),
  occupationContext: z.string().trim().max(120).optional(),
  generationId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const ipHash = hashIp(ip)

  // 3 lead submissions per IP per hour is plenty for genuine users and
  // well below what a bot would try.
  if (
    isRateLimited("demo-lead", ipHash, {
      windowMs: 60 * 60 * 1000,
      max: 3,
    })
  ) {
    return NextResponse.json(
      { error: "Too many submissions. Try again shortly." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { email, taskDescription, occupationContext, generationId } = parsed.data

  try {
    await db.insert(demoLeads).values({
      email,
      taskDescription,
      occupationContext: occupationContext ?? null,
      ipHash: ipHash,
      generationId: generationId ?? null,
    })
  } catch (dbError) {
    console.error("[demo/lead] database insert failed", dbError)
    return NextResponse.json(
      { error: "We couldn't save that. Please try again shortly." },
      { status: 500 }
    )
  }

  // Notify CONTACT.email via Resend.
  // DB already succeeded — if Resend fails, the lead is still saved and
  // followable manually. Log loudly so we can fix Resend config.
  try {
    const safeEmail = escapeHtml(email)
    const safeTask = escapeHtml(taskDescription).replace(/\n/g, "<br/>")
    const safeContext = occupationContext ? escapeHtml(occupationContext) : ""
    await sendEmail({
      to: CONTACT.email,
      replyTo: email,
      subject: `New demo lead: ${email}${safeContext ? ` (${safeContext})` : ""}`,
      html: `
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px;">
  <h2 style="font-size: 18px; margin: 0 0 12px;">Custom demo lead</h2>
  <p style="margin: 0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
  ${safeContext ? `<p style="margin: 0 0 8px;"><strong>Role:</strong> ${safeContext}</p>` : ""}
  <p style="margin: 16px 0 8px;"><strong>Task they described:</strong></p>
  <div style="padding: 12px; background: #f7f5f0; border-radius: 8px; border-left: 3px solid #2563eb;">
    ${safeTask}
  </div>
  <p style="margin: 24px 0 0; font-size: 12px; color: #777;">
    Submitted via ${SITE.name} /demo/try — ${AGENCY.name}
  </p>
</div>
      `.trim(),
      text: `Custom demo lead

Email: ${email}
${occupationContext ? `Role: ${occupationContext}\n` : ""}
Task they described:
${taskDescription}

Submitted via ${SITE.name} /demo/try — ${AGENCY.name}`,
    })
  } catch (err) {
    console.error("[demo/lead] resend notification failed", err)
    // Do NOT fail the request; the lead is saved in the database.
  }

  // Send the prospect their demo summary. The role content is loaded
  // server-side from demo_generations (never trusted from the client). If the
  // lookup fails we still send an acknowledgment so the success copy in the
  // UI stays honest.
  try {
    let role: DemoRoleData | null = null
    if (generationId) {
      try {
        const rows = await db
          .select({ generatedRole: demoGenerations.generatedRole })
          .from(demoGenerations)
          .where(eq(demoGenerations.id, generationId))
          .limit(1)
        role = (rows[0]?.generatedRole as DemoRoleData | null) ?? null
      } catch (lookupErr) {
        console.error("[demo/lead] generation lookup failed", lookupErr)
      }
    }

    const safeTask = escapeHtml(taskDescription).replace(/\n/g, "<br/>")
    const minutesSaved = role
      ? role.totalBeforeMinutes - role.totalAfterMinutes
      : null

    const agentHtml =
      role && role.agents.length > 0
        ? role.agents
            .map(
              (a) => `
  <div style="padding: 12px; background: #f7f5f0; border-radius: 8px; margin: 0 0 8px;">
    <p style="margin: 0; font-weight: 600;">${escapeHtml(a.agentName)} — ${escapeHtml(a.label)}</p>
    <p style="margin: 4px 0 0; font-size: 14px; color: #444;">${escapeHtml(a.narrative)}</p>
    <p style="margin: 6px 0 0; font-size: 13px; color: #2563eb;">${a.beforeMinutes} min → ${a.afterMinutes} min</p>
  </div>`
            )
            .join("")
        : ""

    const agentText =
      role && role.agents.length > 0
        ? role.agents
            .map(
              (a) =>
                `${a.agentName} — ${a.label}\n${a.narrative}\n${a.beforeMinutes} min → ${a.afterMinutes} min`
            )
            .join("\n\n")
        : ""

    await sendEmail({
      to: email,
      replyTo: CONTACT.replyTo,
      subject: `Your custom AI agent demo — ${SITE.name}`,
      html: `
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px;">
  <h2 style="font-size: 18px; margin: 0 0 12px;">Here's the agent we sketched for your task</h2>
  <p style="margin: 0 0 8px;"><strong>You described:</strong></p>
  <div style="padding: 12px; background: #f7f5f0; border-radius: 8px; border-left: 3px solid #2563eb; margin: 0 0 16px;">
    ${safeTask}
  </div>
  ${agentHtml}
  ${
    minutesSaved && minutesSaved > 0
      ? `<p style="margin: 16px 0 8px;"><strong>Estimated time back: ~${minutesSaved} minutes a day.</strong> These numbers are estimates — we refine them during scoping.</p>`
      : ""
  }
  <p style="margin: 16px 0 8px;">We'll follow up personally within a day. If you'd like to move faster, book a 30-minute scoping call — we'll walk through what a real build of this looks like, no pitch:</p>
  <p style="margin: 0 0 16px;"><a href="${SITE.url}/contact#book" style="color:#2563eb;">${SITE.url}/contact#book</a></p>
  <p style="margin: 24px 0 0; font-size: 12px; color: #777;">
    ${SITE.name} — a project by ${AGENCY.name}
  </p>
</div>
      `.trim(),
      text: `Here's the agent we sketched for your task

You described:
${taskDescription}
${agentText ? `\n${agentText}\n` : ""}${
        minutesSaved && minutesSaved > 0
          ? `\nEstimated time back: ~${minutesSaved} minutes a day. These numbers are estimates — we refine them during scoping.\n`
          : ""
      }
We'll follow up personally within a day. To move faster, book a 30-minute scoping call: ${SITE.url}/contact#book

${SITE.name} — a project by ${AGENCY.name}`,
    })
  } catch (err) {
    console.error("[demo/lead] prospect email failed", err)
    // Do NOT fail the request; the lead is saved and the owner was notified.
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
