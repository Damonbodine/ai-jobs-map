"use client"

/**
 * Thin wrapper around GA4 event tracking. Components call track(), never
 * sendGAEvent directly, so the analytics vendor stays swappable and events
 * silently no-op when NEXT_PUBLIC_GA_ID is unset (local dev, previews).
 *
 * Event names are snake_case and fire only on confirmed success (2xx) —
 * see the funnel taxonomy in the launch plan.
 */
import { sendGAEvent } from "@next/third-parties/google"

export function track(
  name: string,
  params?: Record<string, string | number | boolean>
) {
  if (!process.env.NEXT_PUBLIC_GA_ID) return
  try {
    sendGAEvent("event", name, params ?? {})
  } catch {
    // Analytics must never break the app.
  }
}
