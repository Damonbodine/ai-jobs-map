/**
 * Shared color palette + base style fragments for all PDF templates.
 * Both blueprint.tsx (single occupation) and department.tsx (cart of
 * roles) import from here so brand colors stay in lock-step.
 */

import { BRAND, DATA_SERIES } from "@/lib/brand"

function mixHex(foreground: string, background: string, opacity: number): string {
  const readChannel = (hex: string, start: number) =>
    Number.parseInt(hex.replace("#", "").slice(start, start + 2), 16)
  const mixed = [0, 2, 4].map((start) =>
    Math.round(
      readChannel(foreground, start) * opacity +
        readChannel(background, start) * (1 - opacity)
    )
      .toString(16)
      .padStart(2, "0")
  )
  return `#${mixed.join("")}`
}

export const PDF_COLORS = {
  bg: BRAND.background,
  fg: BRAND.foreground,
  muted: BRAND.mutedForeground,
  accent: BRAND.accent,
  cyan: BRAND.cyan,
  accentSoft: mixHex(BRAND.accent, BRAND.background, 0.1),
  secondary: BRAND.secondary,
  border: mixHex(BRAND.foreground, BRAND.background, 0.14),
  cardBg: BRAND.card,
  success: BRAND.success,
  successSoft: mixHex(BRAND.success, BRAND.background, 0.1),
  destructive: BRAND.destructive,
  terminal: BRAND.terminal,
  terminalForeground: BRAND.terminalForeground,
  terminalMuted: mixHex(BRAND.terminalForeground, BRAND.terminal, 0.7),
  terminalDim: mixHex(BRAND.terminalForeground, BRAND.terminal, 0.4),
  terminalSubtle: mixHex(BRAND.terminalForeground, BRAND.terminal, 0.08),
  terminalHairline: mixHex(BRAND.terminalForeground, BRAND.terminal, 0.15),
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
