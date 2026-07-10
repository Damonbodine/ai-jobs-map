import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { BRAND, DATA_SERIES } from "@/lib/brand"
import { EMAIL_STYLES } from "@/lib/email/brand"
import { PDF_COLORS, PDF_MODULE_ACCENTS } from "@/lib/pdf/styles"

const scopedProductionFiles = [
  "lib/pdf/styles.ts",
  "lib/pdf/blueprint.tsx",
  "lib/pdf/department.tsx",
  "lib/pdf/team-deck.tsx",
  "lib/pdf/team-deck-data.ts",
  "lib/email/brand.ts",
  "app/api/contact/route.ts",
  "app/api/inquiries/route.ts",
  "app/api/one-pager/route.ts",
  "app/api/build-a-team/inquiry/route.ts",
  "app/api/build-a-team/pdf/route.ts",
  "app/api/demo/lead/route.ts",
  "app/opengraph-image.tsx",
]

describe("non-CSS brand surfaces", () => {
  it("pins the PDF module accents to the approved DATA_SERIES slots", () => {
    expect(PDF_MODULE_ACCENTS).toEqual({
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
    })
  })

  it("derives PDF and email primitives from the canonical brand", () => {
    expect(PDF_COLORS.bg).toBe(BRAND.background)
    expect(PDF_COLORS.fg).toBe(BRAND.foreground)
    expect(PDF_COLORS.cyan).toBe(BRAND.cyan)
    expect(PDF_COLORS.terminal).toBe(BRAND.terminal)
    expect(EMAIL_STYLES.shell).toContain(BRAND.background)
    expect(EMAIL_STYLES.shell).toContain(BRAND.foreground)
    expect(EMAIL_STYLES.panel).toContain(BRAND.secondary)
    expect(EMAIL_STYLES.panel).toContain(BRAND.cyan)
    expect(EMAIL_STYLES.link).toContain(BRAND.accent)
  })

  it("contains no hardcoded six-digit hex palette in scoped production files", () => {
    for (const file of scopedProductionFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8")
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{6}\b/)
    }
  })

  it("keeps email panels square", () => {
    expect(Object.values(EMAIL_STYLES).join(" ")).not.toMatch(/border-radius/i)
  })

  it("keeps the email shell safe inside double-quoted style attributes", () => {
    expect(EMAIL_STYLES.shell).not.toContain('"')
  })
})
