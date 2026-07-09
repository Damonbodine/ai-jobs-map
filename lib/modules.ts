import {
  Mail, BarChart3, FileText, Users, Search,
  MessageSquare, Shield, BookOpen, Database, AlertTriangle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { DATA_SERIES } from "@/lib/brand"

export interface ModuleDefinition {
  key: string
  label: string
  description: string
  role: string
  tools: string[]
  color: string
  icon: LucideIcon
}

export const MODULE_KEYS = [
  "intake",
  "analysis",
  "documentation",
  "coordination",
  "exceptions",
  "learning",
  "research",
  "compliance",
  "communication",
  "data_reporting",
] as const

export type ModuleKey = (typeof MODULE_KEYS)[number]

/**
 * Fixed module→color assignment on the 6-value DATA_SERIES ramp
 * (docs/brand-contract.md). 10 modules on 6 colors means four documented
 * repeats — identity is never color-alone (icon + label always render
 * beside the swatch). Do not reorder: the same module keeps the same
 * color everywhere, forever.
 */
export const MODULE_ACCENTS: Record<ModuleKey, string> = {
  intake: DATA_SERIES[0],
  analysis: DATA_SERIES[3],
  documentation: DATA_SERIES[1],
  coordination: DATA_SERIES[2],
  exceptions: DATA_SERIES[4],
  learning: DATA_SERIES[5],
  research: DATA_SERIES[0],
  compliance: DATA_SERIES[3],
  communication: DATA_SERIES[1],
  data_reporting: DATA_SERIES[2],
}

/**
 * Single source of truth for all module definitions.
 * Every surface in the app should import from here.
 */
export const MODULE_REGISTRY: Record<ModuleKey, ModuleDefinition> = {
  intake: {
    key: "intake",
    label: "Intake & Triage",
    description: "Sort incoming requests and prep the next step.",
    role: "Processes incoming requests, emails, and data inputs",
    tools: ["Email AI", "Form Parser", "Ticket Router"],
    color: "border-border bg-secondary/60 text-foreground",
    icon: Mail,
  },
  analysis: {
    key: "analysis",
    label: "Analysis",
    description: "Review inputs and surface patterns or decisions.",
    role: "Analyzes data, identifies patterns, generates insights",
    tools: ["Data Analyzer", "Trend Detector", "Pattern Scanner"],
    color: "border-border bg-secondary/60 text-foreground",
    icon: BarChart3,
  },
  documentation: {
    key: "documentation",
    label: "Documentation",
    description: "Draft recurring records, notes, and summaries.",
    role: "Writes reports, notes, summaries, and documentation",
    tools: ["Report Writer", "Summary Generator", "Template Engine"],
    color: "border-border bg-secondary/60 text-foreground",
    icon: FileText,
  },
  coordination: {
    key: "coordination",
    label: "Coordination & Scheduling",
    description: "Keep schedules, handoffs, and follow-through moving.",
    role: "Manages scheduling, delegation, and workflow tracking",
    tools: ["Calendar AI", "Task Tracker", "Status Updater"],
    color: "border-border bg-secondary/60 text-foreground",
    icon: Users,
  },
  exceptions: {
    key: "exceptions",
    label: "Exceptions & Escalations",
    description: "Flag disruptions, edge cases, and escalations early.",
    role: "Handles edge cases, escalations, and unusual situations",
    tools: ["Escalation Router", "Exception Handler", "Alert Manager"],
    color: "border-border bg-secondary/60 text-foreground",
    icon: AlertTriangle,
  },
  learning: {
    key: "learning",
    label: "Learning & Updates",
    description: "Track updates, standards, and best practices.",
    role: "Monitors best practices and emerging methods",
    tools: ["Knowledge Base", "Skill Recommender", "News Monitor"],
    color: "border-border bg-secondary/60 text-foreground",
    icon: BookOpen,
  },
  research: {
    key: "research",
    label: "Research",
    description: "Pull supporting context and compare options quickly.",
    role: "Finds information, compares options, stays current",
    tools: ["Web Researcher", "Document Scanner", "Comparison Engine"],
    color: "border-border bg-secondary/60 text-foreground",
    icon: Search,
  },
  compliance: {
    key: "compliance",
    label: "Compliance & Policy",
    description: "Check policy, process, and regulatory requirements.",
    role: "Checks regulations, validates processes",
    tools: ["Regulation Checker", "Audit Assistant", "Policy Validator"],
    color: "border-border bg-secondary/60 text-foreground",
    icon: Shield,
  },
  communication: {
    key: "communication",
    label: "Communication",
    description: "Prepare updates, messages, and stakeholder follow-through.",
    role: "Drafts messages, prepares presentations",
    tools: ["Message Drafter", "Tone Adjuster", "Slide Builder"],
    color: "border-border bg-secondary/60 text-foreground",
    icon: MessageSquare,
  },
  data_reporting: {
    key: "data_reporting",
    label: "Data & Reporting",
    description: "Keep metrics, reports, and status views current.",
    role: "Collects, organizes, and visualizes data",
    tools: ["Dashboard Builder", "Report Scheduler", "Data Visualizer"],
    color: "border-border bg-secondary/60 text-foreground",
    icon: Database,
  },
}

/** Flat lookup maps for quick access */
export const MODULE_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(MODULE_REGISTRY).map((m) => [m.key, m.label])
)

export const MODULE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  Object.values(MODULE_REGISTRY).map((m) => [m.key, m.description])
)

export const MODULE_ROLES: Record<string, string> = Object.fromEntries(
  Object.values(MODULE_REGISTRY).map((m) => [m.key, m.role])
)

export const MODULE_TOOLS: Record<string, string[]> = Object.fromEntries(
  Object.values(MODULE_REGISTRY).map((m) => [m.key, m.tools])
)

export const MODULE_COLORS: Record<string, string> = Object.fromEntries(
  Object.values(MODULE_REGISTRY).map((m) => [m.key, m.color])
)

/** Ordered list for UI rendering (matches factory wizard order) */
export const MODULE_LIST = Object.values(MODULE_REGISTRY)

/** AI category to module key mapping */
export const CATEGORY_TO_MODULE: Record<string, ModuleKey> = {
  task_automation: "intake",
  decision_support: "analysis",
  research_discovery: "research",
  communication: "communication",
  creative_assistance: "documentation",
  data_analysis: "data_reporting",
  learning_education: "learning",
}
