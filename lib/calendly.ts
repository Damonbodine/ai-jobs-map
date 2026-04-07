/**
 * Calendly configuration for scoping-call bookings.
 *
 * The actual URL lives in the `NEXT_PUBLIC_CALENDLY_URL` env var so it can
 * be rotated without a code change. Falls back to a placeholder in dev —
 * the Calendly embed will render a 404 card until you set the env var,
 * which is loud enough during manual QA to catch before shipping.
 */

export const CALENDLY = {
  url:
    process.env.NEXT_PUBLIC_CALENDLY_URL ||
    "https://calendly.com/damonbodine/scoping-call",
  // Default pageSettings used by the InlineWidget. These match the
  // Recovery Ink design system: warm white background, blue accent.
  pageSettings: {
    backgroundColor: "ffffff",
    hideEventTypeDetails: false,
    hideLandingPageDetails: false,
    primaryColor: "2563eb", // matches --accent
    textColor: "221f1c", // matches --foreground
  },
} as const
