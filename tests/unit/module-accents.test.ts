import { describe, expect, it } from "vitest"
import { MODULE_ACCENTS, MODULE_KEYS, MODULE_REGISTRY } from "@/lib/modules"
import { DATA_SERIES } from "@/lib/brand"

describe("module accents (Blueprint Light)", () => {
  it("defines an accent for every module key", () => {
    for (const key of MODULE_KEYS) {
      expect(MODULE_ACCENTS[key], `missing accent for ${key}`).toBeDefined()
    }
  })

  it("only uses DATA_SERIES colors — no rainbow literals", () => {
    for (const key of MODULE_KEYS) {
      expect(DATA_SERIES).toContain(MODULE_ACCENTS[key])
    }
  })

  it("registry chip classes carry no dark: or rainbow utilities", () => {
    for (const def of Object.values(MODULE_REGISTRY)) {
      expect(def.color).not.toMatch(/dark:/)
      expect(def.color).not.toMatch(
        /(cyan|indigo|violet|emerald|amber|rose|teal|red|orange|sky)-\d/
      )
    }
  })
})
