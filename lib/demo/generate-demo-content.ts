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
}

function buildPrompt(input: GenerateInput): string {
  const { occupationTitle, moduleKey, tasks } = input
  const meta = getAgentMetadata(moduleKey as ModuleKey)
  if (!meta) throw new Error(`Unknown moduleKey: ${moduleKey}`)
  const taskSample = tasks.slice(0, 4).map((t) => `- ${t.task_name}: ${t.task_description}`).join("\n")

  return `You are writing demo content for an AI agent product targeting knowledge workers.

ROLE: ${occupationTitle}
AGENT: ${meta.agentName} — ${meta.label}
TIME: ${meta.timeOfDay}

SAMPLE TASKS THIS AGENT HANDLES:
${taskSample || "- General " + meta.label.toLowerCase() + " work"}

Write realistic, specific demo content for how ${meta.agentName} helps a ${occupationTitle} with ${meta.label.toLowerCase()} tasks. Use a realistic first name for the worker (not "the user"). Make it feel like a real workday.

Respond ONLY with valid JSON in this exact shape:
{
  "narrative": "<1-2 sentences: what changed for this worker — personal and specific>",
  "loop": {
    "inputs":     ["<exactly 3 specific inputs the agent receives>", "...", "..."],
    "actions":    ["<exactly 3 things the AI does>", "...", "..."],
    "outputs":    ["<exactly 3 concrete outputs delivered>", "...", "..."],
    "humanAction": "<1 sentence: what the worker reviews/approves and how long it takes>"
  },
  "output": {
    "format":  "prose",
    "label":   "<3-4 word ALL CAPS label, e.g. 'MORNING BRIEFING'>",
    "content": "<realistic 150-250 word output the agent would produce — formatted, specific>"
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
      max_tokens: 1024,
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
