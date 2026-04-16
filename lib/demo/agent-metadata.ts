// lib/demo/agent-metadata.ts
import type { ModuleKey } from "@/lib/modules"

export type AgentMeta = {
  agentName: string
  label: string
  accentColor: string
  timeOfDay: string
}

const AGENT_METADATA: Record<ModuleKey, AgentMeta> = {
  intake:        { agentName: "Scout", label: "Intake & Triage",           accentColor: "#06b6d4", timeOfDay: "8:00 AM"  },
  analysis:      { agentName: "Iris",  label: "Analysis",                  accentColor: "#6366f1", timeOfDay: "9:30 AM"  },
  documentation: { agentName: "Quill", label: "Documentation",             accentColor: "#8b5cf6", timeOfDay: "10:30 AM" },
  coordination:  { agentName: "Cal",   label: "Coordination & Scheduling",  accentColor: "#10b981", timeOfDay: "11:30 AM" },
  research:      { agentName: "Wren",  label: "Research",                  accentColor: "#14b8a6", timeOfDay: "1:00 PM"  },
  compliance:    { agentName: "Nora",  label: "Compliance & Policy",       accentColor: "#ef4444", timeOfDay: "2:00 PM"  },
  exceptions:    { agentName: "Reed",  label: "Exceptions & Escalations",  accentColor: "#f59e0b", timeOfDay: "2:30 PM"  },
  communication: { agentName: "Cleo",  label: "Communication",             accentColor: "#ec4899", timeOfDay: "3:30 PM"  },
  data_reporting:{ agentName: "Lex",   label: "Data & Reporting",          accentColor: "#0ea5e9", timeOfDay: "4:00 PM"  },
  learning:      { agentName: "Nova",  label: "Learning & Updates",        accentColor: "#f97316", timeOfDay: "4:45 PM"  },
}

export function getAgentMetadata(moduleKey: ModuleKey): AgentMeta {
  return AGENT_METADATA[moduleKey]
}
