// lib/demo/agent-metadata.ts
import type { ModuleKey } from "@/lib/modules"
import { MODULE_ACCENTS } from "@/lib/modules"

export type AgentMeta = {
  agentName: string
  label: string
  accentColor: string
  timeOfDay: string
}

const AGENT_METADATA: Record<ModuleKey, AgentMeta> = {
  intake:        { agentName: "Scout", label: "Intake & Triage",           accentColor: MODULE_ACCENTS.intake,        timeOfDay: "8:00 AM"  },
  analysis:      { agentName: "Iris",  label: "Analysis",                  accentColor: MODULE_ACCENTS.analysis,      timeOfDay: "9:30 AM"  },
  documentation: { agentName: "Quill", label: "Documentation",             accentColor: MODULE_ACCENTS.documentation, timeOfDay: "10:30 AM" },
  coordination:  { agentName: "Cal",   label: "Coordination & Scheduling",  accentColor: MODULE_ACCENTS.coordination,  timeOfDay: "11:30 AM" },
  research:      { agentName: "Wren",  label: "Research",                  accentColor: MODULE_ACCENTS.research,      timeOfDay: "1:00 PM"  },
  compliance:    { agentName: "Nora",  label: "Compliance & Policy",       accentColor: MODULE_ACCENTS.compliance,    timeOfDay: "2:00 PM"  },
  exceptions:    { agentName: "Reed",  label: "Exceptions & Escalations",  accentColor: MODULE_ACCENTS.exceptions,    timeOfDay: "2:30 PM"  },
  communication: { agentName: "Cleo",  label: "Communication",             accentColor: MODULE_ACCENTS.communication, timeOfDay: "3:30 PM"  },
  data_reporting:{ agentName: "Lex",   label: "Data & Reporting",          accentColor: MODULE_ACCENTS.data_reporting,timeOfDay: "4:00 PM"  },
  learning:      { agentName: "Nova",  label: "Learning & Updates",        accentColor: MODULE_ACCENTS.learning,      timeOfDay: "4:45 PM"  },
}

export function getAgentMetadata(moduleKey: ModuleKey): AgentMeta {
  return AGENT_METADATA[moduleKey]
}
