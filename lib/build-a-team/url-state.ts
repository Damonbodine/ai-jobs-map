/**
 * URL state for the Build a Team cart.
 *
 * Format: `?roles=software-developers:3,registered-nurses:2`
 *
 * Why a flat string and not base64-JSON: shareable URLs are read by
 * humans before they're clicked. "I'm thinking 3 devs and 2 nurses"
 * is recoverable from a glance at the URL bar, which is a small but
 * real trust signal for the recipient. Also: server-renderable from
 * searchParams without any client decoding.
 */

export type CartRow = {
  slug: string
  count: number
}

const SLUG_PATTERN = /^[a-z0-9-]{1,200}$/

/**
 * Parse the `?roles=` query string into a cart. Invalid entries
 * are silently dropped (so a tampered URL produces a partial cart
 * rather than crashing the page). Counts are clamped to 1..999.
 */
export function decodeCart(value: string | null | undefined): CartRow[] {
  if (!value) return []
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [slug, rawCount] = entry.split(":")
      if (!slug || !SLUG_PATTERN.test(slug)) return null
      const count = Number.parseInt(rawCount ?? "1", 10)
      if (!Number.isFinite(count) || count < 1) return null
      return { slug, count: Math.min(999, Math.max(1, count)) }
    })
    .filter((row): row is CartRow => row !== null)
}

/**
 * Serialize a cart back to the query string format. Empty cart
 * returns an empty string (caller should omit `?roles=` entirely).
 */
export function encodeCart(rows: CartRow[]): string {
  return rows
    .filter((r) => r.slug && r.count >= 1)
    .map((r) => `${r.slug}:${r.count}`)
    .join(",")
}

/**
 * Apply a single mutation to a cart. Returns a new array.
 * - Adding an existing slug increments its count.
 * - Setting count to 0 removes the row.
 */
export function mutateCart(
  cart: CartRow[],
  slug: string,
  delta: { setCount?: number; addCount?: number }
): CartRow[] {
  const existing = cart.find((r) => r.slug === slug)
  const nextCount = (() => {
    if (delta.setCount !== undefined) return delta.setCount
    if (delta.addCount !== undefined) return (existing?.count ?? 0) + delta.addCount
    return existing?.count ?? 0
  })()
  const clamped = Math.min(999, Math.max(0, Math.round(nextCount)))
  if (clamped === 0) {
    return cart.filter((r) => r.slug !== slug)
  }
  if (existing) {
    return cart.map((r) => (r.slug === slug ? { ...r, count: clamped } : r))
  }
  return [...cart, { slug, count: clamped }]
}
