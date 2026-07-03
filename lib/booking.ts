/**
 * Google Calendar appointment-schedule configuration for scoping-call
 * bookings (replaced Calendly 2026-07).
 *
 * The URL lives in `NEXT_PUBLIC_BOOKING_URL` so it can be rotated without a
 * code change. It must be the FULL calendar.google.com appointment-schedule
 * URL (not the calendar.app.google short link — that variant refuses to
 * render inside an iframe). Falls back to the current schedule in dev.
 */

const SCHEDULE_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL ||
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ26phBIUhHWnbnZuddmQx2PYx0aCiqy7oX6gJa0WE3roYg5raL6eFLEQmGnmVj3NM20fyNu8QWg"

export const BOOKING = {
  /** Page users can open in a new tab. */
  url: SCHEDULE_URL,
  /** Google's embeddable variant — served without X-Frame-Options. */
  embedUrl: `${SCHEDULE_URL}${SCHEDULE_URL.includes("?") ? "&" : "?"}gv=true`,
} as const
