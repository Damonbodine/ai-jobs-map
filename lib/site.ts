/**
 * Single source of truth for brand, contact, and URL metadata.
 * Every page, footer, email template, and API route must import from here —
 * NEVER hardcode these values elsewhere. If you need to change the agency
 * name or contact email, this is the only file you edit.
 */

export const SITE = {
  name: "AI Jobs Map",
  tagline: "Task-level AI analysis for 800+ occupations",
  description:
    "Discover how AI can save time in your specific occupation. Task-level analysis grounded in Bureau of Labor Statistics and O*NET data, delivered as a concrete implementation plan by Place To Stand Agency.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://ai-jobs-map.vercel.app",
} as const

export const AGENCY = {
  name: "Place To Stand Agency",
  shortName: "Place To Stand",
  url: "https://placetostandagency.com",
  tagline: "We build custom AI systems for knowledge-work teams.",
} as const

export const CONTACT = {
  // Single email for public-facing address AND internal lead notifications.
  email: "damon@placetostandagency.com",
  replyTo: "damon@placetostandagency.com",
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
