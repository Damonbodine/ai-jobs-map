"use client"

import { InlineWidget } from "react-calendly"
import { CALENDLY } from "@/lib/calendly"

/**
 * Inline Calendly scheduling widget, wrapped in the site's card styling
 * and pre-configured with the design-system palette from lib/calendly.ts.
 *
 * Props:
 * - url: override the default Calendly URL (e.g., for a tier-specific
 *   event type). Falls back to CALENDLY.url from the env var.
 * - minHeight: the iframe height in pixels. Calendly recommends 630+.
 * - prefill: optional { email, name } to pre-populate the scheduling form.
 */
export function CalendlyEmbed({
  url,
  minHeight = 680,
  prefill,
}: {
  url?: string
  minHeight?: number
  prefill?: {
    email?: string
    name?: string
  }
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      style={{ minHeight }}
    >
      <InlineWidget
        url={url ?? CALENDLY.url}
        pageSettings={CALENDLY.pageSettings}
        prefill={prefill}
        styles={{ minWidth: "100%", height: `${minHeight}px` }}
      />
    </div>
  )
}
