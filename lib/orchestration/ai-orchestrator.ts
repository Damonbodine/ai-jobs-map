// AI Orchestrator - Maps O*NET Skills to AI Agents
// ================================================
// Takes occupation skills and builds optimal AI automation pipelines

import { Pool } from 'pg';

// Agent capability definitions
interface AgentCapability {
  id: string;
  name: string;
  category: 'input' | 'processing' | 'output' | 'quality';
  
  // What this agent can do
  canPerform: string[];           // Skill patterns it can handle
  skillCategories: string[];      // O*NET skill categories (COMM, TECH, etc.)
  
  // Performance characteristics
  costPerExecution: number;       // cents
  latencyMs: number;              // milliseconds
  accuracyScore: number;          // 0-1
  humanApprovalNeeded: boolean;   // Does this need human review?
  
  // Integration capabilities
  integratesWith: string[];       // Other agent IDs it can chain with
}

// Define our agent library with capabilities
const AGENT_LIBRARY: AgentCapability[] = [
  // INPUT AGENTS
  {
    id: 'ocr-processor',
    name: 'OCR Processor',
    category: 'input',
    canPerform: ['read documents', 'extract text', 'scan images', 'process PDFs'],
    skillCategories: ['INFO', 'TECH'],
    costPerExecution: 2,
    latencyMs: 3000,
    accuracyScore: 0.95,
    humanApprovalNeeded: false,
    integratesWith: ['data-extractor', 'classifier'],
  },
  {
    id: 'email-parser',
    name: 'Email Parser',
    category: 'input',
    canPerform: ['read emails', 'parse messages', 'extract attachments', 'categorize communication'],
    skillCategories: ['COMM', 'INFO'],
    costPerExecution: 1,
    latencyMs: 500,
    accuracyScore: 0.98,
    humanApprovalNeeded: false,
    integratesWith: ['classifier', 'llm-responder'],
  },
  {
    id: 'webhook-receiver',
    name: 'Webhook Handler',
    category: 'input',
    canPerform: ['receive data', 'process webhooks', 'trigger workflows'],
    skillCategories: ['TECH', 'OPS'],
    costPerExecution: 0.5,
    latencyMs: 100,
    accuracyScore: 0.99,
    humanApprovalNeeded: false,
    integratesWith: ['classifier', 'data-extractor', 'llm-analyzer'],
  },
  
  // PROCESSING AGENTS
  {
    id: 'llm-analyzer',
    name: 'LLM Analyzer',
    category: 'processing',
    canPerform: [
      'analyze data', 'evaluate options', 'make decisions', 'prioritize tasks',
      'assess risk', 'review performance', 'compare options', 'identify patterns',
      'synthesize information', 'draw conclusions', 'make recommendations',
    ],
    skillCategories: ['ANAL', 'TECH', 'MGMT', 'OPS'],
    costPerExecution: 3,
    latencyMs: 2000,
    accuracyScore: 0.88,
    humanApprovalNeeded: false,
    integratesWith: ['classifier', 'validator', 'llm-generator'],
  },
  {
    id: 'llm-generator',
    name: 'LLM Content Generator',
    category: 'processing',
    canPerform: [
      'write reports', 'create content', 'draft documents', 'compose messages',
      'generate summaries', 'write proposals', 'create presentations',
      'write emails', 'develop content', 'compose letters', 'create plans',
    ],
    skillCategories: ['COMM', 'INFO', 'MGMT', 'EDU'],
    costPerExecution: 4,
    latencyMs: 3000,
    accuracyScore: 0.85,
    humanApprovalNeeded: true,
    integratesWith: ['validator', 'formatter'],
  },
  {
    id: 'classifier',
    name: 'AI Classifier',
    category: 'processing',
    canPerform: [
      'categorize', 'classify', 'label', 'organize', 'sort',
      'prioritize', 'tag', 'identify types',
    ],
    skillCategories: ['INFO', 'ANAL', 'OPS'],
    costPerExecution: 1,
    latencyMs: 300,
    accuracyScore: 0.94,
    humanApprovalNeeded: false,
    integratesWith: ['llm-analyzer', 'router', 'validator'],
  },
  {
    id: 'data-extractor',
    name: 'Data Extractor',
    category: 'processing',
    canPerform: [
      'extract data', 'parse information', 'pull fields', 'structure data',
      'process forms', 'read invoices', 'extract numbers', 'parse tables',
    ],
    skillCategories: ['INFO', 'TECH', 'FINA'],
    costPerExecution: 2,
    latencyMs: 1500,
    accuracyScore: 0.92,
    humanApprovalNeeded: false,
    integratesWith: ['validator', 'calculator', 'database'],
  },
  {
    id: 'calculator',
    name: 'Data Calculator',
    category: 'processing',
    canPerform: [
      'calculate', 'compute', 'add', 'subtract', 'multiply', 'divide',
      'financial calculations', 'statistics', 'aggregations', 'metrics',
      'forecast', 'estimate', 'budget',
    ],
    skillCategories: ['FINA', 'ANAL', 'MGMT'],
    costPerExecution: 0.5,
    latencyMs: 100,
    accuracyScore: 0.99,
    humanApprovalNeeded: false,
    integratesWith: ['validator', 'formatter', 'database'],
  },
  {
    id: 'search-agent',
    name: 'Research Agent',
    category: 'processing',
    canPerform: [
      'research', 'search', 'find information', 'gather data',
      'verify facts', 'lookup', 'investigate', 'explore options',
    ],
    skillCategories: ['ANAL', 'COMM', 'EDU', 'LEGAL'],
    costPerExecution: 5,
    latencyMs: 5000,
    accuracyScore: 0.80,
    humanApprovalNeeded: false,
    integratesWith: ['llm-analyzer', 'validator', 'llm-generator'],
  },
  {
    id: 'translator',
    name: 'AI Translator',
    category: 'processing',
    canPerform: [
      'translate', 'convert language', 'localize', 'interpret',
    ],
    skillCategories: ['COMM', 'EDU'],
    costPerExecution: 3,
    latencyMs: 2000,
    accuracyScore: 0.92,
    humanApprovalNeeded: false,
    integratesWith: ['llm-generator', 'validator'],
  },
  {
    id: 'scheduler',
    name: 'Scheduling Agent',
    category: 'processing',
    canPerform: [
      'schedule', 'calendar', 'plan meetings', 'coordinate time',
      'manage appointments', 'set reminders',
    ],
    skillCategories: ['MGMT', 'OPS', 'COMM'],
    costPerExecution: 1,
    latencyMs: 500,
    accuracyScore: 0.96,
    humanApprovalNeeded: false,
    integratesWith: ['llm-responder', 'notifier'],
  },
  
  // QUALITY AGENTS
  {
    id: 'validator',
    name: 'Quality Validator',
    category: 'quality',
    canPerform: [
      'validate', 'check', 'verify', 'review', 'audit',
      'quality control', 'error detection', 'compliance check',
    ],
    skillCategories: ['OPS', 'LEGAL', 'TECH'],
    costPerExecution: 2,
    latencyMs: 1000,
    accuracyScore: 0.96,
    humanApprovalNeeded: false,
    integratesWith: ['llm-analyzer', 'router'],
  },
  {
    id: 'fact-checker',
    name: 'Fact Checker',
    category: 'quality',
    canPerform: [
      'fact check', 'verify facts', 'confirm accuracy', 'cross-reference',
      'validate sources', 'check consistency',
    ],
    skillCategories: ['ANAL', 'LEGAL', 'EDU'],
    costPerExecution: 4,
    latencyMs: 3000,
    accuracyScore: 0.85,
    humanApprovalNeeded: false,
    integratesWith: ['search-agent', 'validator'],
  },
  
  // OUTPUT AGENTS
  {
    id: 'formatter',
    name: 'Document Formatter',
    category: 'output',
    canPerform: [
      'format', 'layout', 'style', 'design', 'arrange',
      'create documents', 'generate PDFs', 'format reports',
    ],
    skillCategories: ['INFO', 'COMM', 'EDU'],
    costPerExecution: 2,
    latencyMs: 1000,
    accuracyScore: 0.95,
    humanApprovalNeeded: false,
    integratesWith: ['database', 'notifier'],
  },
  {
    id: 'router',
    name: 'Task Router',
    category: 'output',
    canPerform: [
      'route', 'assign', 'delegate', 'distribute', 'dispatch',
      'send to', 'forward',
    ],
    skillCategories: ['MGMT', 'OPS', 'COMM'],
    costPerExecution: 0.5,
    latencyMs: 100,
    accuracyScore: 0.99,
    humanApprovalNeeded: false,
    integratesWith: ['notifier', 'scheduler'],
  },
  {
    id: 'notifier',
    name: 'Notification Agent',
    category: 'output',
    canPerform: [
      'notify', 'alert', 'send message', 'email', 'notify team',
      'create reminders', 'send updates',
    ],
    skillCategories: ['COMM', 'OPS', 'MGMT'],
    costPerExecution: 1,
    latencyMs: 500,
    accuracyScore: 0.98,
    humanApprovalNeeded: false,
    integratesWith: [],
  },
  {
    id: 'database',
    name: 'Database Agent',
    category: 'output',
    canPerform: [
      'store data', 'save', 'record', 'update records', 'insert data',
      'query database', 'retrieve data', 'manage records',
    ],
    skillCategories: ['TECH', 'INFO', 'OPS'],
    costPerExecution: 0.5,
    latencyMs: 200,
    accuracyScore: 0.99,
    humanApprovalNeeded: false,
    integratesWith: [],
  },
  {
    id: 'crm-sync',
    name: 'CRM Integration',
    category: 'output',
    canPerform: [
      'update CRM', 'sync contacts', 'manage leads', 'track deals',
      'update customer', 'salesforce', 'hubspot',
    ],
    skillCategories: ['SALE', 'COMM', 'OPS'],
    costPerExecution: 2,
    latencyMs: 1000,
    accuracyScore: 0.97,
    humanApprovalNeeded: false,
    integratesWith: ['notifier', 'database'],
  },
];

// Skill to Agent mapping patterns
const SKILL_AGENT_PATTERNS: Record<string, string[]> = {
  // Communication skills
  'Active Listening': ['llm-analyzer', 'classifier'],
  'Oral Expression': ['llm-generator'],
  'Reading Comprehension': ['ocr-processor', 'llm-analyzer'],
  'Writing': ['llm-generator'],
  'Speaking': ['llm-generator', 'translator'],
  'Critical Thinking': ['llm-analyzer', 'validator'],
  
  // Technical skills
  'Programming': ['llm-generator', 'validator'],
  'Systems Analysis': ['llm-analyzer', 'data-extractor'],
  'Technology Design': ['llm-generator'],
  'Operation Monitoring': ['validator', 'database'],
  'Quality Control Analysis': ['validator', 'fact-checker'],
  
  // Analysis skills
  'Mathematics': ['calculator'],
  'Complex Problem Solving': ['llm-analyzer', 'search-agent'],
  'Judgment and Decision Making': ['llm-analyzer', 'validator'],
  'Systems Evaluation': ['validator', 'llm-analyzer'],
  
  // Management skills
  'Coordination': ['scheduler', 'router'],
  'Time Management': ['scheduler'],
  'Management of Personnel': ['router', 'llm-analyzer'],
  'Management of Financial Resources': ['calculator', 'database'],
  
  // Social skills
  'Persuasion': ['llm-generator'],
  'Negotiation': ['llm-generator', 'llm-analyzer'],
  'Service Orientation': ['llm-generator', 'classifier'],
  'Social Perceptiveness': ['llm-analyzer'],
  
  // Information processing
  'Information Ordering': ['classifier', 'data-extractor'],
  'Category Flexibility': ['classifier'],
  'Selective Attention': ['validator'],
  'Perceptual Speed': ['data-extractor'],
  
  // Operations
  'Installation': ['database', 'validator'],
  'Equipment Selection': ['llm-analyzer', 'search-agent'],
  'Repairing': ['llm-analyzer', 'validator'],
  'Troubleshooting': ['llm-analyzer', 'search-agent', 'validator'],
};

// O*NET category to agent category mapping
const ONET_TO_AGENT_CATEGORY: Record<string, string[]> = {
  'COMM': ['llm-generator', 'llm-analyzer', 'translator', 'notifier'],
  'TECH': ['llm-generator', 'validator', 'database', 'data-extractor'],
  'ANAL': ['llm-analyzer', 'calculator', 'search-agent', 'validator'],
  'MGMT': ['scheduler', 'router', 'llm-analyzer', 'calculator'],
  'FINA': ['calculator', 'data-extractor', 'validator', 'database'],
  'OPS': ['validator', 'scheduler', 'router', 'database'],
  'SALE': ['llm-generator', 'classifier', 'crm-sync', 'llm-analyzer'],
  'HR': ['classifier', 'llm-analyzer', 'scheduler', 'database'],
  'INFO': ['data-extractor', 'classifier', 'database', 'ocr-processor'],
  'SOFT': ['llm-analyzer', 'classifier'],
  'LEGAL': ['search-agent', 'validator', 'fact-checker', 'llm-analyzer'],
  'EDU': ['llm-generator', 'search-agent', 'translator'],
};

export interface OccupationAgentMapping {
  occupationId: number;
  occupationTitle: string;
  
  // Skill breakdown
  totalSkills: number;
  mappedSkills: number;
  unmappedSkills: number;
  
  // Agent assignments
  agents: AgentAssignment[];
  workflowSteps: WorkflowStepConfig[];
  
  // Coverage metrics
  automationCoverage: number;      // 0-100%
  estimatedTimeSaved: number;      // hours per week
  estimatedCostSavings: number;    // dollars per week
  
  // Confidence
  confidenceScore: number;         // 0-1
  humanApprovalRequired: number;   // count of steps needing human review
}

export interface AgentAssignment {
  agentId: string;
  agentName: string;
  skillsHandled: string[];        // Skill codes this agent handles
  skillCount: number;
  costPerWeek: number;            // estimated weekly cost
  timePerWeek: number;            // hours saved per week
}

export interface WorkflowStepConfig {
  order: number;
  stepId: string;
  agentId: string;
  agentName: string;
  description: string;
  skills: string[];
  cost: number;
  latencyMs: number;
  needsApproval: boolean;
}

export async function buildOccupationPipeline(
  occupationId: number,
  dbUrl: string
): Promise<OccupationAgentMapping | null> {
  const pool = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();
  
  try {
    // Get occupation details
    const occResult = await client.query(
      'SELECT id, title, slug FROM occupations WHERE id = $1',
      [occupationId]
    );
    
    if (occResult.rows.length === 0) return null;
    
    const occupation = occResult.rows[0];
    
    // Get all skills for this occupation
    const skillsResult = await client.query(`
      SELECT 
        ms.skill_code,
        ms.skill_name,
        ms.category,
        tsm.skill_proficiency_level,
        tsm.is_core_skill,
        tsm.is_differentiator_skill,
        tsm.ai_dependence_score
      FROM task_skill_mapping tsm
      JOIN micro_skills ms ON tsm.micro_skill_id = ms.id
      WHERE tsm.onet_task_id = $1
      ORDER BY tsm.skill_proficiency_level DESC, tsm.ai_dependence_score DESC
    `, [occupationId]);
    
    const skills = skillsResult.rows;
    
    if (skills.length === 0) {
      return {
        occupationId,
        occupationTitle: occupation.title,
        totalSkills: 0,
        mappedSkills: 0,
        unmappedSkills: 0,
        agents: [],
        workflowSteps: [],
        automationCoverage: 0,
        estimatedTimeSaved: 0,
        estimatedCostSavings: 0,
        confidenceScore: 0,
        humanApprovalRequired: 0,
      };
    }
    
    // Map skills to agents
    const agentAssignments = new Map<string, AgentAssignment>();
    
    for (const skill of skills) {
      const agentsForSkill = getAgentsForSkill(skill);
      
      for (const agentId of agentsForSkill) {
        if (!agentAssignments.has(agentId)) {
          const agent = AGENT_LIBRARY.find(a => a.id === agentId);
          if (agent) {
            agentAssignments.set(agentId, {
              agentId,
              agentName: agent.name,
              skillsHandled: [],
              skillCount: 0,
              costPerWeek: 0,
              timePerWeek: 0,
            });
          }
        }
        
        const assignment = agentAssignments.get(agentId)!;
        if (!assignment.skillsHandled.includes(skill.skill_code)) {
          assignment.skillsHandled.push(skill.skill_code);
          assignment.skillCount++;
        }
      }
    }
    
    // Build workflow steps
    const workflowSteps = buildWorkflowSteps(agentAssignments);
    
    // Calculate metrics
    const mappedCount = skills.filter(s => getAgentsForSkill(s).length > 0).length;
    const unmappedCount = skills.length - mappedCount;
    const automationCoverage = Math.round((mappedCount / skills.length) * 100);
    
    // Calculate time and cost savings
    let totalCostPerWeek = 0;
    let totalTimeSavedPerWeek = 0;
    let humanApprovalCount = 0;
    
    for (const step of workflowSteps) {
      totalCostPerWeek += step.cost;
      // Assume each step saves ~30 minutes of manual work
      totalTimeSavedPerWeek += 0.5;
      if (step.needsApproval) humanApprovalCount++;
    }
    
    // Adjust by AI dependence score
    const avgAiDependence = skills.reduce((sum, s) => sum + (s.ai_dependence_score || 0.5), 0) / skills.length;
    totalTimeSavedPerWeek *= avgAiDependence;
    const estimatedCostSavings = totalTimeSavedPerWeek * 50; // $50/hour
    
    const confidenceScore = calculateConfidence(skills, agentAssignments);
    
    return {
      occupationId,
      occupationTitle: occupation.title,
      totalSkills: skills.length,
      mappedSkills: mappedCount,
      unmappedSkills: unmappedCount,
      agents: Array.from(agentAssignments.values()),
      workflowSteps,
      automationCoverage,
      estimatedTimeSaved: Math.round(totalTimeSavedPerWeek * 10) / 10,
      estimatedCostSavings: Math.round(estimatedCostSavings),
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      humanApprovalRequired: humanApprovalCount,
    };
    
  } finally {
    client.release();
    await pool.end();
  }
}

function getAgentsForSkill(skill: any): string[] {
  const agents: string[] = [];
  
  // Check direct skill name matches
  for (const [pattern, patternAgents] of Object.entries(SKILL_AGENT_PATTERNS)) {
    if (skill.skill_name?.toLowerCase().includes(pattern.toLowerCase())) {
      agents.push(...patternAgents);
    }
  }
  
  // Check category-based matches
  const category = skill.category || '';
  if (ONET_TO_AGENT_CATEGORY[category]) {
    agents.push(...ONET_TO_AGENT_CATEGORY[category]);
  }
  
  // Use AI dependence score to determine agent type
  if (skill.ai_dependence_score >= 0.8) {
    // High AI dependence - use automated agents
    agents.push('calculator', 'data-extractor', 'database');
  } else if (skill.ai_dependence_score >= 0.5) {
    // Medium - use LLM agents
    agents.push('llm-analyzer', 'llm-generator');
  } else {
    // Low - needs human oversight
    agents.push('llm-generator');
  }
  
  return [...new Set(agents)];
}

function buildWorkflowSteps(
  agentAssignments: Map<string, AgentAssignment>
): WorkflowStepConfig[] {
  const steps: WorkflowStepConfig[] = [];
  const processed = new Set<string>();
  
  // Sort by category: input → processing → quality → output
  const categoryOrder = ['input', 'processing', 'quality', 'output'];
  const sortedAgents = Array.from(agentAssignments.entries()).sort((a, b) => {
    const agentA = AGENT_LIBRARY.find(ag => ag.id === a[0]);
    const agentB = AGENT_LIBRARY.find(ag => ag.id === b[0]);
    const orderA = categoryOrder.indexOf(agentA?.category || 'output');
    const orderB = categoryOrder.indexOf(agentB?.category || 'output');
    return orderA - orderB;
  });
  
  let order = 1;
  for (const [agentId, assignment] of sortedAgents) {
    if (processed.has(agentId)) continue;
    processed.add(agentId);
    
    const agent = AGENT_LIBRARY.find(a => a.id === agentId);
    if (!agent) continue;
    
    steps.push({
      order,
      stepId: `step-${order}`,
      agentId,
      agentName: agent.name,
      description: `${agent.name} handles: ${assignment.skillsHandled.slice(0, 3).join(', ')}${assignment.skillCount > 3 ? ` +${assignment.skillCount - 3} more` : ''}`,
      skills: assignment.skillsHandled,
      cost: agent.costPerExecution,
      latencyMs: agent.latencyMs,
      needsApproval: agent.humanApprovalNeeded,
    });
    
    order++;
  }
  
  return steps;
}

function calculateConfidence(
  skills: any[],
  agentAssignments: Map<string, AgentAssignment>
): number {
  if (skills.length === 0) return 0;
  
  let confidence = 0.7; // Base confidence
  
  // More skills mapped = higher confidence
  const mappedRatio = agentAssignments.size / Math.max(skills.length * 0.1, 1);
  confidence += Math.min(mappedRatio * 0.1, 0.1);
  
  // Higher AI dependence = higher confidence in automation
  const avgAiDependence = skills.reduce((sum, s) => sum + (s.ai_dependence_score || 0.5), 0) / skills.length;
  confidence += avgAiDependence * 0.2;
  
  return Math.min(confidence, 0.99);
}

// Export for use
export { AGENT_LIBRARY, ONET_TO_AGENT_CATEGORY, SKILL_AGENT_PATTERNS };
