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

export const PDF_MODULE_ACCENTS: Record<string, string> = {
  intake: "#06b6d4",
  analysis: "#6366f1",
  documentation: "#8b5cf6",
  coordination: "#10b981",
  exceptions: "#f59e0b",
  learning: "#f43f5e",
  research: "#14b8a6",
  compliance: "#ef4444",
  communication: "#f97316",
  data_reporting: "#0ea5e9",
}
