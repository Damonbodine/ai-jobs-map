// lib/demo/resolve-demo-content.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"

// Mock dependencies before importing the module
vi.mock("./generate-demo-content", () => ({
  generateDemoContent: vi.fn(),
}))
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}))

import { resolveAgentContent } from "./resolve-demo-content"
import { generateDemoContent } from "./generate-demo-content"
import { createServerClient } from "@/lib/supabase/server"
import type { MicroTask } from "@/types"

const CACHED_ROW = {
  narrative: "Cached narrative.",
  loop_data: {
    inputs: ["a", "b", "c"],
    actions: ["x", "y", "z"],
    outputs: ["1", "2", "3"],
    humanAction: "Reviews and approves.",
  },
  output_data: { format: "prose", label: "REPORT", content: "Cached output." },
}

const GENERATED = {
  narrative: "Generated narrative.",
  loop: {
    inputs: ["a", "b", "c"],
    actions: ["x", "y", "z"],
    outputs: ["1", "2", "3"],
    humanAction: "Reviews and approves.",
  },
  output: { format: "prose" as const, label: "REPORT", content: "Generated output." },
}

function mockSupabase(cacheHit: boolean) {
  const selectChain = {
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: cacheHit ? CACHED_ROW : null,
      error: null,
    }),
  }
  const fromImpl = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue(selectChain),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  })
  vi.mocked(createServerClient).mockReturnValue({ from: fromImpl } as unknown as SupabaseClient)
  return { from: fromImpl }
}

const TASKS: MicroTask[] = [
  {
    id: 1, occupation_id: 10,
    task_name: "sort emails", task_description: "sort incoming",
    frequency: "daily", ai_applicable: true,
    ai_how_it_helps: null, ai_impact_level: 4,
    ai_effort_to_implement: null, ai_category: null, ai_tools: null,
  },
]

describe("resolveAgentContent", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns cached content when DB row exists", async () => {
    mockSupabase(true)
    const result = await resolveAgentContent({
      occupationId: 10,
      occupationTitle: "Nurse",
      moduleKey: "intake",
      tasks: TASKS,
    })
    expect(result.narrative).toBe("Cached narrative.")
    expect(generateDemoContent).not.toHaveBeenCalled()
  })

  it("generates and upserts when no cache row exists", async () => {
    const { from } = mockSupabase(false)
    vi.mocked(generateDemoContent).mockResolvedValue(GENERATED)

    const result = await resolveAgentContent({
      occupationId: 10,
      occupationTitle: "Nurse",
      moduleKey: "intake",
      tasks: TASKS,
    })

    expect(result.narrative).toBe("Generated narrative.")
    expect(generateDemoContent).toHaveBeenCalledOnce()
    expect(from).toHaveBeenCalledTimes(2) // once for select, once for upsert
  })
})
