// lib/demo/generate-demo-content.ts
import { getAgentMetadata } from "./agent-metadata"
import type { AgentLoopContent, AgentOutput } from "./types"
import type { MicroTask } from "@/types"
import type { ModuleKey } from "@/lib/modules"

export type GeneratedContent = {
  narrative: string
  loop: AgentLoopContent
  output: AgentOutput
}

type GenerateInput = {
  occupationTitle: string
  moduleKey: string
  tasks: MicroTask[]
  beforeMinutes?: number  // actual projected before-AI time for this module
  afterMinutes?: number   // actual projected after-AI time for this module
}

function buildPrompt(input: GenerateInput): string {
  const { occupationTitle, moduleKey, tasks, beforeMinutes, afterMinutes } = input
  const meta = getAgentMetadata(moduleKey as ModuleKey)
  if (!meta) throw new Error(`Unknown moduleKey: ${moduleKey}`)
  const taskSample = tasks.slice(0, 4).map((t) => `- ${t.task_name}: ${t.task_description}`).join("\n")

  const hasTimings = typeof beforeMinutes === "number" && typeof afterMinutes === "number"
  const timingSection = hasTimings
    ? `
ACTUAL TIME IMPACT FOR THIS MODULE:
Before AI: ${beforeMinutes} min/day on ${meta.label} tasks
After AI: ${afterMinutes} min/day (review + approve only)
Daily savings: ${beforeMinutes - afterMinutes!} min

Use these EXACT numbers in the content. The narrative and output should reference "${beforeMinutes} min → ${afterMinutes} min" or "${beforeMinutes - afterMinutes!} minutes saved" where natural.
`
    : ""

  const outputTimingHint = hasTimings
    ? `- Reference the actual time savings (${beforeMinutes} min → ${afterMinutes} min) in the output content where it makes sense\n- Make the output feel like real software that saved ${beforeMinutes! - afterMinutes!} minutes\n`
    : ""

  return `You are generating UI copy for a product demo. Be specific and direct. No filler words.

ROLE: ${occupationTitle}
AGENT: ${meta.agentName} — ${meta.label}
TIME: ${meta.timeOfDay}

SAMPLE TASKS THIS AGENT HANDLES:
${taskSample || "- General " + meta.label.toLowerCase() + " work"}
${timingSection}
Generate demo content for ${meta.agentName} helping a ${occupationTitle} with ${meta.label.toLowerCase()} tasks.

The content has two styles — follow each exactly:

VISUAL ELEMENTS (short, emoji-led, for animated UI boxes):
- narrative: 2-3 punchy lines, second person, emoji at start, max 12 words each
- loop labels: emoji + 2-4 words only
- humanAction: emoji + 4-7 words

OUTPUT CONTENT (detailed, realistic, for a typewriter panel — this is the payoff):
- Write 6-10 lines of realistic software output that looks like actual agent work product
- Use specific numbers, names, dates, statuses — make it feel real
- Format it like a real document: headers, bullet points, data rows, or status lines
${outputTimingHint}- 250-400 chars total
- Should make the viewer think "wow, it actually did that work"

Respond ONLY with valid JSON in this exact shape:
{
  "narrative": "<2-3 emoji-led second-person lines, \\n separated. E.g.: '📧 Your inbox sorted before you open it.\\n⚡ Priority flags set automatically.\\n🎯 You focus on what matters.'>",
  "loop": {
    "inputs":     ["<emoji + 2-4 word label>", "<emoji + 2-4 word label>", "<emoji + 2-4 word label>"],
    "actions":    ["<emoji + short action phrase>", "<emoji + short action phrase>", "<emoji + short action phrase>"],
    "outputs":    ["<emoji + short result label>", "<emoji + short result label>", "<emoji + short result label>"],
    "humanAction": "<emoji + 4-7 word direct phrase>"
  },
  "output": {
    "format":  "text",
    "label":   "<3-4 word ALL CAPS label>",
    "content": "<6-10 lines of realistic, specific output with real-looking data, formatted as the agent would actually produce it>"
  }
}

Only JSON. No markdown fences. No explanation.`
}

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set")

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://aijobsmap.com",
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

function parseContent(raw: string): GeneratedContent {
  // Strip markdown fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
  const parsed = JSON.parse(cleaned)

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
    narrative: parsed.narrative,
    loop: {
      inputs:      parsed.loop.inputs,
      actions:     parsed.loop.actions,
      outputs:     parsed.loop.outputs,
      humanAction: parsed.loop.humanAction,
    },
    output: {
      format:   parsed.output.format as AgentOutput["format"],
      label:    parsed.output.label,
      content:  parsed.output.content,
      language: parsed.output.language,
    },
  }
}

export async function generateDemoContent(input: GenerateInput): Promise<GeneratedContent> {
  const prompt = buildPrompt(input)

  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callOpenRouter(prompt)
      return parseContent(raw)
    } catch (err) {
      lastError = err
      // Only retry on parse errors, not API errors
      if (err instanceof Error && err.message.startsWith("OpenRouter API error")) {
        throw err
      }
    }
  }
  throw lastError
}
