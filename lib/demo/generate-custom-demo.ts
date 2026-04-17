// lib/demo/generate-custom-demo.ts
// Takes a free-text task description from a user and returns a one-agent
// DemoRoleData that the existing AgentSuiteDemo shell can render as-is.

import { getAgentMetadata } from "./agent-metadata"
import { MODULE_KEYS } from "@/lib/modules"
import { computeAnnualValue } from "@/lib/pricing"
import type { ModuleKey } from "@/lib/modules"
import type { AgentLoopContent, AgentOutput, DemoAgentStep, DemoRoleData } from "./types"

type GenerateCustomInput = {
  taskDescription: string
  occupationContext?: string
}

type RawCustomContent = {
  moduleKey: ModuleKey
  beforeMinutes: number
  afterMinutes: number
  narrative: string
  loop: AgentLoopContent
  output: AgentOutput
}

// Default for annual-value math when we have no BLS hourly wage to anchor on.
// 50 $/hr ~= $104k/yr, a reasonable "professional knowledge worker" midpoint.
const DEFAULT_HOURLY_WAGE = 50

function buildCustomPrompt(input: GenerateCustomInput): string {
  const { taskDescription, occupationContext } = input
  const moduleList = MODULE_KEYS.join(", ")

  return `You are generating UI copy for a product demo of an AI agent that automates a real task for a real person.

USER TASK DESCRIPTION:
"""
${taskDescription}
"""
${occupationContext ? `ROLE CONTEXT: ${occupationContext}\n` : ""}
STEP 1 — Pick ONE agent module from this list that best fits the task:
  ${moduleList}

STEP 2 — Estimate realistic time impact (integers, minutes per day):
  beforeMinutes: how long this task takes today (typically 15–300)
  afterMinutes: how long after the agent handles it (typically 10–30% of beforeMinutes)

STEP 3 — Generate demo content in TWO distinct styles:

VISUAL ELEMENTS (short, emoji-led, for animated UI boxes):
- narrative: 2–3 punchy lines, second person ("you"), emoji at start of each, max 12 words each
- loop: 3 inputs, 3 actions, 3 outputs — each one "emoji + 2-4 words" ONLY
- humanAction: "emoji + 4-7 words" direct phrase

OUTPUT CONTENT (detailed, for a typewriter payoff panel):
- 6-10 lines of realistic software output that would come from doing this task
- Use specific numbers, names, dates, statuses from the USER'S domain
- Format like a real document: headers, bullet points, data rows, status lines
- 250–400 chars total
- Reference the actual time savings you chose in Step 2 (e.g. "90 min → 12 min" or "saved 78 minutes") somewhere natural in the output

Use the USER'S OWN WORDS and domain details. Make it feel written for them, not templated.

Respond ONLY with valid JSON, no markdown fences, in this exact shape:
{
  "moduleKey": "<one of: ${moduleList}>",
  "beforeMinutes": <integer>,
  "afterMinutes": <integer>,
  "narrative": "<2-3 emoji-led second-person lines, \\n separated>",
  "loop": {
    "inputs":     ["<emoji + 2-4 words>", "<emoji + 2-4 words>", "<emoji + 2-4 words>"],
    "actions":    ["<emoji + short action>", "<emoji + short action>", "<emoji + short action>"],
    "outputs":    ["<emoji + short result>", "<emoji + short result>", "<emoji + short result>"],
    "humanAction": "<emoji + 4-7 words>"
  },
  "output": {
    "format": "text",
    "label": "<3-4 word ALL CAPS label>",
    "content": "<6-10 lines of realistic, specific output>"
  }
}`
}

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set")

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ai-jobs-map.vercel.app",
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4-5",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(`OpenRouter API error ${response.status}: ${JSON.stringify(body)}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ""
}

function parseCustomContent(raw: string): RawCustomContent {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
  const parsed = JSON.parse(cleaned)

  // Module key must be one of the 10 known keys — otherwise agent-metadata
  // lookup returns undefined and every downstream access crashes.
  if (!MODULE_KEYS.includes(parsed.moduleKey)) {
    throw new Error(`Invalid moduleKey in LLM response: ${parsed.moduleKey}`)
  }

  if (
    typeof parsed.beforeMinutes !== "number" ||
    typeof parsed.afterMinutes !== "number" ||
    parsed.beforeMinutes <= parsed.afterMinutes ||
    parsed.beforeMinutes > 600
  ) {
    throw new Error("Invalid before/after minutes in LLM response")
  }

  if (
    typeof parsed.narrative !== "string" ||
    !Array.isArray(parsed.loop?.inputs) || parsed.loop.inputs.length !== 3 ||
    !Array.isArray(parsed.loop?.actions) || parsed.loop.actions.length !== 3 ||
    !Array.isArray(parsed.loop?.outputs) || parsed.loop.outputs.length !== 3 ||
    typeof parsed.loop?.humanAction !== "string" ||
    typeof parsed.output?.format !== "string" ||
    typeof parsed.output?.label !== "string" ||
    typeof parsed.output?.content !== "string"
  ) {
    throw new Error("Generated content failed schema validation")
  }

  return {
    moduleKey: parsed.moduleKey,
    beforeMinutes: Math.round(parsed.beforeMinutes),
    afterMinutes: Math.round(parsed.afterMinutes),
    narrative: parsed.narrative,
    loop: {
      inputs: parsed.loop.inputs,
      actions: parsed.loop.actions,
      outputs: parsed.loop.outputs,
      humanAction: parsed.loop.humanAction,
    },
    output: {
      format: parsed.output.format as AgentOutput["format"],
      label: parsed.output.label,
      content: parsed.output.content,
      language: parsed.output.language,
    },
  }
}

export async function generateCustomDemo(input: GenerateCustomInput): Promise<DemoRoleData> {
  const prompt = buildCustomPrompt(input)

  let lastError: unknown
  let raw: RawCustomContent | null = null
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await callOpenRouter(prompt)
      raw = parseCustomContent(response)
      break
    } catch (err) {
      lastError = err
      if (err instanceof Error && err.message.startsWith("OpenRouter API error")) {
        throw err
      }
    }
  }
  if (!raw) throw lastError

  const meta = getAgentMetadata(raw.moduleKey)

  const agent: DemoAgentStep = {
    moduleKey: raw.moduleKey,
    agentName: meta.agentName,
    label: meta.label,
    accentColor: meta.accentColor,
    timeOfDay: meta.timeOfDay,
    narrative: raw.narrative,
    loop: raw.loop,
    output: raw.output,
    beforeMinutes: raw.beforeMinutes,
    afterMinutes: raw.afterMinutes,
  }

  const minutesSaved = raw.beforeMinutes - raw.afterMinutes
  const taglineSource = input.taskDescription.trim()
  const tagline = taglineSource.length > 80
    ? taglineSource.slice(0, 77).trim() + "…"
    : taglineSource

  const role: DemoRoleData = {
    slug: "custom",
    displayName: input.occupationContext?.trim() || "Your custom workflow",
    tagline,
    agents: [agent],
    totalBeforeMinutes: raw.beforeMinutes,
    totalAfterMinutes: raw.afterMinutes,
    annualValueDollars: computeAnnualValue(minutesSaved, DEFAULT_HOURLY_WAGE),
  }

  return role
}
