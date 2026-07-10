/**
 * Shared color palette + base style fragments for all PDF templates.
 * Both blueprint.tsx (single occupation) and department.tsx (cart of
 * roles) import from here so brand colors stay in lock-step.
 */

import { BRAND, DATA_SERIES } from "@/lib/brand"

function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "")
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${red},${green},${blue},${alpha})`
}

export const PDF_COLORS = {
  bg: BRAND.background,
  fg: BRAND.foreground,
  muted: BRAND.mutedForeground,
  accent: BRAND.accent,
  cyan: BRAND.cyan,
  accentSoft: withAlpha(BRAND.accent, 0.1),
  secondary: BRAND.secondary,
  border: withAlpha(BRAND.foreground, 0.14),
  cardBg: BRAND.card,
  success: BRAND.success,
  successSoft: withAlpha(BRAND.success, 0.1),
  destructive: BRAND.destructive,
  terminal: BRAND.terminal,
  terminalForeground: BRAND.terminalForeground,
  terminalMuted: withAlpha(BRAND.terminalForeground, 0.7),
  terminalDim: withAlpha(BRAND.terminalForeground, 0.4),
  terminalSubtle: withAlpha(BRAND.terminalForeground, 0.08),
  terminalHairline: withAlpha(BRAND.terminalForeground, 0.15),
} as const

export const PDF_MODULE_ACCENTS: Record<string, string> = {
  intake: DATA_SERIES[0],
  analysis: DATA_SERIES[3],
  documentation: DATA_SERIES[1],
  coordination: DATA_SERIES[2],
  exceptions: DATA_SERIES[4],
  learning: DATA_SERIES[5],
  research: DATA_SERIES[0],
  compliance: DATA_SERIES[3],
  communication: DATA_SERIES[1],
  data_reporting: DATA_SERIES[2],
}
