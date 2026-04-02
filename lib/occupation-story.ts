import { generateBlueprint } from "@/lib/blueprint"
import type {
  Occupation,
  MicroTask,
  AutomationProfile,
  BlockAgent,
} from "@/types"

export interface OccupationStory {
  startWith: string
  dayChanges: string
  recommendationReason: string
  handles: string[]
  staysWithYou: string[]
  whyItFits: string
  packageBridge: string
  secondaryLabel?: string
  secondaryBody?: string
  blueprint: ReturnType<typeof generateBlueprint>
}

const SUPPORT_LABELS: Record<string, string> = {
  intake: "intake and triage support",
  analysis: "research and decision prep support",
  documentation: "documentation support",
  coordination: "follow-through support",
  exceptions: "exception review support",
  learning: "learning support",
  research: "research support",
  compliance: "compliance support",
  communication: "communication support",
  data_reporting: "reporting support",
}

const BLOCK_LABELS: Record<string, string> = {
  intake: "incoming work and request sorting",
  analysis: "analysis and recommendation prep",
  documentation: "documentation and recurring outputs",
  coordination: "follow-through and next-step coordination",
  exceptions: "exception review and edge cases",
  learning: "learning and enablement work",
  research: "research and information gathering",
  compliance: "compliance and policy checks",
  communication: "communication and stakeholder updates",
  data_reporting: "reporting and data visibility",
}

const STAYS_WITH_YOU_BY_BLOCK: Record<string, string[]> = {
  intake: ["priority decisions", "sensitive requests", "exceptions", "final routing"],
  analysis: ["final decisions", "tradeoff judgment", "risk calls", "recommendation sign-off"],
  documentation: ["final review", "accuracy checks", "sensitive edits", "sign-off"],
  coordination: ["relationship moments", "priority changes", "sensitive communication", "exceptions"],
  exceptions: ["approvals", "judgment calls", "edge cases", "final accountability"],
  learning: ["coaching judgment", "people decisions", "sensitive conversations", "final guidance"],
  research: ["interpretation", "decision-making", "stakeholder judgment", "final recommendations"],
  compliance: ["risk judgment", "policy decisions", "exceptions", "final approval"],
  communication: ["tone decisions", "sensitive conversations", "relationship management", "final send"],
  data_reporting: ["interpretation", "final decisions", "stakeholder alignment", "sign-off"],
}

function sentenceList(items: string[]) {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

function normalizeHandle(taskName: string) {
  return taskName
    .replace(/\.$/, "")
    .replace(/^review\s+/i, "")
    .replace(/^prepare\s+/i, "")
    .replace(/^process\s+/i, "")
    .replace(/^analyze\s+/i, "")
    .trim()
    .toLowerCase()
}

function dedupe(items: string[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function dayChangeCopy(block: string, handles: string[]) {
  const handleText = sentenceList(handles.slice(0, 3))

  const templates: Record<string, string> = {
    intake:
      `Instead of new work arriving as scattered requests that someone has to sort manually, the support layer organizes ${handleText}, prepares the next step, and gets the day started cleaner.`,
    analysis:
      `Instead of repeatedly gathering inputs and rebuilding the same context before each decision, the support layer prepares ${handleText} so more of the day stays with review and judgment.`,
    documentation:
      `Instead of rebuilding the same paperwork and recurring outputs from scratch, the support layer prepares ${handleText} so the work starts closer to finished.`,
    coordination:
      `Instead of losing time to reminders, status chasing, and open loops, the support layer keeps ${handleText} moving in the background so the person can focus on the work that actually needs judgment.`,
    exceptions:
      `Instead of manually checking everything to find the few items that matter, the support layer surfaces ${handleText} so the person spends more time on decisions and less time on scanning.`,
    communication:
      `Instead of rewriting updates and repetitive messages over and over, the support layer prepares ${handleText} so communication starts with a usable draft rather than a blank page.`,
    data_reporting:
      `Instead of pulling the same numbers and rebuilding the same status views every cycle, the support layer prepares ${handleText} so reporting becomes review work instead of assembly work.`,
  }

  return templates[block] || `The support layer helps with ${handleText}, reducing repetitive work so more of the day stays with human judgment.`
}

function packageBridgeCopy(block: string, architecture: string) {
  const blockBridge: Record<string, string> = {
    intake: "Best as an intake and follow-through setup that watches incoming work, sorts it, and keeps the next step moving.",
    analysis: "Best as a decision-prep setup that gathers context, organizes inputs, and prepares the work before review.",
    documentation: "Best as a documentation setup that prepares recurring outputs, drafts, and records close to finished.",
    coordination: "Best as a follow-through setup that keeps reminders, status changes, and open loops moving in the background.",
    communication: "Best as a communication setup that prepares repetitive messages, updates, and stakeholder follow-up.",
    data_reporting: "Best as a reporting setup that keeps recurring metrics, summaries, and status views up to date.",
    research: "Best as a research setup that gathers source material, compares options, and prepares useful context fast.",
  }

  if (blockBridge[block]) return blockBridge[block]

  if (architecture === "single-agent") {
    return "Best as one focused support layer around the strongest routine cluster in the role."
  }
  if (architecture === "multi-agent") {
    return "Best as a small connected setup with support across the main routine clusters in the day."
  }
  return "Best as a coordinated operating layer with specialized supports working across the job."
}

export function deriveOccupationStory(
  occupation: Occupation,
  tasks: MicroTask[],
  profile: AutomationProfile | null
): OccupationStory | null {
  if (!tasks || tasks.length === 0) return null

  const blueprint = generateBlueprint(occupation, tasks, profile)
  const primary = blueprint.agents[0]
  if (!primary) return null

  const secondary = blueprint.agents[1]
  const primaryLabel = SUPPORT_LABELS[primary.blockName] || "routine support"
  const secondaryLabel = secondary ? SUPPORT_LABELS[secondary.blockName] || "secondary support" : undefined

  const handles = dedupe(primary.tasks.map((task) => normalizeHandle(task.name))).slice(0, 5)
  const topBlocks = blueprint.agents.slice(0, 2).map((agent) => BLOCK_LABELS[agent.blockName] || agent.blockName)
  const recommendationReason =
    topBlocks.length > 0
      ? `Recommended because this role loses the most time in ${sentenceList(topBlocks)}.`
      : "Recommended because this is the clearest place to remove repetitive routine work first."

  const packageBridge = packageBridgeCopy(primary.blockName, blueprint.architecture)

  const whyItFits = `The clearest time-back opportunity in ${occupation.title.toLowerCase()} work sits in ${sentenceList(topBlocks)}. This reduces setup work around the job so the human stays with judgment, exceptions, and final accountability.`

  return {
    startWith: `Start with ${primaryLabel}.`,
    dayChanges: dayChangeCopy(primary.blockName, handles),
    recommendationReason,
    handles,
    staysWithYou: STAYS_WITH_YOU_BY_BLOCK[primary.blockName] || [
      "final decisions",
      "sensitive communication",
      "exceptions",
      "final accountability",
    ],
    whyItFits,
    packageBridge,
    secondaryLabel: secondaryLabel ? `Another direction: ${secondaryLabel}` : undefined,
    secondaryBody: secondary
      ? `If the bigger pain is ${sentenceList(dedupe(secondary.tasks.map((task) => normalizeHandle(task.name))).slice(0, 2))} instead of the primary routine drag, ${secondaryLabel} becomes the better next move.`
      : undefined,
    blueprint,
  }
}
