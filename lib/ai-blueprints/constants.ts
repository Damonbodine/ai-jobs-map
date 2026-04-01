import type { AiPattern } from './types';

// Map ai_category values to modern AI patterns
export const categoryToPattern: Record<string, AiPattern> = {
  task_automation: 'autonomous-agent',
  decision_support: 'rag-system',
  research_discovery: 'rag-system',
  communication: 'workflow-orchestrator',
  creative_assistance: 'structured-output',
  data_analysis: 'structured-output',
  learning_education: 'rag-system',
};

// Work block defaults when category signal is weak
export const blockDefaultPattern: Record<string, AiPattern> = {
  intake: 'multimodal',
  analysis: 'rag-system',
  documentation: 'structured-output',
  coordination: 'workflow-orchestrator',
  exceptions: 'scheduled-monitor',
  learning: 'rag-system',
  research: 'rag-system',
  compliance: 'scheduled-monitor',
  communication: 'workflow-orchestrator',
  data_reporting: 'structured-output',
};

// Pattern display labels and descriptions
export const patternMeta: Record<AiPattern, { label: string; description: string; icon: string }> = {
  'autonomous-agent': {
    label: 'Autonomous Agent',
    description: 'AI that handles multi-step tasks with tool access — reads, decides, and acts',
    icon: '⚡',
  },
  'rag-system': {
    label: 'Research & Analysis',
    description: 'Retrieves relevant context, synthesizes findings, and prepares recommendations',
    icon: '🔍',
  },
  'structured-output': {
    label: 'Structured Output',
    description: 'Extracts data, fills templates, and generates formatted deliverables',
    icon: '📋',
  },
  'multimodal': {
    label: 'Multimodal Processing',
    description: 'Handles documents, images, PDFs, and emails — understands any input format',
    icon: '📄',
  },
  'scheduled-monitor': {
    label: 'Scheduled Monitor',
    description: 'Runs periodic checks, flags exceptions, and surfaces what needs attention',
    icon: '👁',
  },
  'workflow-orchestrator': {
    label: 'Workflow Orchestrator',
    description: 'Routes tasks, sends follow-ups, and keeps work moving across people',
    icon: '🔄',
  },
};

// Normalize raw ai_tools strings to canonical tool names
const toolNormalizationMap: Record<string, string> = {
  chatgpt: 'LLM',
  'gpt-4': 'LLM',
  'gpt-4o': 'LLM',
  claude: 'LLM',
  'openai': 'LLM',
  gemini: 'LLM',
  copilot: 'LLM',
  gmail: 'Email',
  outlook: 'Email',
  email: 'Email',
  slack: 'Messaging',
  teams: 'Messaging',
  discord: 'Messaging',
  'google sheets': 'Spreadsheet',
  excel: 'Spreadsheet',
  spreadsheet: 'Spreadsheet',
  'google docs': 'Documents',
  word: 'Documents',
  notion: 'Documents',
  salesforce: 'CRM',
  hubspot: 'CRM',
  crm: 'CRM',
  calendar: 'Calendar',
  'google calendar': 'Calendar',
  scheduling: 'Calendar',
  'power bi': 'Analytics',
  tableau: 'Analytics',
  analytics: 'Analytics',
  jira: 'Project Management',
  asana: 'Project Management',
  trello: 'Project Management',
  quickbooks: 'Accounting',
  xero: 'Accounting',
  sap: 'ERP',
  database: 'Database',
  sql: 'Database',
  airtable: 'Database',
  pdf: 'Documents',
  ocr: 'Document Scanner',
  'document scanner': 'Document Scanner',
  zapier: 'Automation',
  'make.com': 'Automation',
};

export function normalizeTools(rawTools: string | null | undefined): string[] {
  if (!rawTools) return [];
  const tools = rawTools.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const normalized = new Set<string>();
  for (const tool of tools) {
    const match = Object.entries(toolNormalizationMap).find(([key]) => tool.includes(key));
    normalized.add(match ? match[1] : tool.charAt(0).toUpperCase() + tool.slice(1));
  }
  return [...normalized];
}

// Agent role templates per block
export const blockRoleTemplates: Record<string, (occupation: string) => string> = {
  intake: (occ) => `Receives and triages incoming work for ${occ} — reads emails, parses documents, and routes requests to the right queue.`,
  analysis: (occ) => `Gathers context, compares options, and prepares decision-ready briefs for ${occ} — so you spend time deciding, not digging.`,
  documentation: (occ) => `Drafts reports, fills templates, and produces formatted deliverables for ${occ} — first drafts that are 80% there.`,
  coordination: (occ) => `Tracks follow-ups, sends reminders, and keeps work moving across people for ${occ} — nothing falls through the cracks.`,
  exceptions: (occ) => `Monitors for outliers, flags compliance issues, and surfaces edge cases for ${occ} — catches what you'd otherwise miss.`,
  learning: (occ) => `Curates training materials, tracks certifications, and identifies skill gaps for ${occ} — keeps you current without the busywork.`,
  research: (occ) => `Scans sources, synthesizes findings, and delivers briefings for ${occ} — so you stay informed without the manual digging.`,
  compliance: (occ) => `Tracks regulatory changes, prepares audit documentation, and monitors policy adherence for ${occ} — compliance on autopilot.`,
  communication: (occ) => `Drafts emails, prepares presentations, and writes stakeholder updates for ${occ} — polished communication in minutes, not hours.`,
  data_reporting: (occ) => `Builds dashboards, generates reports, and tracks KPIs for ${occ} — your data story, always up to date.`,
};

// Automation approach templates based on tier + category
export function describeAutomationApproach(
  tier: 'automated' | 'assisted' | 'human-only',
  aiCategory: string | null,
  taskName: string
): string {
  if (tier === 'human-only') return 'Requires human judgment and direct involvement';
  if (tier === 'assisted') {
    switch (aiCategory) {
      case 'research_discovery': return 'AI gathers and summarizes relevant information; you review and decide';
      case 'decision_support': return 'AI prepares options with pros/cons; you make the final call';
      case 'data_analysis': return 'AI runs the analysis and highlights patterns; you interpret results';
      case 'creative_assistance': return 'AI generates a first draft; you refine voice and accuracy';
      case 'communication': return 'AI drafts the message; you review before sending';
      default: return 'AI prepares the work; you review and approve';
    }
  }
  // automated
  switch (aiCategory) {
    case 'task_automation': return 'Handled end-to-end by the agent with no human input needed';
    case 'communication': return 'Agent drafts and sends routine messages automatically';
    case 'data_analysis': return 'Agent runs analysis on schedule and delivers results';
    case 'research_discovery': return 'Agent monitors sources and surfaces new information';
    default: return 'Fully automated by the agent';
  }
}

// Map block keys to pain point IDs in the factory form
export const blockToPainMap: Record<string, string> = {
  intake: 'data-entry',
  analysis: 'research',
  documentation: 'reporting',
  coordination: 'coordination',
  exceptions: 'reporting',
  learning: 'research',
  research: 'research',
  compliance: 'reporting',
  communication: 'coordination',
  data_reporting: 'reporting',
};
