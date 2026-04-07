import { createHash } from "node:crypto"

/**
 * Minimal in-memory rate limiter shared across API routes.
 *
 * LIMITATIONS (by design — Plan 4 will replace with Upstash or Vercel BotID):
 * - Per-instance memory; each serverless cold start resets the window.
 * - No persistence across deployments.
 * - No distributed coordination between instances.
 *
 * This is a speed bump, not a fortress. Honeypots + zod + reasonable
 * max-length constraints do the bulk of the protection work.
 */

type Bucket = {
  windowMs: number
  max: number
  hits: Map<string, number[]>
}

const buckets = new Map<string, Bucket>()

function getBucket(name: string, windowMs: number, max: number): Bucket {
  const existing = buckets.get(name)
  if (existing) return existing
  const bucket: Bucket = { windowMs, max, hits: new Map() }
  buckets.set(name, bucket)
  return bucket
}

export function isRateLimited(
  bucketName: string,
  ipHash: string,
  options: { windowMs: number; max: number }
): boolean {
  const bucket = getBucket(bucketName, options.windowMs, options.max)
  const now = Date.now()
  const recent = (bucket.hits.get(ipHash) ?? []).filter(
    (t) => now - t < bucket.windowMs
  )
  if (recent.length >= bucket.max) {
    bucket.hits.set(ipHash, recent)
    return true
  }
  recent.push(now)
  bucket.hits.set(ipHash, recent)
  return false
}

/**
 * Hash an IP (or fallback) to a short hex string suitable for storing
 * alongside records without ever persisting the raw IP. Also serves as
 * the rate-limit bucket key.
 */
export function hashIp(ip: string | null): string {
  return createHash("sha256")
    .update(ip ?? "unknown")
    .digest("hex")
    .slice(0, 32)
}

/**
 * Extract the client IP from Vercel edge headers. Trusted because
 * Vercel sets these — revisit if this code ever runs outside Vercel.
 */
export function getClientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  )
}
