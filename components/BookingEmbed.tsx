"use client"

import { BOOKING } from "@/lib/booking"

/**
 * Inline Google Calendar appointment-schedule widget, wrapped in the site's
 * card styling. Unlike the old Calendly embed, Google booking pages don't
 * support prefilling the visitor's name/email.
 *
 * Props:
 * - url: override the default schedule URL (must be a full
 *   calendar.google.com appointment-schedule URL).
 * - minHeight: the iframe height in pixels.
 */
export function BookingEmbed({
  url,
  minHeight = 680,
}: {
  url?: string
  minHeight?: number
}) {
  const base = url ?? BOOKING.url
  const embedSrc = url
    ? `${url}${url.includes("?") ? "&" : "?"}gv=true`
    : BOOKING.embedUrl

  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      style={{ minHeight }}
    >
      <iframe
        src={embedSrc}
        title="Book a scoping call"
        style={{ width: "100%", height: `${minHeight}px`, border: 0 }}
        loading="lazy"
      />
      <p className="px-4 py-2 text-xs text-muted-foreground">
        Trouble with the calendar?{" "}
        <a
          href={base}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Open the booking page in a new tab
        </a>
        .
      </p>
    </div>
  )
}
