/**
 * Shared color palette + base style fragments for all PDF templates.
 * Both blueprint.tsx (single occupation) and department.tsx (cart of
 * roles) import from here so brand colors stay in lock-step.
 */

export const PDF_COLORS = {
  bg: "#fafaf7",
  fg: "#221f1c",
  muted: "#6b6661",
  accent: "#2563eb",
  accentSoft: "#eff6ff",
  border: "#e5e0d8",
  cardBg: "#ffffff",
} as const
