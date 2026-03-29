// Dynamic Workflow Builder - The orchestration layer
// Allows users to compose custom workflows from agent library

import { allAgents, getAgentById, type Agent } from '../agents';
import { workflows, type Workflow, type WorkflowStep } from '../workflows';

// User selections for custom workflow
export interface UserSkillSelection {
  skillCode: string;
  skillName: string;
  category: string;
  selected: boolean;
}

export interface CustomWorkflowRequest {
  userId: string;
  occupationId: number;
  occupationTitle: string;
  selectedSkills: string[]; // skill codes
  desiredOutcomes: string[];
  constraints: {
    maxBudget?: number;
    maxSetupHours?: number;
    requiresApproval?: boolean;
    integrations?: string[]; // CRM, ERP, etc.
  };
}

export interface ComposedWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  totalPrice: number;
  monthlyPrice: number;
  estimatedSetupHours: number;
  estimatedHoursSavedPerWeek: number;
  confidence: number; // 0-100 how well this matches user needs
  includedWorkflows: string[]; // IDs of pre-built workflows included
  customSteps: string[]; // Custom agent steps
}

// Auto-compose a workflow based on user selections
export function composeWorkflow(request: CustomWorkflowRequest): ComposedWorkflow {
  const { selectedSkills, occupationTitle, constraints } = request;
  
  // Step 1: Find matching pre-built workflows
  const matchingWorkflows = findMatchingWorkflows(selectedSkills);
  
  // Step 2: If exact match exists, use it
  if (matchingWorkflows.length > 0 && matchesUserConstraints(matchingWorkflows[0], constraints)) {
    return convertToComposedWorkflow(matchingWorkflows[0], request);
  }
  
  // Step 3: Build custom workflow from agents
  return buildCustomWorkflow(request, matchingWorkflows);
}

function findMatchingWorkflows(skills: string[]): Workflow[] {
  // Score each workflow based on skill overlap
  const scored = workflows.map(wf => {
    const skillMatch = wf.targetSkills.filter(s => skills.includes(s)).length;
    return { workflow: wf, score: skillMatch };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Return workflows with at least 1 skill match
  return scored.filter(s => s.score > 0).map(s => s.workflow);
}

function matchesUserConstraints(workflow: Workflow, constraints: CustomWorkflowRequest['constraints']): boolean {
  if (constraints.maxBudget && workflow.basePrice > constraints.maxBudget) return false;
  if (constraints.maxSetupHours && workflow.setupHours > constraints.maxSetupHours) return false;
  return true;
}

function convertToComposedWorkflow(workflow: Workflow, request: CustomWorkflowRequest): ComposedWorkflow {
  const skillMatch = workflow.targetSkills.filter(s => request.selectedSkills.includes(s)).length;
  const confidence = Math.round((skillMatch / request.selectedSkills.length) * 100);
  
  return {
    id: `custom-${Date.now()}`,
    name: workflow.name,
    description: `Based on ${workflow.name} - customized for ${request.occupationTitle}`,
    steps: workflow.steps,
    totalPrice: workflow.basePrice,
    monthlyPrice: workflow.monthlyPrice,
    estimatedSetupHours: workflow.setupHours,
    estimatedHoursSavedPerWeek: workflow.estimatedHoursSavedPerWeek,
    confidence,
    includedWorkflows: [workflow.id],
    customSteps: []
  };
}

function buildCustomWorkflow(request: CustomWorkflowRequest, baseWorkflows: Workflow[]): ComposedWorkflow {
  const { selectedSkills, occupationTitle, constraints } = request;
  
  // Build agent chain based on skills
  const steps: WorkflowStep[] = [];
  let stepCounter = 1;
  
  // Always start with input
  steps.push(createStep('input', 'Receive input', 'agent-webhook'));
  
  // Add processing based on selected skills
  const processingAgents = determineProcessingAgents(selectedSkills);
  for (const agent of processingAgents) {
    steps.push(createStep(
      `process_${stepCounter}`,
      `Process with ${agent.name}`,
      agent.id
    ));
    stepCounter++;
  }
  
  // Add quality checks
  steps.push(createStep('validate', 'Validate output', 'agent-validate'));
  
  // Add routing
  steps.push(createStep('store', 'Store results', 'agent-store'));
  steps.push(createStep('notify', 'Notify stakeholders', 'agent-notify'));
  
  // Calculate pricing
  const { totalPrice, monthlyPrice, setupHours } = calculatePricing(steps, constraints);
  
  // Calculate hours saved (estimate based on processing complexity)
  const hoursSaved = Math.max(...processingAgents.map(a => a.estimatedLatency / 60 * 10), 2);
  
  // Calculate confidence
  const confidence = calculateConfidence(selectedSkills, baseWorkflows);
  
  return {
    id: `custom-${Date.now()}`,
    name: `Custom Automation for ${occupationTitle}`,
    description: `Custom workflow built from ${selectedSkills.length} selected skills`,
    steps,
    totalPrice,
    monthlyPrice,
    estimatedSetupHours: setupHours,
    estimatedHoursSavedPerWeek: hoursSaved,
    confidence,
    includedWorkflows: baseWorkflows.map(w => w.id),
    customSteps: processingAgents.map(a => a.id)
  };
}

function determineProcessingAgents(skills: string[]): Agent[] {
  const agents: Agent[] = [];
  
  // Map skills to agents
  const skillToAgentMap: Record<string, string> = {
    'SK-INFO-001': 'agent-data-extract', // Document processing
    'SK-INFO-003': 'agent-data-extract', // Documentation
    'SK-INFO-004': 'agent-data-extract', // Record keeping
    'SK-INFO-005': 'agent-data-extract', // Data entry
    'SK-ANAL-004': 'agent-analyze', // Data analysis
    'SK-ANAL-005': 'agent-analyze', // Statistical analysis
    'SK-ANAL-006': 'agent-analyze', // Root cause analysis
    'SK-ANAL-010': 'agent-analyze', // Market analysis
    'SK-COMM-003': 'agent-summarize', // Writing
    'SK-COMM-004': 'agent-generate', // Presentation
    'SK-COMM-006': 'agent-generate', // Persuasion
    'SK-SALE-001': 'agent-classify', // Sales
    'SK-SALE-009': 'agent-match', // Lead generation
    'SK-FINA-001': 'agent-data-extract', // Accounting
    'SK-FINA-002': 'agent-analyze', // Financial management
    'SK-FINA-003': 'agent-match', // Budgeting
    'SK-HR-001': 'agent-match', // Recruiting
    'SK-HR-003': 'agent-generate', // Training
    'SK-TECH-004': 'agent-analyze', // SQL
    'SK-TECH-005': 'agent-analyze', // Excel
  };
  
  const addedAgents = new Set<string>();
  
  for (const skill of skills) {
    const agentId = skillToAgentMap[skill];
    if (agentId && !addedAgents.has(agentId)) {
      const agent = getAgentById(agentId);
      if (agent) {
        agents.push(agent);
        addedAgents.add(agentId);
      }
    }
  }
  
  // Ensure at least one processing agent
  if (agents.length === 0) {
    agents.push(getAgentById('agent-classify')!);
  }
  
  return agents;
}

function createStep(stepId: string, description: string, agentId: string): WorkflowStep {
  const onSuccess = stepId === 'notify' ? 'end' : stepId === 'store' ? 'notify' : stepId === 'validate' ? 'store' : stepId === 'input' ? 'process_1' : stepId.includes('process_') ? 'validate' : 'end';
  
  return {
    stepId,
    agentId,
    agentName: getAgentById(agentId)?.name || agentId,
    description,
    onSuccess,
    onFailure: 'notify',
    retryCount: 2,
    timeout: 30
  };
}

function calculatePricing(steps: WorkflowStep[], constraints: CustomWorkflowRequest['constraints']) {
  // Base price from agent costs
  const processingSteps = steps.filter(s => s.agentId.includes('process') || s.agentId.includes('analyze') || s.agentId.includes('generate'));
  const agentCost = processingSteps.length * 50; // ~$0.50 per agent run
  
  // Setup hours: 2 hours per agent + 4 hours integration
  const setupHours = processingSteps.length * 2 + 4;
  
  // Base prices
  let basePrice = 1997 + agentCost;
  let monthlyPrice = 97 + (processingSteps.length * 15);
  
  // Apply constraints
  if (constraints.maxBudget && basePrice > constraints.maxBudget) {
    basePrice = constraints.maxBudget;
  }
  if (constraints.maxSetupHours && setupHours > constraints.maxSetupHours) {
    monthlyPrice += (setupHours - constraints.maxSetupHours) * 25;
  }
  
  return { totalPrice: basePrice, monthlyPrice, setupHours };
}

function calculateConfidence(skills: string[], baseWorkflows: Workflow[]): number {
  if (baseWorkflows.length === 0) return 50; // No matching workflows
  if (baseWorkflows[0].targetSkills.length === 0) return 50;
  
  const matchCount = baseWorkflows[0].targetSkills.filter(s => skills.includes(s)).length;
  const confidence = Math.round((matchCount / skills.length) * 100);
  
  return Math.min(95, Math.max(60, confidence)); // Keep between 60-95%
}

// Get available options for workflow customization
export function getWorkflowMenuOptions(occupationId?: number) {
  return {
    prebuiltWorkflows: workflows.map(w => ({
      id: w.id,
      code: w.code,
      name: w.name,
      description: w.description,
      icon: w.icon,
      category: w.category,
      basePrice: w.basePrice,
      monthlyPrice: w.monthlyPrice,
      estimatedHoursSavedPerWeek: w.estimatedHoursSavedPerWeek,
      skills: w.targetSkills
    })),
    availableAgents: allAgents.map(a => ({
      id: a.id,
      name: a.name,
      category: a.category,
      capabilities: a.capabilities,
      estimatedLatency: a.estimatedLatency,
      reliability: a.reliability
    })),
    commonIntegrations: [
      { id: 'salesforce', name: 'Salesforce', icon: '☁️' },
      { id: 'hubspot', name: 'HubSpot', icon: '🟠' },
      { id: 'quickbooks', name: 'QuickBooks', icon: '📗' },
      { id: 'xero', name: 'Xero', icon: '🟢' },
      { id: 'slack', name: 'Slack', icon: '💬' },
      { id: 'teams', name: 'Microsoft Teams', icon: '👥' },
      { id: 'zapier', name: 'Zapier', icon: '⚡' },
      { id: 'make', name: 'Make.com', icon: '🔧' },
      { id: 'notion', name: 'Notion', icon: '📝' },
      { id: 'airtable', name: 'Airtable', icon: '📊' },
    ]
  };
}
