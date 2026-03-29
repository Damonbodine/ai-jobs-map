// Dynamic Skill-to-Workflow Mapping System
// Maps micro-skills to appropriate agents and workflow steps

import type { WorkflowStep } from '../workflows';

export interface SkillMapping {
  skillCategory: string;
  skillCode: string;
  skillName: string;
  workflowId: string;
  workflowName: string;
  agentIds: string[];
  priority: number; // 1-5, higher = more central to workflow
}

export interface AgentMapping {
  agentId: string;
  agentName: string;
  requiredSkills: string[];
  optionalSkills: string[];
  category: 'input' | 'processing' | 'quality' | 'routing';
}

// Category to Workflow mapping
const categoryWorkflowMap: Record<string, string[]> = {
  'Information Processing': ['Document Pipeline', 'Data Analysis'],
  'Communication': ['Communication Router', 'Sales Automation'],
  'Analytics': ['Data Analysis Engine', 'Research Synthesizer'],
  'Sales': ['Sales Automation', 'Communication Router'],
  'Finance': ['Financial Operations', 'Data Analysis Engine'],
  'Operations': ['Quality Assurance', 'Document Pipeline'],
  'HR': ['HR Automation'],
  'Legal': ['Research Synthesizer', 'Document Pipeline'],
  'Technical': ['Document Pipeline', 'Data Analysis Engine'],
  'Research': ['Research Synthesizer', 'Data Analysis Engine'],
};

// Skill code prefix to workflow mapping
const skillPrefixWorkflowMap: Record<string, string> = {
  'SK-INFO': 'Document Pipeline',
  'SK-COMM': 'Communication Router',
  'SK-ANAL': 'Data Analysis Engine',
  'SK-SALE': 'Sales Automation',
  'SK-FINA': 'Financial Operations',
  'SK-OPS': 'Quality Assurance',
  'SK-HR': 'HR Automation',
  'SK-LEGAL': 'Research Synthesizer',
  'SK-TECH': 'Data Analysis Engine',
  'SK-RESE': 'Research Synthesizer',
};

// Agent requirements for each workflow type
const workflowAgentRequirements: Record<string, string[]> = {
  'Document Pipeline': ['agent-ocr', 'agent-form-parse', 'agent-classify', 'agent-validate', 'agent-store'],
  'Data Analysis Engine': ['agent-webhook', 'agent-analyze', 'agent-generate', 'agent-store'],
  'Communication Router': ['agent-email-parse', 'agent-classify', 'agent-generate', 'agent-route', 'agent-notify'],
  'Sales Automation': ['agent-form-parse', 'agent-match', 'agent-enrich', 'agent-crm', 'agent-notify'],
  'Financial Operations': ['agent-ocr', 'agent-parse', 'agent-validate', 'agent-analyze', 'agent-store'],
  'Research Synthesizer': ['agent-search', 'agent-analyze', 'agent-generate', 'agent-factcheck'],
  'Quality Assurance': ['agent-validate', 'agent-factcheck', 'agent-generate', 'agent-notify'],
  'HR Automation': ['agent-form-parse', 'agent-match', 'agent-classify', 'agent-route', 'agent-store'],
};

export function mapSkillsToWorkflows(skillCodes: string[], skillNames: Map<string, string>): SkillMapping[] {
  const mappings: SkillMapping[] = [];
  const usedWorkflows = new Set<string>();

  for (const skillCode of skillCodes) {
    // Find matching workflow based on skill prefix
    const prefix = skillCode.substring(0, 7);
    const workflowName = skillPrefixWorkflowMap[prefix];
    
    if (workflowName && !usedWorkflows.has(workflowName)) {
      usedWorkflows.add(workflowName);
      mappings.push({
        skillCategory: getCategoryFromSkillCode(skillCode),
        skillCode,
        skillName: skillNames.get(skillCode) || skillCode,
        workflowId: getWorkflowId(workflowName),
        workflowName,
        agentIds: workflowAgentRequirements[workflowName] || [],
        priority: calculatePriority(skillCode, workflowName),
      });
    }
  }

  // If no matches, default to Document Pipeline
  if (mappings.length === 0) {
    mappings.push({
      skillCategory: 'Information Processing',
      skillCode: 'SK-INFO-001',
      skillName: 'Document Processing',
      workflowId: 'wf-001',
      workflowName: 'Document Pipeline',
      agentIds: workflowAgentRequirements['Document Pipeline'],
      priority: 5,
    });
  }

  return mappings.sort((a, b) => b.priority - a.priority);
}

export function getAgentsForWorkflow(workflowName: string): AgentMapping[] {
  const agentIds = workflowAgentRequirements[workflowName] || [];
  
  return agentIds.map(id => ({
    agentId: id,
    agentName: getAgentName(id),
    requiredSkills: getRequiredSkills(id),
    optionalSkills: getOptionalSkills(id),
    category: getAgentCategory(id),
  }));
}

export function buildWorkflowSteps(skillMappings: SkillMapping[]): WorkflowStep[] {
  const steps: WorkflowStep[] = [];
  const seenAgents = new Set<string>();

  for (const mapping of skillMappings) {
    for (const agentId of mapping.agentIds) {
      if (!seenAgents.has(agentId)) {
        seenAgents.add(agentId);
        steps.push({
          stepId: getStepId(agentId),
          agentId,
          agentName: getAgentName(agentId),
          description: getAgentDescription(agentId),
          onSuccess: 'next',
          onFailure: 'human_review',
          retryCount: 3,
          timeout: getAgentTimeout(agentId),
        });
      }
    }
  }

  // Add final steps
  steps.push({
    stepId: 'store',
    agentId: 'agent-store',
    agentName: 'Storage Agent',
    description: 'Store results in database',
    onSuccess: 'notify',
    onFailure: 'notify_error',
    retryCount: 2,
    timeout: 15,
  });

  steps.push({
    stepId: 'notify',
    agentId: 'agent-notify',
    agentName: 'Notifier',
    description: 'Send completion notification',
    onSuccess: 'end',
    onFailure: 'end',
    retryCount: 1,
    timeout: 10,
  });

  return steps;
}

function getCategoryFromSkillCode(skillCode: string): string {
  const prefix = skillCode.substring(0, 7);
  const categoryMap: Record<string, string> = {
    'SK-INFO': 'Information Processing',
    'SK-COMM': 'Communication',
    'SK-ANAL': 'Analytics',
    'SK-SALE': 'Sales',
    'SK-FINA': 'Finance',
    'SK-OPS': 'Operations',
    'SK-HR': 'HR',
    'SK-LEGAL': 'Legal',
    'SK-TECH': 'Technical',
    'SK-RESE': 'Research',
  };
  return categoryMap[prefix] || 'General';
}

function getWorkflowId(workflowName: string): string {
  const idMap: Record<string, string> = {
    'Document Pipeline': 'wf-001',
    'Data Analysis Engine': 'wf-002',
    'Communication Router': 'wf-003',
    'Financial Operations': 'wf-004',
    'Sales Automation': 'wf-005',
    'Research Synthesizer': 'wf-006',
    'Quality Assurance': 'wf-007',
    'HR Automation': 'wf-008',
  };
  return idMap[workflowName] || 'wf-custom';
}

function calculatePriority(skillCode: string, workflowName: string): number {
  // Core skills get higher priority
  if (skillCode.includes('-001') || skillCode.includes('-002')) return 5;
  if (skillCode.includes('-003')) return 4;
  if (skillCode.includes('-004')) return 3;
  return 2;
}

function getAgentName(agentId: string): string {
  const nameMap: Record<string, string> = {
    'agent-ocr': 'OCR Processor',
    'agent-email-parse': 'Email Parser',
    'agent-form-parse': 'Form Parser',
    'agent-webhook': 'Webhook Handler',
    'agent-classify': 'Classifier',
    'agent-data-extract': 'Data Extractor',
    'agent-analyze': 'Data Analyzer',
    'agent-generate': 'Content Generator',
    'agent-validate': 'Validator',
    'agent-factcheck': 'Fact Checker',
    'agent-match': 'Matching Engine',
    'agent-enrich': 'Data Enricher',
    'agent-search': 'Search Agent',
    'agent-route': 'Router',
    'agent-notify': 'Notifier',
    'agent-store': 'Storage Agent',
    'agent-crm': 'CRM Sync',
    'agent-approve': 'Approval Agent',
  };
  return nameMap[agentId] || agentId;
}

function getAgentDescription(agentId: string): string {
  const descMap: Record<string, string> = {
    'agent-ocr': 'Extract text from images and PDFs',
    'agent-email-parse': 'Parse and classify incoming emails',
    'agent-form-parse': 'Parse web forms and applications',
    'agent-webhook': 'Receive data via webhooks',
    'agent-classify': 'Categorize content and intent',
    'agent-data-extract': 'Extract structured data',
    'agent-analyze': 'Run analysis and calculations',
    'agent-generate': 'Generate content and responses',
    'agent-validate': 'Validate against rules',
    'agent-factcheck': 'Verify facts and claims',
    'agent-match': 'Match records and entities',
    'agent-enrich': 'Add external data',
    'agent-search': 'Search databases and APIs',
    'agent-route': 'Route to appropriate system',
    'agent-notify': 'Send notifications',
    'agent-store': 'Store in database',
    'agent-crm': 'Sync to CRM',
    'agent-approve': 'Request human approval',
  };
  return descMap[agentId] || 'Process data';
}

function getAgentTimeout(agentId: string): number {
  const timeoutMap: Record<string, number> = {
    'agent-ocr': 30,
    'agent-analyze': 60,
    'agent-generate': 30,
    'agent-factcheck': 30,
    'agent-search': 20,
    'agent-data-extract': 30,
    'agent-enrich': 20,
    'default': 15,
  };
  return timeoutMap[agentId] || timeoutMap['default'];
}

function getAgentCategory(agentId: string): 'input' | 'processing' | 'quality' | 'routing' {
  if (['agent-ocr', 'agent-email-parse', 'agent-form-parse', 'agent-webhook'].includes(agentId)) {
    return 'input';
  }
  if (['agent-classify', 'agent-data-extract', 'agent-analyze', 'agent-generate', 'agent-match', 'agent-enrich', 'agent-search'].includes(agentId)) {
    return 'processing';
  }
  if (['agent-validate', 'agent-factcheck', 'agent-approve'].includes(agentId)) {
    return 'quality';
  }
  return 'routing';
}

function getRequiredSkills(agentId: string): string[] {
  const skillMap: Record<string, string[]> = {
    'agent-analyze': ['SK-ANAL-001', 'SK-ANAL-004'],
    'agent-generate': ['SK-COMM-001', 'SK-INFO-006'],
    'agent-validate': ['SK-OPS-001', 'SK-LEGAL-001'],
    'agent-match': ['SK-ANAL-003', 'SK-SALE-004'],
    'agent-enrich': ['SK-ANAL-002', 'SK-TECH-004'],
    'agent-search': ['SK-INFO-002', 'SK-RESE-001'],
  };
  return skillMap[agentId] || [];
}

function getOptionalSkills(agentId: string): string[] {
  const skillMap: Record<string, string[]> = {
    'agent-analyze': ['SK-ANAL-005', 'SK-ANAL-006'],
    'agent-generate': ['SK-COMM-003', 'SK-COMM-004'],
    'agent-validate': ['SK-OPS-002', 'SK-FINA-004'],
  };
  return skillMap[agentId] || [];
}

function getStepId(agentId: string): string {
  const idMap: Record<string, string> = {
    'agent-ocr': 'ocr',
    'agent-email-parse': 'parse_email',
    'agent-form-parse': 'parse_form',
    'agent-webhook': 'receive',
    'agent-classify': 'classify',
    'agent-data-extract': 'extract',
    'agent-analyze': 'analyze',
    'agent-generate': 'generate',
    'agent-validate': 'validate',
    'agent-factcheck': 'factcheck',
    'agent-match': 'match',
    'agent-enrich': 'enrich',
    'agent-search': 'search',
    'agent-route': 'route',
    'agent-notify': 'notify',
    'agent-store': 'store',
    'agent-crm': 'crm_sync',
    'agent-approve': 'approve',
  };
  return idMap[agentId] || agentId.replace('agent-', '');
}

export function calculateWorkflowCost(steps: WorkflowStep[]): {
  setupCost: number;
  monthlyCost: number;
  estimatedHoursSaved: number;
  paybackDays: number;
} {
  const processingSteps = steps.filter(s => 
    !['store', 'notify', 'notify_error', 'human_review'].includes(s.stepId)
  ).length;

  const setupCost = 1997 + (processingSteps * 200);
  const monthlyCost = 97 + (processingSteps * 20);
  const estimatedHoursSaved = Math.max(2, processingSteps * 1.5);
  const yearlyValue = estimatedHoursSaved * 52 * 50;
  const yearlyCost = setupCost + (monthlyCost * 12);
  const paybackDays = Math.round((setupCost / (yearlyValue / 365)));

  return {
    setupCost,
    monthlyCost,
    estimatedHoursSaved,
    paybackDays: Math.max(1, paybackDays),
  };
}
