import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { generateCustomDemo } from "./generate-custom-demo"

const content = {
  moduleKey: "documentation",
  beforeMinutes: 45,
  afterMinutes: 10,
  narrative: "Turn meeting notes into a report for review.",
  loop: {
    inputs: ["Notes", "Owners", "Deadlines"],
    actions: ["Extract", "Group", "Draft"],
    outputs: ["Summary", "Actions", "Blockers"],
    humanAction: "Review the draft before sharing.",
  },
  output: { format: "text", label: "STATUS REPORT", content: "Draft report: 35 minutes saved." },
}
const input = { taskDescription: "Draft a weekly project status report from meeting notes." }
const success = () => ({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }) })

beforeEach(() => vi.stubEnv("OPENROUTER_API_KEY", "test-key"))
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe("custom demo provider routing", () => {
  it("uses the available free pool and JSON mode to produce a complete demo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(success())
    vi.stubGlobal("fetch", fetchMock)
    const role = await generateCustomDemo(input)
    const request = fetchMock.mock.calls[0][1]
    const body = JSON.parse(request.body)
    expect(body.model).toBe("openrouter/free")
    expect(body.models).toBeUndefined()
    expect(body.response_format).toEqual({ type: "json_object" })
    expect(body.provider).toEqual({ require_parameters: true })
    expect(request.signal).toBeInstanceOf(AbortSignal)
    expect(role.agents[0].output.content).toContain("35 minutes")
    expect(role.totalBeforeMinutes - role.totalAfterMinutes).toBe(35)
  })

  it.each([429, 500])("retries a transient provider failure (%s)", async status => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status, json: async () => ({ error: "Unavailable" }) })
      .mockResolvedValueOnce(success())
    vi.stubGlobal("fetch", fetchMock)
    await expect(generateCustomDemo(input)).resolves.toMatchObject({ slug: "custom" })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("retries malformed output without passing it to the UI", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: "not JSON" } }] }) })
      .mockResolvedValueOnce(success())
    vi.stubGlobal("fetch", fetchMock)
    await expect(generateCustomDemo(input)).resolves.toMatchObject({ slug: "custom" })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("does not retry authentication failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "Unauthorized" }) })
    vi.stubGlobal("fetch", fetchMock)
    await expect(generateCustomDemo(input)).rejects.toThrow("401")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
