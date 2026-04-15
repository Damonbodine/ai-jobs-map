// lib/demo/types.ts

export type AgentLoopContent = {
  inputs: string[]      // exactly 3 items
  actions: string[]     // exactly 3 items
  outputs: string[]     // exactly 3 items
  humanAction: string   // 1 sentence
}

export type AgentOutput = {
  format: "prose" | "table" | "code"
  label: string         // e.g. "DRAFT DAILY DIGEST"
  content: string       // full text that types in
  language?: string     // only for format === "code"
}

export type DemoAgentStep = {
  moduleKey: string
  agentName: string     // e.g. "Scout"
  label: string         // e.g. "Intake & Triage"
  accentColor: string   // hex
  timeOfDay: string     // e.g. "8:00 AM"
  narrative: string     // 1–2 sentences
  loop: AgentLoopContent
  output: AgentOutput
  beforeMinutes: number
  afterMinutes: number
}

export type DemoRoleData = {
  slug: string
  displayName: string
  tagline: string
  agents: DemoAgentStep[]
  totalBeforeMinutes: number
  totalAfterMinutes: number
  annualValueDollars: number
}
