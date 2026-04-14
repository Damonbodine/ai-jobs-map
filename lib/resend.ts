import { Resend } from "resend"
import { CONTACT } from "@/lib/site"

/**
 * Lazy singleton — the Resend SDK reads process.env once at construction, so
 * we defer instantiation until first use. This also prevents build-time
 * failures when the API key isn't present in static analysis contexts.
 */
let client: Resend | null = null

function getClient(): Resend {
  if (client) return client
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env.local or your Vercel env."
    )
  }
  client = new Resend(key)
  return client
}

type SendArgs = {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
}

/**
 * Thin wrapper so every call site uses the same From address and surfaces
 * errors consistently. Always pass both `html` and `text` — some clients
 * (and spam filters) will downgrade HTML-only messages.
 */
export async function sendEmail(args: SendArgs): Promise<void> {
  const from =
    process.env.RESEND_FROM_EMAIL ||
    `AI Timeback <onboarding@resend.dev>` // dev fallback only
  const resend = getClient()
  const { error } = await resend.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo ?? CONTACT.replyTo,
    attachments: args.attachments,
  })
  if (error) {
    // Surface the full error to the server logs — do NOT swallow it.
    // API routes that call this should catch and return a 500 to the client
    // without leaking the message.
    console.error("[resend] send failed", error)
    throw new Error(`Resend send failed: ${error.message}`)
  }
}
