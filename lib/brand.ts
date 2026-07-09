/**
 * Blueprint Light palette as TypeScript constants — the single source for
 * surfaces that cannot read CSS variables: PDF templates (@react-pdf),
 * inline-HTML emails (app/api routes), and app/opengraph-image.tsx.
 *
 * Web tokens live in app/globals.css @theme. tests/unit/brand-lockstep
 * asserts the two never drift — change globals.css first, then this file.
 * Canonical reference: docs/brand-contract.md.
 */
export const BRAND = {
  background: "#f2f6f9",
  card: "#ffffff",
  foreground: "#0a1420",
  secondary: "#e3ecf4",
  mutedForeground: "#47586b",
  /** Interactive text/links on light surfaces (AA-safe deep cyan). */
  accent: "#0f7fa8",
  /** Fills, buttons, meters — pairs with ink text. CRL's signature cyan. */
  cyan: "#6fd4ec",
  destructive: "#b23b35",
  success: "#0f7a53",
  /** CRL-dark island panels (agent console). */
  terminal: "#0a1420",
  terminalForeground: "#e3ecf4",
} as const

/** Categorical chart ramp (TimeDonut, occupation/role builders) — cyan/slate family. */
export const DATA_SERIES = [
  "#0f7fa8",
  "#6fd4ec",
  "#0a1420",
  "#47586b",
  "#8fb4c9",
  "#c9dbe8",
] as const
