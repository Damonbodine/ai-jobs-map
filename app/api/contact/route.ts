import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { contactFormSchema } from "@/lib/validation/contact"
import { sendEmail } from "@/lib/resend"
import { createServerClient } from "@/lib/supabase/server"
import { CONTACT, AGENCY, SITE } from "@/lib/site"

export const runtime = "nodejs"

// Minimal in-memory rate limit: 5 submissions per IP per 10 minutes.
// This resets on every cold start — good enough as a speed bump against
// casual abuse. For real protection, add Vercel BotID or upstash ratelimit
// in Plan 4 (instrumentation).
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function isRateLimited(ipHash: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ipHash) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ipHash, recent)
    return true
  }
  recent.push(now)
  hits.set(ipHash, recent)
  return false
}

function hashIp(ip: string | null): string {
  return createHash("sha256")
    .update(ip ?? "unknown")
    .digest("hex")
    .slice(0, 32)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  const ipHash = hashIp(ip)
  const userAgent = request.headers.get("user-agent") ?? null

  if (isRateLimited(ipHash)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  const parsed = contactFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  // Honeypot: if `website` is non-empty, pretend success but do nothing.
  // This is intentional — we don't want bots learning they were detected.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const { name, email, company, message } = parsed.data

  // Insert into Supabase using the service-role client.
  const supabase = createServerClient()
  const { error: dbError } = await supabase.from("contact_messages").insert({
    name,
    email,
    company: company || null,
    message,
    source: "contact-page",
    user_agent: userAgent,
    ip_hash: ipHash,
  })

  if (dbError) {
    console.error("[contact] supabase insert failed", dbError)
    return NextResponse.json(
      { error: "We couldn't save your message. Please try again shortly." },
      { status: 500 }
    )
  }

  // Notify damon@placetostandagency.com via Resend.
  // If Resend fails, we still return success because the DB row is the
  // source of truth — the lead is saved and can be followed up manually.
  try {
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeCompany = company ? escapeHtml(company) : ""
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>")
    await sendEmail({
      to: CONTACT.email,
      replyTo: email,
      subject: `New contact: ${name}${company ? ` (${company})` : ""}`,
      html: `
<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px;">
  <h2 style="font-size: 18px; margin: 0 0 12px;">New contact form submission</h2>
  <p style="margin: 0 0 8px;"><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
  ${safeCompany ? `<p style="margin: 0 0 8px;"><strong>Company:</strong> ${safeCompany}</p>` : ""}
  <p style="margin: 16px 0 8px;"><strong>Message:</strong></p>
  <div style="padding: 12px; background: #f7f5f0; border-radius: 8px; border-left: 3px solid #2563eb;">
    ${safeMessage}
  </div>
  <p style="margin: 24px 0 0; font-size: 12px; color: #777;">
    Submitted via ${SITE.name} — ${AGENCY.name}
  </p>
</div>
      `.trim(),
      text: `New contact form submission

From: ${name} <${email}>
${company ? `Company: ${company}\n` : ""}
Message:
${message}

Submitted via ${SITE.name} — ${AGENCY.name}`,
    })
  } catch (err) {
    // DB already succeeded — the message is saved even if email failed.
    // Log loudly so we can follow up manually and fix Resend config.
    console.error("[contact] resend notification failed", err)
    // Do NOT fail the request; the user's message was saved. We'll see it
    // in Supabase even if the email didn't go.
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
