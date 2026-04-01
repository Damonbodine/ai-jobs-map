export type ArchitectureType = 'single-agent' | 'multi-agent' | 'hub-and-spoke';
export type OrchestrationPattern = 'event-driven' | 'scheduled' | 'parallel';
export type ComplexityTier = 'starter' | 'growth' | 'enterprise';

export type AiPattern =
  | 'autonomous-agent'
  | 'rag-system'
  | 'structured-output'
  | 'multimodal'
  | 'scheduled-monitor'
  | 'workflow-orchestrator';

export type AutomationTier = 'automated' | 'assisted' | 'human-only';

export interface TaskSpec {
  taskName: string;
  frequency: string;
  minutesPerDay: number;
  automationApproach: string;
  tier: AutomationTier;
}

export interface BlockAgent {
  blockKey: string;
  blockLabel: string;
  agentName: string;
  agentRole: string;
  primaryPattern: AiPattern;
  toolAccess: string[];
  automatedTasks: TaskSpec[];
  assistedTasks: TaskSpec[];
  humanOnlyTasks: TaskSpec[];
  minutesSaved: number;
  rangeLow?: number;
  rangeHigh?: number;
  confidenceScore: number;
}

export interface AgentBlueprint {
  architectureType: ArchitectureType;
  architectureRationale: string;
  agents: BlockAgent[];
  orchestration: {
    pattern: OrchestrationPattern;
    humanCheckpoints: string[];
    sharedContext: string[];
  };
  impact: {
    totalMinutesSaved: number;
    automatedTaskCount: number;
    assistedTaskCount: number;
    humanRetainedTaskCount: number;
    highestImpactBlock: string;
    complexity: ComplexityTier;
  };
}
