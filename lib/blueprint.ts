import type {
  Occupation,
  MicroTask,
  AutomationProfile,
  AgentBlueprint,
  BlockAgent,
  TaskSpec,
  AutomationTier,
  ArchitectureType,
} from "@/types"
import { MODULE_ROLES, MODULE_TOOLS, CATEGORY_TO_MODULE } from "@/lib/modules"

function classifyTier(task: MicroTask): AutomationTier {
  if (!task.ai_applicable) return "human-only"
  if (task.ai_impact_level && task.ai_impact_level >= 4) return "automated"
  if (task.ai_impact_level && task.ai_impact_level >= 2) return "assisted"
  return "human-only"
}

// Word-boundary-aware keyword patterns for block classification.
// Using \b prevents "log" from matching "login" or "catalog".
const BLOCK_PATTERNS: [RegExp, string][] = [
  // Coordination — high specificity, check first
  [/\b(schedul|reschedul|timeline|calendar|crew|coordinat|handoff|hand-off|shift\s+chang)\b/i, "coordination"],
  // Documentation
  [/\b(report|document|record\b(?!ing\b)|paperwork|summar|meeting\s+note|draft\s+(report|summar))\b/i, "documentation"],
  [/\b(log)\b(?!in|istic)/i, "documentation"],
  [/\b(note|write)\b/i, "documentation"],
  // Communication
  [/\b(email|e-mail|messag|communicat|stakeholder|briefing|corresponden|announce)\b/i, "communication"],
  // Data & Reporting
  [/\b(dashboard|metric|KPI|visualiz|data\s+(entry|collect|analys|organiz))\b/i, "data_reporting"],
  [/\b(monitor|track|usage)\b/i, "data_reporting"],
  // Compliance
  [/\b(complian|regulat|audit|policy|certif|inspect)\b/i, "compliance"],
  // Research
  [/\b(research|investigat|compar|benchmark|literature)\b/i, "research"],
  // Analysis
  [/\b(analyz|assess|evaluat|diagnos|interpret|pattern)\b/i, "analysis"],
  [/\b(review)\b/i, "analysis"],
  // Exceptions
  [/\b(escalat|exception|edge\s+case|disruption|emergency|contingency)\b/i, "exceptions"],
  // Learning
  [/\b(train|onboard|mentor|best\s+practice|standard|curriculum)\b/i, "learning"],
]

function getBlockForTask(task: MicroTask): string {
  const combined = `${task.task_name} ${task.task_description}`.toLowerCase()

  // Pass 1: Word-boundary keyword matching on task text
  for (const [pattern, block] of BLOCK_PATTERNS) {
    if (pattern.test(combined)) return block
  }

  // Pass 2: ai_category mapping (reliable when present)
  if (task.ai_category) {
    return CATEGORY_TO_MODULE[task.ai_category] || "intake"
  }

  return "intake"
}

function estimateMinutesSaved(task: MicroTask): number {
  const base = task.ai_impact_level ?? 2
  const freq = task.frequency === "daily" ? 1.0 : task.frequency === "weekly" ? 0.2 : 0.05
  return Math.round(base * 3 * freq * 10) / 10
}

export function generateBlueprint(
  occupation: Occupation,
  tasks: MicroTask[],
  _profile: AutomationProfile | null
): AgentBlueprint {
  // Group tasks by block
  const blockMap: Record<string, TaskSpec[]> = {}

  for (const task of tasks) {
    const block = getBlockForTask(task)
    if (!blockMap[block]) blockMap[block] = []

    blockMap[block].push({
      name: task.task_name,
      description: task.task_description,
      tier: classifyTier(task),
      minutesSaved: estimateMinutesSaved(task),
      frequency: task.frequency,
    })
  }

  // Add universal quick-wins if less than 3 AI-applicable tasks
  const aiTasks = tasks.filter((t) => t.ai_applicable)
  if (aiTasks.length < 3) {
    const quickWins: TaskSpec[] = [
      { name: "Email Drafting", description: "Draft and edit email responses", tier: "automated", minutesSaved: 5, frequency: "daily" },
      { name: "Meeting Notes", description: "Summarize meeting notes and action items", tier: "automated", minutesSaved: 4, frequency: "daily" },
      { name: "Document Search", description: "Find relevant documents and information", tier: "assisted", minutesSaved: 3, frequency: "daily" },
    ]
    if (!blockMap["communication"]) blockMap["communication"] = []
    if (!blockMap["documentation"]) blockMap["documentation"] = []
    blockMap["communication"].push(quickWins[0])
    blockMap["documentation"].push(quickWins[1], quickWins[2])
  }

  // Build agents
  const agents: BlockAgent[] = Object.entries(blockMap)
    .filter(([_, tasks]) => tasks.some((t) => t.tier !== "human-only"))
    .map(([block, tasks]) => ({
      blockName: block,
      role: MODULE_ROLES[block] || block,
      tasks,
      toolAccess: MODULE_TOOLS[block] || [],
      minutesSaved: Math.round(tasks.reduce((sum, t) => sum + t.minutesSaved, 0)),
      pattern: tasks.length > 3 ? "workflow-orchestrator" : "autonomous-agent",
    }))
    .sort((a, b) => b.minutesSaved - a.minutesSaved)

  // Determine architecture
  // Most roles have 4-6 active blocks, so Workflow Bundle should be the common tier.
  // Ops Layer is reserved for roles with genuinely broad automation surface (7+).
  let architecture: ArchitectureType = "single-agent"
  if (agents.length >= 7) architecture = "hub-and-spoke"
  else if (agents.length >= 2) architecture = "multi-agent"

  // Orchestration
  const orchestration =
    architecture === "hub-and-spoke"
      ? "event-driven"
      : architecture === "multi-agent"
        ? "parallel"
        : "sequential"

  // Human checkpoints
  const humanCheckpoints = [
    "Review AI-generated outputs before sending externally",
    "Approve decisions with financial or legal impact",
    "Validate data analysis conclusions",
  ]

  const totalMinutesSaved = agents.reduce((sum, a) => sum + a.minutesSaved, 0)

  return {
    occupation,
    agents,
    architecture,
    totalMinutesSaved,
    orchestration,
    humanCheckpoints,
  }
}

/**
 * Enriches a blueprint with capability data from the database.
 * Call this server-side after generateBlueprint() to add capabilities to each agent.
 */
export async function enrichBlueprintWithCapabilities(
  blueprint: AgentBlueprint,
  taskIds: number[]
): Promise<AgentBlueprint> {
  const { getAllCapabilities } = await import("@/lib/capabilities")
  const { getCapabilitiesForTasks } = await import("@/lib/capabilities")

  // Get capabilities that are mapped to this occupation's tasks
  const taskCapabilities = await getCapabilitiesForTasks(taskIds)

  // Fall back to all capabilities per module if no task mappings exist yet
  const allCapabilities = Object.keys(taskCapabilities).length > 0
    ? taskCapabilities
    : await getAllCapabilities()

  const enrichedAgents = blueprint.agents.map((agent) => ({
    ...agent,
    capabilities: allCapabilities[agent.blockName] || [],
  }))

  return {
    ...blueprint,
    agents: enrichedAgents,
  }
}
