export interface Occupation {
  id: number
  title: string
  slug: string
  major_category: string
  sub_category: string | null
  employment: number | null
  hourly_wage: number | null
  annual_wage: number | null
}

export type AiOpportunityCategory =
  | "task_automation"
  | "decision_support"
  | "research_discovery"
  | "communication"
  | "creative_assistance"
  | "data_analysis"
  | "learning_education"

export interface AiOpportunity {
  id: number
  occupation_id: number
  title: string
  description: string
  category: AiOpportunityCategory
  impact_level: number
  effort_level: number
  is_approved: boolean
}

export interface SkillRecommendation {
  id: number
  occupation_id: number
  skill_name: string
  skill_description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  learning_resources: string | null
  priority: number
}

export interface MicroTask {
  id: number
  occupation_id: number
  task_name: string
  task_description: string
  frequency: "daily" | "weekly" | "monthly" | "as-needed"
  ai_applicable: boolean
  ai_how_it_helps: string | null
  ai_impact_level: number | null
  ai_effort_to_implement: number | null
  ai_category: AiOpportunityCategory | null
  ai_tools: string | null
}

export interface AutomationProfile {
  id: number
  occupation_id: number
  composite_score: number
  work_activity_automation_potential: number | null
  time_range_low: number
  time_range_high: number
  time_range_by_block: string
  block_example_tasks?: string | null
  top_automatable_activities: string
  top_blocking_abilities: string
  physical_ability_avg: number | null
}

export interface TimeRangeByBlock {
  [block: string]: { low: number; high: number }
}

export interface BlockExampleTask {
  title: string
  source: string
  score?: number
  estimated_minutes?: number
}

export interface BlockExampleMap {
  [block: string]: {
    examples: BlockExampleTask[]
  }
}

// Blueprint types
export type ArchitectureType = "single-agent" | "multi-agent" | "hub-and-spoke"
export type AutomationTier = "automated" | "assisted" | "human-only"

export interface TaskSpec {
  name: string
  description: string
  tier: AutomationTier
  minutesSaved: number
  frequency: string
}

export interface BlockAgent {
  blockName: string
  role: string
  tasks: TaskSpec[]
  toolAccess: string[]
  minutesSaved: number
  pattern: string
}

export interface AgentBlueprint {
  occupation: Occupation
  agents: BlockAgent[]
  architecture: ArchitectureType
  totalMinutesSaved: number
  orchestration: string
  humanCheckpoints: string[]
}

// Category type
export interface OccupationCategory {
  slug: string
  label: string
  dbValue: string
}

// Factory types
export interface FactoryWizardData {
  role: string
  occupation?: Occupation
  painPoints: string[]
  selectedAgents: string[]
  selectedTools: Record<string, string[]>
  customTasks: string[]
  contactEmail: string
  contactName: string
  tier: "starter" | "workflow" | "ops"
}
