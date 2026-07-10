import { BRAND } from "@/lib/brand"

/**
 * Shared inline styles for transactional HTML email. Email clients cannot
 * consume the web app's CSS variables, so these strings mirror the canonical
 * TypeScript palette while retaining broad system-font fallbacks.
 */
export const EMAIL_STYLES = {
  shell: `font-family: Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 560px; color: ${BRAND.foreground}; background: ${BRAND.background}; padding: 24px; border: 1px solid ${BRAND.secondary};`,
  panel: `padding: 12px; background: ${BRAND.secondary}; border-left: 3px solid ${BRAND.cyan};`,
  card: `padding: 12px; background: ${BRAND.card}; border: 1px solid ${BRAND.secondary};`,
  muted: `color: ${BRAND.mutedForeground};`,
  link: `color: ${BRAND.accent}; font-weight: 600;`,
} as const
