// lib/demo/agent-metadata.test.ts
import { describe, it, expect } from "vitest"
import { MODULE_KEYS } from "@/lib/modules"
import { getAgentMetadata } from "./agent-metadata"

describe("getAgentMetadata", () => {
  it("returns metadata for every module key", () => {
    for (const key of MODULE_KEYS) {
      const meta = getAgentMetadata(key)
      expect(meta.agentName, `agentName missing for ${key}`).toBeTruthy()
      expect(meta.label, `label missing for ${key}`).toBeTruthy()
      expect(meta.accentColor, `accentColor missing for ${key}`).toMatch(/^#[0-9a-f]{6}$/i)
      expect(meta.timeOfDay, `timeOfDay missing for ${key}`).toBeTruthy()
    }
  })

  it("returns Scout for intake module", () => {
    expect(getAgentMetadata("intake").agentName).toBe("Scout")
  })
})
