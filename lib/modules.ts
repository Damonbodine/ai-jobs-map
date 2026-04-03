import {
  Mail, BarChart3, FileText, Users, Search,
  MessageSquare, Shield, BookOpen, Database, AlertTriangle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

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
    color: "bg-cyan-50/50 text-cyan-900 border-cyan-200/70 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
    icon: Mail,
  },
  analysis: {
    key: "analysis",
    label: "Analysis",
    description: "Review inputs and surface patterns or decisions.",
    role: "Analyzes data, identifies patterns, generates insights",
    tools: ["Data Analyzer", "Trend Detector", "Pattern Scanner"],
    color: "bg-indigo-50/50 text-indigo-900 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    icon: BarChart3,
  },
  documentation: {
    key: "documentation",
    label: "Documentation",
    description: "Draft recurring records, notes, and summaries.",
    role: "Writes reports, notes, summaries, and documentation",
    tools: ["Report Writer", "Summary Generator", "Template Engine"],
    color: "bg-violet-50/50 text-violet-900 border-violet-200/70 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
    icon: FileText,
  },
  coordination: {
    key: "coordination",
    label: "Coordination & Scheduling",
    description: "Keep schedules, handoffs, and follow-through moving.",
    role: "Manages scheduling, delegation, and workflow tracking",
    tools: ["Calendar AI", "Task Tracker", "Status Updater"],
    color: "bg-emerald-50/50 text-emerald-900 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    icon: Users,
  },
  exceptions: {
    key: "exceptions",
    label: "Exceptions & Escalations",
    description: "Flag disruptions, edge cases, and escalations early.",
    role: "Handles edge cases, escalations, and unusual situations",
    tools: ["Escalation Router", "Exception Handler", "Alert Manager"],
    color: "bg-amber-50/50 text-amber-900 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    icon: AlertTriangle,
  },
  learning: {
    key: "learning",
    label: "Learning & Updates",
    description: "Track updates, standards, and best practices.",
    role: "Monitors best practices and emerging methods",
    tools: ["Knowledge Base", "Skill Recommender", "News Monitor"],
    color: "bg-rose-50/50 text-rose-900 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    icon: BookOpen,
  },
  research: {
    key: "research",
    label: "Research",
    description: "Pull supporting context and compare options quickly.",
    role: "Finds information, compares options, stays current",
    tools: ["Web Researcher", "Document Scanner", "Comparison Engine"],
    color: "bg-teal-50/50 text-teal-900 border-teal-200/70 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
    icon: Search,
  },
  compliance: {
    key: "compliance",
    label: "Compliance & Policy",
    description: "Check policy, process, and regulatory requirements.",
    role: "Checks regulations, validates processes",
    tools: ["Regulation Checker", "Audit Assistant", "Policy Validator"],
    color: "bg-red-50/50 text-red-900 border-red-200/70 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    icon: Shield,
  },
  communication: {
    key: "communication",
    label: "Communication",
    description: "Prepare updates, messages, and stakeholder follow-through.",
    role: "Drafts messages, prepares presentations",
    tools: ["Message Drafter", "Tone Adjuster", "Slide Builder"],
    color: "bg-orange-50/50 text-orange-900 border-orange-200/70 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    icon: MessageSquare,
  },
  data_reporting: {
    key: "data_reporting",
    label: "Data & Reporting",
    description: "Keep metrics, reports, and status views current.",
    role: "Collects, organizes, and visualizes data",
    tools: ["Dashboard Builder", "Report Scheduler", "Data Visualizer"],
    color: "bg-sky-50/50 text-sky-900 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
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
