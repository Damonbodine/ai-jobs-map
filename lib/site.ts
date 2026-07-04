/**
 * Single source of truth for brand, contact, and URL metadata.
 * Every page, footer, email template, and API route must import from here —
 * NEVER hardcode these values elsewhere. If you need to change the agency
 * name or contact email, this is the only file you edit.
 */

export const SITE = {
  name: "Timeback",
  tagline: "See exactly how much time AI gives back — role by role.",
  description:
    "Discover how much time AI gives back in your specific occupation. Task-level analysis grounded in Bureau of Labor Statistics and O*NET data, delivered as a concrete implementation plan by Clear Road Labs.",
  // The fallback is intentional for local dev and preview builds. In production,
  // always set NEXT_PUBLIC_SITE_URL to the real canonical domain — otherwise
  // OpenGraph, canonical URLs, and emails will point at the vercel.app subdomain.
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://ai-jobs-map.vercel.app",
} as const

export const AGENCY = {
  name: "Clear Road Labs",
  shortName: "Clear Road Labs",
  url: "https://clearroadlabs.com",
  tagline: "We build custom AI systems for knowledge-work teams.",
} as const

export const CONTACT = {
  // Single email for public-facing address AND internal lead notifications.
  email: "damon@clearroadlabs.com",
  replyTo: "damon@clearroadlabs.com",
} as const

/**
 * Proof points used across About, Footer, and case study previews.
 * These are real engagements — update only when the underlying work changes.
 */
export const PROOF_POINTS = [
  {
    client: "Valise",
    outcome: "Reclaimed 15 hours/week from their operations team",
    shortLabel: "Valise — 15 hrs/week reclaimed",
  },
] as const
