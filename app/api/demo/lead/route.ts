// app/api/demo/lead/route.ts
// POST captures an email + the task description that generated the custom demo.
// Writes to Supabase first (source of truth), then notifies Damon via Resend.
// If Resend fails we still return success — the lead is saved and followable manually.

import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/resend"
import { CONTACT, AGENCY, SITE } from "@/lib/site"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"

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

  const { email, taskDescription, occupationContext } = parsed.data

  const supabase = createServerClient()
  const { error: dbError } = await supabase.from("demo_leads").insert({
    email,
    task_description: taskDescription,
    occupation_context: occupationContext ?? null,
    ip_hash: ipHash,
  })

  if (dbError) {
    console.error("[demo/lead] supabase insert failed", dbError)
    return NextResponse.json(
      { error: "We couldn't save that. Please try again shortly." },
      { status: 500 }
    )
  }

  // Notify damon@placetostandagency.com via Resend.
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
    // Do NOT fail the request; the lead is saved in Supabase.
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
