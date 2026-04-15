// lib/demo/demo-scripts.test.ts
import { describe, it, expect } from "vitest"
import { DEMO_ROLE_SCRIPTS } from "./demo-scripts"

describe("DEMO_ROLE_SCRIPTS", () => {
  it("has exactly 3 roles", () => {
    expect(DEMO_ROLE_SCRIPTS).toHaveLength(3)
  })

  it("each role has exactly 5 agents", () => {
    for (const role of DEMO_ROLE_SCRIPTS) {
      expect(role.agents).toHaveLength(5)
    }
  })

  it("each agent has loop with exactly 3 inputs, 3 actions, 3 outputs", () => {
    for (const role of DEMO_ROLE_SCRIPTS) {
      for (const agent of role.agents) {
        expect(agent.loop.inputs).toHaveLength(3)
        expect(agent.loop.actions).toHaveLength(3)
        expect(agent.loop.outputs).toHaveLength(3)
        expect(agent.loop.humanAction).toBeTruthy()
      }
    }
  })

  it("each agent has non-empty output content", () => {
    for (const role of DEMO_ROLE_SCRIPTS) {
      for (const agent of role.agents) {
        expect(agent.output.content.length).toBeGreaterThan(50)
      }
    }
  })

  it("role slugs match expected values", () => {
    const slugs = DEMO_ROLE_SCRIPTS.map((r) => r.slug)
    expect(slugs).toContain("general-and-operations-managers")
    expect(slugs).toContain("financial-analysts")
    expect(slugs).toContain("software-developers")
  })
})
