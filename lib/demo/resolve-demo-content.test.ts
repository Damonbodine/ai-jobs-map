// lib/demo/resolve-demo-content.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { db } from "@/lib/db/client"

// Mock dependencies before importing the module
vi.mock("./generate-demo-content", () => ({
  generateDemoContent: vi.fn(),
}))

vi.mock("@/lib/db/client", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
    }
  }
})

import { resolveAgentContent } from "./resolve-demo-content"
import { generateDemoContent } from "./generate-demo-content"
import type { MicroTask } from "@/types"

const CACHED_ROW = {
  narrative: "Cached narrative.",
  loopData: {
    inputs: ["a", "b", "c"],
    actions: ["x", "y", "z"],
    outputs: ["1", "2", "3"],
    humanAction: "Reviews and approves.",
  },
  outputData: { format: "prose", label: "REPORT", content: "Cached output." },
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

function mockDb(cacheHitV2: boolean, cacheHitV1: boolean = false) {
  const limitMock = vi.fn()
  if (cacheHitV2) {
    limitMock.mockResolvedValueOnce([CACHED_ROW])
  } else if (cacheHitV1) {
    limitMock.mockResolvedValueOnce([]).mockResolvedValueOnce([CACHED_ROW])
  } else {
    limitMock.mockResolvedValueOnce([]).mockResolvedValueOnce([])
  }

  const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
  const fromMock = vi.fn().mockReturnValue({ where: whereMock })
  const selectMock = vi.fn().mockReturnValue({ from: fromMock })

  const onConflictDoUpdateMock = vi.fn().mockResolvedValue({ error: null })
  const valuesMock = vi.fn().mockReturnValue({ onConflictDoUpdate: onConflictDoUpdateMock })
  const insertMock = vi.fn().mockReturnValue({ values: valuesMock })

  db.select = selectMock as any
  db.insert = insertMock as any

  return {
    select: selectMock,
    insert: insertMock,
    onConflictDoUpdate: onConflictDoUpdateMock,
  }
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

  it("returns cached content when DB row exists in V2", async () => {
    mockDb(true)
    const result = await resolveAgentContent({
      occupationId: 10,
      occupationTitle: "Nurse",
      moduleKey: "intake",
      tasks: TASKS,
    })
    expect(result.narrative).toBe("Cached narrative.")
    expect(generateDemoContent).not.toHaveBeenCalled()
  })

  it("returns cached content when DB row exists in V1", async () => {
    mockDb(false, true)
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
    const { insert } = mockDb(false, false)
    vi.mocked(generateDemoContent).mockResolvedValue(GENERATED)

    const result = await resolveAgentContent({
      occupationId: 10,
      occupationTitle: "Nurse",
      moduleKey: "intake",
      tasks: TASKS,
    })

    expect(result.narrative).toBe("Generated narrative.")
    expect(generateDemoContent).toHaveBeenCalledOnce()
    expect(insert).toHaveBeenCalledOnce()
  })
})
