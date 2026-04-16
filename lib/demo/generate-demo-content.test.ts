// lib/demo/generate-demo-content.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { generateDemoContent } from "./generate-demo-content"
import type { MicroTask } from "@/types"

const VALID_RESPONSE = {
  narrative: "Alex used to spend 45 minutes each morning triaging requests. Scout pre-sorts overnight — she opens a clean queue and moves on in 3 minutes.",
  loop: {
    inputs:  ["12 new service tickets", "3 escalation alerts", "Overnight system logs"],
    actions: ["Scores urgency 1–5", "Groups by department", "Flags 2 items needing approval"],
    outputs: ["Priority queue (top 6)", "2 escalations flagged", "9 items auto-routed"],
    humanAction: "Alex confirms the two escalations and approves the queue — 3 min total.",
  },
  output: {
    format:  "prose",
    label:   "MORNING BRIEFING",
    content: "Good morning, Alex. Scout processed 12 new tickets overnight.\n\nPRIORITY QUEUE — 6 items today:\n\n1. [ESCALATION] Server outage in Region 2 — 4 hours unresolved. Requires your decision.\n2. Budget approval request from Finance — due today.\n3. Client onboarding stalled — missing credentials.\n\nAuto-routed (9 items): status updates and FYIs filed by project.",
  },
}

beforeEach(() => {
  vi.stubEnv("OPENROUTER_API_KEY", "test-key")
})

describe("generateDemoContent", () => {
  it("parses a valid Claude response into agent content", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(VALID_RESPONSE) } }],
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    const tasks: MicroTask[] = [
      {
        id: 1, occupation_id: 1,
        task_name: "triage service requests", task_description: "prioritize incoming requests",
        frequency: "daily", ai_applicable: true,
        ai_how_it_helps: "sorts by urgency", ai_impact_level: 4,
        ai_effort_to_implement: null, ai_category: null, ai_tools: null,
      },
    ]

    const result = await generateDemoContent({
      occupationTitle: "Service Manager",
      moduleKey: "intake",
      tasks,
    })

    expect(result.narrative).toContain("Alex")
    expect(result.loop.inputs).toHaveLength(3)
    expect(result.loop.actions).toHaveLength(3)
    expect(result.loop.outputs).toHaveLength(3)
    expect(result.loop.humanAction).toBeTruthy()
    expect(result.output.format).toMatch(/^(prose|table|code)$/)
    expect(result.output.label).toBeTruthy()
    expect(result.output.content).toBeTruthy()
  })

  it("sends a POST to OpenRouter with Authorization header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(VALID_RESPONSE) } }],
      }),
    })
    vi.stubGlobal("fetch", mockFetch)

    await generateDemoContent({
      occupationTitle: "Nurse",
      moduleKey: "intake",
      tasks: [],
    })

    expect(mockFetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      })
    )
  })

  it("throws when the API returns a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 429,
      json: async () => ({ error: "rate limited" }),
    }))

    await expect(
      generateDemoContent({ occupationTitle: "Nurse", moduleKey: "intake", tasks: [] })
    ).rejects.toThrow("OpenRouter API error")
  })
})
