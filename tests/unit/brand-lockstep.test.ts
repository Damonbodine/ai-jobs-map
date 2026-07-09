import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it, expect } from "vitest"
import { BRAND, DATA_SERIES } from "@/lib/brand"

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")
const cssToken = (name: string): string | undefined =>
  css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase()

describe("brand lockstep — lib/brand.ts mirrors app/globals.css @theme", () => {
  const pairs: [string, string][] = [
    ["background", BRAND.background],
    ["card", BRAND.card],
    ["foreground", BRAND.foreground],
    ["secondary", BRAND.secondary],
    ["muted-foreground", BRAND.mutedForeground],
    ["accent", BRAND.accent],
    ["cyan", BRAND.cyan],
    ["destructive", BRAND.destructive],
    ["success", BRAND.success],
    ["terminal", BRAND.terminal],
    ["terminal-foreground", BRAND.terminalForeground],
  ]
  it.each(pairs)("--color-%s matches BRAND", (name, hex) => {
    expect(cssToken(name)).toBe(hex.toLowerCase())
  })

  it("DATA_SERIES is a 6-color ramp of valid hex values", () => {
    expect(DATA_SERIES).toHaveLength(6)
    for (const c of DATA_SERIES) expect(c).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it("radius tokens are zero (engineering edge)", () => {
    expect(css).toMatch(/--radius-lg:\s*0rem/)
  })
})
