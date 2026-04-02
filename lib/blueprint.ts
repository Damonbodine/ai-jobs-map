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

const BLOCK_ROLES: Record<string, string> = {
  intake: "Processes incoming requests, emails, and data inputs",
  analysis: "Analyzes data, identifies patterns, generates insights",
  documentation: "Writes reports, notes, summaries, and documentation",
  coordination: "Manages scheduling, delegation, and workflow tracking",
  exceptions: "Handles edge cases, escalations, and unusual situations",
  learning: "Monitors best practices and emerging methods",
  research: "Finds information, compares options, stays current",
  compliance: "Checks regulations, validates processes",
  communication: "Drafts messages, prepares presentations",
  data_reporting: "Collects, organizes, and visualizes data",
}

const BLOCK_TOOLS: Record<string, string[]> = {
  intake: ["Email AI", "Form Parser", "Ticket Router"],
  analysis: ["Data Analyzer", "Trend Detector", "Pattern Scanner"],
  documentation: ["Report Writer", "Summary Generator", "Template Engine"],
  coordination: ["Calendar AI", "Task Tracker", "Status Updater"],
  exceptions: ["Escalation Router", "Exception Handler", "Alert Manager"],
  learning: ["Knowledge Base", "Skill Recommender", "News Monitor"],
  research: ["Web Researcher", "Document Scanner", "Comparison Engine"],
  compliance: ["Regulation Checker", "Audit Assistant", "Policy Validator"],
  communication: ["Message Drafter", "Tone Adjuster", "Slide Builder"],
  data_reporting: ["Dashboard Builder", "Report Scheduler", "Data Visualizer"],
}

const CATEGORY_TO_BLOCK: Record<string, string> = {
  task_automation: "intake",
  decision_support: "analysis",
  research_discovery: "research",
  communication: "communication",
  creative_assistance: "documentation",
  data_analysis: "data_reporting",
  learning_education: "learning",
}

function classifyTier(task: MicroTask): AutomationTier {
  if (!task.ai_applicable) return "human-only"
  if (task.ai_impact_level && task.ai_impact_level >= 4) return "automated"
  if (task.ai_impact_level && task.ai_impact_level >= 2) return "assisted"
  return "human-only"
}

function getBlockForTask(task: MicroTask): string {
  const name = task.task_name.toLowerCase()
  const description = task.task_description.toLowerCase()
  const combined = `${name} ${description}`

  // Strong task-name / task-description cues should beat broad category labels.
  if (
    combined.includes("schedule") ||
    combined.includes("reschedul") ||
    combined.includes("timeline") ||
    combined.includes("calendar") ||
    combined.includes("crew") ||
    combined.includes("coordinate") ||
    combined.includes("handoff")
  ) {
    return "coordination"
  }
  if (
    combined.includes("report") ||
    combined.includes("document") ||
    combined.includes("record") ||
    combined.includes("log") ||
    combined.includes("note") ||
    combined.includes("write") ||
    combined.includes("paperwork") ||
    combined.includes("summary")
  ) {
    return "documentation"
  }
  if (
    combined.includes("email") ||
    combined.includes("message") ||
    combined.includes("communication") ||
    combined.includes("stakeholder") ||
    combined.includes("briefing") ||
    combined.includes("update")
  ) {
    return "communication"
  }
  if (
    combined.includes("data") ||
    combined.includes("metric") ||
    combined.includes("dashboard") ||
    combined.includes("monitor") ||
    combined.includes("track") ||
    combined.includes("usage")
  ) {
    return "data_reporting"
  }
  if (
    combined.includes("compliance") ||
    combined.includes("regulat") ||
    combined.includes("audit") ||
    combined.includes("policy") ||
    combined.includes("verify")
  ) {
    return "compliance"
  }
  if (
    combined.includes("research") ||
    combined.includes("search") ||
    combined.includes("find") ||
    combined.includes("compare")
  ) {
    return "research"
  }
  if (
    combined.includes("analyz") ||
    combined.includes("review") ||
    combined.includes("assess") ||
    combined.includes("decide") ||
    combined.includes("plan")
  ) {
    return "analysis"
  }

  if (task.ai_category) {
    return CATEGORY_TO_BLOCK[task.ai_category] || "intake"
  }

  if (name.includes("report") || name.includes("document") || name.includes("write")) return "documentation"
  if (name.includes("analyz") || name.includes("review") || name.includes("assess")) return "analysis"
  if (name.includes("email") || name.includes("communicat") || name.includes("present")) return "communication"
  if (name.includes("schedule") || name.includes("coordinat") || name.includes("meet")) return "coordination"
  if (name.includes("research") || name.includes("search") || name.includes("find")) return "research"
  if (name.includes("data") || name.includes("metric") || name.includes("dashboard")) return "data_reporting"
  if (name.includes("compli") || name.includes("regulat") || name.includes("audit")) return "compliance"
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
      role: BLOCK_ROLES[block] || block,
      tasks,
      toolAccess: BLOCK_TOOLS[block] || [],
      minutesSaved: Math.round(tasks.reduce((sum, t) => sum + t.minutesSaved, 0)),
      pattern: tasks.length > 3 ? "workflow-orchestrator" : "autonomous-agent",
    }))
    .sort((a, b) => b.minutesSaved - a.minutesSaved)

  // Determine architecture
  let architecture: ArchitectureType = "single-agent"
  if (agents.length >= 5) architecture = "hub-and-spoke"
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
