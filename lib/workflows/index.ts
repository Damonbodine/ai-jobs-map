// Pre-built Workflows - The 8 Core Automation Products
// Each workflow is composed of agents chained together

import type { Agent } from '../agents';

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'error';

export interface WorkflowStep {
  stepId: string;
  agentId: string;
  agentName: string;
  description: string;
  onSuccess: string; // next stepId
  onFailure: string; // next stepId or 'stop'
  retryCount: number;
  timeout: number; // seconds
}

export interface Workflow {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  
  // Which skills this workflow addresses
  targetSkills: string[]; // skill codes
  targetOccupations: string[]; // occupation slugs
  
  // The chain of agents
  steps: WorkflowStep[];
  startStep: string;
  endStep: string;
  
  // Pricing
  basePrice: number;
  monthlyPrice: number;
  setupHours: number;
  
  // Metrics
  avgExecutionTime: number; // minutes
  successRate: number; // %
  estimatedHoursSavedPerWeek: number;
  
  // Stats
  timesRun: number;
  avgRating: number;
}

// Workflow 1: Document Processing Pipeline
export const documentPipeline: Workflow = {
  id: 'wf-001',
  code: 'WF-DOC-PIPE',
  name: 'Document Processing Pipeline',
  description: 'Automatically process invoices, receipts, contracts, and forms. Extract data, validate, and store.',
  category: 'Document Processing',
  icon: '📄',
  targetSkills: ['SK-INFO-001', 'SK-INFO-003', 'SK-INFO-004', 'SK-INFO-005', 'SK-TECH-005'],
  targetOccupations: [],
  steps: [
    {
      stepId: 'receive',
      agentId: 'agent-webhook',
      agentName: 'Webhook Handler',
      description: 'Receive document via email, upload, or webhook',
      onSuccess: 'classify',
      onFailure: 'notify_error',
      retryCount: 3,
      timeout: 10
    },
    {
      stepId: 'classify',
      agentId: 'agent-classify',
      agentName: 'Classifier',
      description: 'Classify document type (invoice, receipt, contract, form)',
      onSuccess: 'extract',
      onFailure: 'human_review',
      retryCount: 2,
      timeout: 15
    },
    {
      stepId: 'extract',
      agentId: 'agent-data-extract',
      agentName: 'Data Extractor',
      description: 'Extract structured data from document',
      onSuccess: 'validate',
      onFailure: 'human_review',
      retryCount: 3,
      timeout: 30
    },
    {
      stepId: 'validate',
      agentId: 'agent-validate',
      agentName: 'Validator',
      description: 'Validate extracted data against rules',
      onSuccess: 'store',
      onFailure: 'notify_issue',
      retryCount: 2,
      timeout: 10
    },
    {
      stepId: 'store',
      agentId: 'agent-store',
      agentName: 'Storage Agent',
      description: 'Store in database with metadata',
      onSuccess: 'notify_success',
      onFailure: 'notify_error',
      retryCount: 3,
      timeout: 15
    },
    {
      stepId: 'notify_success',
      agentId: 'agent-notify',
      agentName: 'Notifier',
      description: 'Send success confirmation',
      onSuccess: 'end',
      onFailure: 'end',
      retryCount: 1,
      timeout: 10
    },
    {
      stepId: 'notify_issue',
      agentId: 'agent-notify',
      agentName: 'Notifier',
      description: 'Notify of validation issues',
      onSuccess: 'human_review',
      onFailure: 'human_review',
      retryCount: 1,
      timeout: 10
    },
    {
      stepId: 'notify_error',
      agentId: 'agent-notify',
      agentName: 'Notifier',
      description: 'Notify of processing error',
      onSuccess: 'end',
      onFailure: 'end',
      retryCount: 1,
      timeout: 10
    },
    {
      stepId: 'human_review',
      agentId: 'agent-approve',
      agentName: 'Approval Agent',
      description: 'Route to human for review',
      onSuccess: 'store',
      onFailure: 'end',
      retryCount: 0,
      timeout: 0 // Manual, no timeout
    }
  ],
  startStep: 'receive',
  endStep: 'notify_success',
  basePrice: 2997,
  monthlyPrice: 147,
  setupHours: 8,
  avgExecutionTime: 2,
  successRate: 94,
  estimatedHoursSavedPerWeek: 12,
  timesRun: 0,
  avgRating: 0
};

// Workflow 2: Data Analysis Engine
export const dataAnalysisEngine: Workflow = {
  id: 'wf-002',
  code: 'WF-DATA-ANALYZE',
  name: 'Data Analysis Engine',
  description: 'Connect to databases, run analyses, generate reports and visualizations automatically.',
  category: 'Analytics',
  icon: '📊',
  targetSkills: ['SK-ANAL-004', 'SK-ANAL-005', 'SK-TECH-004', 'SK-TECH-008', 'SK-TECH-009'],
  targetOccupations: [],
  steps: [
    {
      stepId: 'receive',
      agentId: 'agent-webhook',
      agentName: 'Webhook Handler',
      description: 'Receive analysis request',
      onSuccess: 'query',
      onFailure: 'notify_error',
      retryCount: 3,
      timeout: 10
    },
    {
      stepId: 'query',
      agentId: 'agent-analyze',
      agentName: 'Data Analyzer',
      description: 'Execute queries and statistical analysis',
      onSuccess: 'visualize',
      onFailure: 'notify_error',
      retryCount: 2,
      timeout: 60
    },
    {
      stepId: 'visualize',
      agentId: 'agent-generate',
      agentName: 'Content Generator',
      description: 'Generate visualizations and charts',
      onSuccess: 'report',
      onFailure: 'notify_error',
      retryCount: 2,
      timeout: 30
    },
    {
      stepId: 'report',
      agentId: 'agent-generate',
      agentName: 'Content Generator',
      description: 'Generate analysis report with insights',
      onSuccess: 'validate',
      onFailure: 'notify_error',
      retryCount: 2,
      timeout: 30
    },
    {
      stepId: 'validate',
      agentId: 'agent-factcheck',
      agentName: 'Fact Checker',
      description: 'Verify key findings',
      onSuccess: 'store',
      onFailure: 'human_review',
      retryCount: 2,
      timeout: 30
    },
    {
      stepId: 'store',
      agentId: 'agent-store',
      agentName: 'Storage Agent',
      description: 'Store report and data',
      onSuccess: 'notify_success',
      onFailure: 'notify_error',
      retryCount: 2,
      timeout: 15
    },
    {
      stepId: 'notify_success',
      agentId: 'agent-notify',
      agentName: 'Notifier',
      description: 'Send report to stakeholders',
      onSuccess: 'end',
      onFailure: 'end',
      retryCount: 1,
      timeout: 10
    },
    {
      stepId: 'notify_error',
      agentId: 'agent-notify',
      agentName: 'Notifier',
      description: 'Notify of errors',
      onSuccess: 'end',
      onFailure: 'end',
      retryCount: 1,
      timeout: 10
    },
    {
      stepId: 'human_review',
      agentId: 'agent-approve',
      agentName: 'Approval Agent',
      description: 'Human review of anomalies',
      onSuccess: 'store',
      onFailure: 'end',
      retryCount: 0,
      timeout: 0
    }
  ],
  startStep: 'receive',
  endStep: 'notify_success',
  basePrice: 3997,
  monthlyPrice: 197,
  setupHours: 12,
  avgExecutionTime: 5,
  successRate: 92,
  estimatedHoursSavedPerWeek: 8,
  timesRun: 0,
  avgRating: 0
};

// Workflow 3: Communication Router
export const communicationRouter: Workflow = {
  id: 'wf-003',
  code: 'WF-COMM-ROUTE',
  name: 'Communication Router',
  description: 'Sort, triage, and route emails and messages. Auto-respond where appropriate.',
  category: 'Communication',
  icon: '💬',
  targetSkills: ['SK-COMM-001', 'SK-COMM-002', 'SK-COMM-003', 'SK-CUST-001'],
  targetOccupations: [],
  steps: [
    {
      stepId: 'receive',
      agentId: 'agent-email-parse',
      agentName: 'Email Parser',
      description: 'Receive and parse incoming message',
      onSuccess: 'classify',
      onFailure: 'notify_error',
      retryCount: 3,
      timeout: 10
    },
    {
      stepId: 'classify',
      agentId: 'agent-classify',
      agentName: 'Classifier',
      description: 'Classify message (urgent, inquiry, complaint, etc.)',
      onSuccess: 'respond',
      onFailure: 'human_review',
      retryCount: 2,
      timeout: 15
    },
    {
      stepId: 'respond',
      agentId: 'agent-generate',
      agentName: 'Content Generator',
      description: 'Generate appropriate response if applicable',
      onSuccess: 'validate',
      onFailure: 'human_review',
      retryCount: 2,
      timeout: 30
    },
    {
      stepId: 'validate',
      agentId: 'agent-validate',
      agentName: 'Validator',
      description: 'Validate response quality',
      onSuccess: 'route',
      onFailure: 'human_review',
      retryCount: 2,
      timeout: 10
    },
    {
      stepId: 'route',
      agentId: 'agent-route',
      agentName: 'Router',
      description: 'Route to appropriate person or system',
      onSuccess: 'notify',
      onFailure: 'notify_error',
      retryCount: 2,
      timeout: 10
    },
    {
      stepId: 'notify',
      agentId: 'agent-notify',
      agentName: 'Notifier',
      description: 'Send notifications',
      onSuccess: 'end',
      onFailure: 'end',
      retryCount: 1,
      timeout: 10
    },
    {
      stepId: 'human_review',
      agentId: 'agent-approve',
      agentName: 'Approval Agent',
      description: 'Route to human for handling',
      onSuccess: 'route',
      onFailure: 'end',
      retryCount: 0,
      timeout: 0
    },
    {
      stepId: 'notify_error',
      agentId: 'agent-notify',
      agentName: 'Notifier',
      description: 'Notify of errors',
      onSuccess: 'end',
      onFailure: 'end',
      retryCount: 1,
      timeout: 10
    }
  ],
  startStep: 'receive',
  endStep: 'notify',
  basePrice: 2497,
  monthlyPrice: 127,
  setupHours: 6,
  avgExecutionTime: 1,
  successRate: 90,
  estimatedHoursSavedPerWeek: 15,
  timesRun: 0,
  avgRating: 0
};

// Workflow 4: Financial Operations Suite
export const financialOpsSuite: Workflow = {
  id: 'wf-004',
  code: 'WF-FIN-OPS',
  name: 'Financial Operations Suite',
  description: 'Process invoices, reconcile accounts, handle billing automatically with approval workflows.',
  category: 'Finance',
  icon: '💰',
  targetSkills: ['SK-FINA-001', 'SK-FINA-002', 'SK-FINA-003', 'SK-FINA-004', 'SK-FINA-009'],
  targetOccupations: [],
  steps: [
    { stepId: 'receive', agentId: 'agent-email-parse', agentName: 'Email Parser', description: 'Receive invoice or financial document', onSuccess: 'extract', onFailure: 'notify_error', retryCount: 3, timeout: 10 },
    { stepId: 'extract', agentId: 'agent-data-extract', agentName: 'Data Extractor', description: 'Extract invoice details', onSuccess: 'match', onFailure: 'human_review', retryCount: 3, timeout: 30 },
    { stepId: 'match', agentId: 'agent-match', agentName: 'Matching Engine', description: 'Match to PO/requisition', onSuccess: 'validate', onFailure: 'human_review', retryCount: 2, timeout: 30 },
    { stepId: 'validate', agentId: 'agent-validate', agentName: 'Validator', description: 'Validate against business rules', onSuccess: 'approve', onFailure: 'human_review', retryCount: 2, timeout: 15 },
    { stepId: 'approve', agentId: 'agent-approve', agentName: 'Approval Agent', description: 'Route for approval if needed', onSuccess: 'process', onFailure: 'end', retryCount: 0, timeout: 0 },
    { stepId: 'process', agentId: 'agent-route', agentName: 'Router', description: 'Process payment or log to ERP', onSuccess: 'store', onFailure: 'notify_error', retryCount: 3, timeout: 30 },
    { stepId: 'store', agentId: 'agent-store', agentName: 'Storage Agent', description: 'Store documentation', onSuccess: 'notify_success', onFailure: 'notify_error', retryCount: 2, timeout: 15 },
    { stepId: 'notify_success', agentId: 'agent-notify', agentName: 'Notifier', description: 'Confirm completion', onSuccess: 'end', onFailure: 'end', retryCount: 1, timeout: 10 },
    { stepId: 'human_review', agentId: 'agent-approve', agentName: 'Approval Agent', description: 'Human review needed', onSuccess: 'process', onFailure: 'end', retryCount: 0, timeout: 0 },
    { stepId: 'notify_error', agentId: 'agent-notify', agentName: 'Notifier', description: 'Notify of errors', onSuccess: 'end', onFailure: 'end', retryCount: 1, timeout: 10 }
  ],
  startStep: 'receive',
  endStep: 'notify_success',
  basePrice: 4997,
  monthlyPrice: 297,
  setupHours: 16,
  avgExecutionTime: 3,
  successRate: 93,
  estimatedHoursSavedPerWeek: 15,
  timesRun: 0,
  avgRating: 0
};

// Workflow 5: Sales Automation
export const salesAutomation: Workflow = {
  id: 'wf-005',
  code: 'WF-SALES-AUTO',
  name: 'Sales Automation',
  description: 'Capture leads, enrich data, score opportunities, and sync to CRM automatically.',
  category: 'Sales',
  icon: '🎯',
  targetSkills: ['SK-SALE-001', 'SK-SALE-002', 'SK-SALE-008', 'SK-SALE-009', 'SK-TECH-012'],
  targetOccupations: [],
  steps: [
    { stepId: 'receive', agentId: 'agent-webhook', agentName: 'Webhook Handler', description: 'Receive lead from form/website', onSuccess: 'enrich', onFailure: 'notify_error', retryCount: 3, timeout: 10 },
    { stepId: 'enrich', agentId: 'agent-enrich', agentName: 'Data Enricher', description: 'Enrich with company/contact data', onSuccess: 'score', onFailure: 'score', retryCount: 2, timeout: 30 },
    { stepId: 'score', agentId: 'agent-classify', agentName: 'Classifier', description: 'Score lead quality', onSuccess: 'route', onFailure: 'human_review', retryCount: 2, timeout: 15 },
    { stepId: 'route', agentId: 'agent-route', agentName: 'Router', description: 'Route to CRM', onSuccess: 'crm_sync', onFailure: 'notify_error', retryCount: 3, timeout: 20 },
    { stepId: 'crm_sync', agentId: 'agent-crm', agentName: 'CRM Sync', description: 'Sync to Salesforce/HubSpot', onSuccess: 'sequence', onFailure: 'notify_error', retryCount: 2, timeout: 20 },
    { stepId: 'sequence', agentId: 'agent-notify', agentName: 'Notifier', description: 'Enroll in follow-up sequence', onSuccess: 'end', onFailure: 'end', retryCount: 1, timeout: 10 },
    { stepId: 'human_review', agentId: 'agent-approve', agentName: 'Approval Agent', description: 'High-value lead review', onSuccess: 'route', onFailure: 'end', retryCount: 0, timeout: 0 },
    { stepId: 'notify_error', agentId: 'agent-notify', agentName: 'Notifier', description: 'Notify of errors', onSuccess: 'end', onFailure: 'end', retryCount: 1, timeout: 10 }
  ],
  startStep: 'receive',
  endStep: 'sequence',
  basePrice: 3497,
  monthlyPrice: 177,
  setupHours: 10,
  avgExecutionTime: 2,
  successRate: 91,
  estimatedHoursSavedPerWeek: 10,
  timesRun: 0,
  avgRating: 0
};

// Workflow 6: Research Synthesizer
export const researchSynthesizer: Workflow = {
  id: 'wf-006',
  code: 'WF-RESEARCH',
  name: 'Research Synthesizer',
  description: 'Research topics, gather information, synthesize findings into reports.',
  category: 'Research',
  icon: '🔬',
  targetSkills: ['SK-INFO-006', 'SK-ANAL-001', 'SK-LERN-001', 'SK-ANAL-010'],
  targetOccupations: [],
  steps: [
    { stepId: 'receive', agentId: 'agent-webhook', agentName: 'Webhook Handler', description: 'Receive research request', onSuccess: 'search', onFailure: 'notify_error', retryCount: 3, timeout: 10 },
    { stepId: 'search', agentId: 'agent-analyze', agentName: 'Data Analyzer', description: 'Search and gather information', onSuccess: 'synthesize', onFailure: 'notify_error', retryCount: 2, timeout: 60 },
    { stepId: 'synthesize', agentId: 'agent-generate', agentName: 'Content Generator', description: 'Synthesize findings', onSuccess: 'validate', onFailure: 'human_review', retryCount: 2, timeout: 45 },
    { stepId: 'validate', agentId: 'agent-factcheck', agentName: 'Fact Checker', description: 'Verify key claims', onSuccess: 'report', onFailure: 'human_review', retryCount: 2, timeout: 30 },
    { stepId: 'report', agentId: 'agent-generate', agentName: 'Content Generator', description: 'Generate final report', onSuccess: 'store', onFailure: 'notify_error', retryCount: 2, timeout: 30 },
    { stepId: 'store', agentId: 'agent-store', agentName: 'Storage Agent', description: 'Store research', onSuccess: 'notify_success', onFailure: 'notify_error', retryCount: 2, timeout: 15 },
    { stepId: 'notify_success', agentId: 'agent-notify', agentName: 'Notifier', description: 'Send report', onSuccess: 'end', onFailure: 'end', retryCount: 1, timeout: 10 },
    { stepId: 'human_review', agentId: 'agent-approve', agentName: 'Approval Agent', description: 'Review synthesis', onSuccess: 'report', onFailure: 'end', retryCount: 0, timeout: 0 },
    { stepId: 'notify_error', agentId: 'agent-notify', agentName: 'Notifier', description: 'Notify of errors', onSuccess: 'end', onFailure: 'end', retryCount: 1, timeout: 10 }
  ],
  startStep: 'receive',
  endStep: 'notify_success',
  basePrice: 2997,
  monthlyPrice: 147,
  setupHours: 8,
  avgExecutionTime: 4,
  successRate: 89,
  estimatedHoursSavedPerWeek: 6,
  timesRun: 0,
  avgRating: 0
};

// Workflow 7: Quality Assurance
export const qualityAssurance: Workflow = {
  id: 'wf-007',
  code: 'WF-QA',
  name: 'Quality Assurance',
  description: 'Automated quality checks, compliance monitoring, and validation workflows.',
  category: 'Operations',
  icon: '✅',
  targetSkills: ['SK-OPS-002', 'SK-OPS-001', 'SK-INFO-003', 'SK-LEGAL-003'],
  targetOccupations: [],
  steps: [
    { stepId: 'receive', agentId: 'agent-webhook', agentName: 'Webhook Handler', description: 'Receive item for QA', onSuccess: 'check', onFailure: 'notify_error', retryCount: 3, timeout: 10 },
    { stepId: 'check', agentId: 'agent-validate', agentName: 'Validator', description: 'Validate against quality rules', onSuccess: 'analyze', onFailure: 'human_review', retryCount: 2, timeout: 20 },
    { stepId: 'analyze', agentId: 'agent-analyze', agentName: 'Data Analyzer', description: 'Analyze for patterns/issues', onSuccess: 'report', onFailure: 'human_review', retryCount: 2, timeout: 30 },
    { stepId: 'report', agentId: 'agent-route', agentName: 'Router', description: 'Route based on results', onSuccess: 'store', onFailure: 'notify_error', retryCount: 2, timeout: 10 },
    { stepId: 'store', agentId: 'agent-store', agentName: 'Storage Agent', description: 'Store QA results', onSuccess: 'notify', onFailure: 'notify_error', retryCount: 2, timeout: 15 },
    { stepId: 'notify', agentId: 'agent-notify', agentName: 'Notifier', description: 'Notify stakeholders', onSuccess: 'end', onFailure: 'end', retryCount: 1, timeout: 10 },
    { stepId: 'human_review', agentId: 'agent-approve', agentName: 'Approval Agent', description: 'Review issues', onSuccess: 'report', onFailure: 'end', retryCount: 0, timeout: 0 },
    { stepId: 'notify_error', agentId: 'agent-notify', agentName: 'Notifier', description: 'Notify of errors', onSuccess: 'end', onFailure: 'end', retryCount: 1, timeout: 10 }
  ],
  startStep: 'receive',
  endStep: 'notify',
  basePrice: 3997,
  monthlyPrice: 197,
  setupHours: 12,
  avgExecutionTime: 2,
  successRate: 95,
  estimatedHoursSavedPerWeek: 8,
  timesRun: 0,
  avgRating: 0
};

// Workflow 8: HR Automation
export const hrAutomation: Workflow = {
  id: 'wf-008',
  code: 'WF-HR-AUTO',
  name: 'HR Automation',
  description: 'Process applications, screen candidates, handle onboarding, manage benefits.',
  category: 'Human Resources',
  icon: '👥',
  targetSkills: ['SK-HR-001', 'SK-HR-002', 'SK-HR-003', 'SK-HR-006', 'SK-HR-008'],
  targetOccupations: [],
  steps: [
    { stepId: 'receive', agentId: 'agent-form-parse', agentName: 'Form Parser', description: 'Receive application/resume', onSuccess: 'screen', onFailure: 'notify_error', retryCount: 3, timeout: 10 },
    { stepId: 'screen', agentId: 'agent-match', agentName: 'Matching Engine', description: 'Match to job requirements', onSuccess: 'score', onFailure: 'human_review', retryCount: 2, timeout: 30 },
    { stepId: 'score', agentId: 'agent-classify', agentName: 'Classifier', description: 'Score candidate fit', onSuccess: 'route', onFailure: 'human_review', retryCount: 2, timeout: 20 },
    { stepId: 'route', agentId: 'agent-route', agentName: 'Router', description: 'Route to hiring manager', onSuccess: 'notify', onFailure: 'notify_error', retryCount: 2, timeout: 10 },
    { stepId: 'notify', agentId: 'agent-notify', agentName: 'Notifier', description: 'Notify stakeholders', onSuccess: 'store', onFailure: 'store', retryCount: 1, timeout: 10 },
    { stepId: 'store', agentId: 'agent-store', agentName: 'Storage Agent', description: 'Store candidate data', onSuccess: 'end', onFailure: 'notify_error', retryCount: 2, timeout: 15 },
    { stepId: 'human_review', agentId: 'agent-approve', agentName: 'Approval Agent', description: 'HR review needed', onSuccess: 'route', onFailure: 'end', retryCount: 0, timeout: 0 },
    { stepId: 'notify_error', agentId: 'agent-notify', agentName: 'Notifier', description: 'Notify of errors', onSuccess: 'end', onFailure: 'end', retryCount: 1, timeout: 10 }
  ],
  startStep: 'receive',
  endStep: 'store',
  basePrice: 4497,
  monthlyPrice: 227,
  setupHours: 14,
  avgExecutionTime: 2,
  successRate: 88,
  estimatedHoursSavedPerWeek: 12,
  timesRun: 0,
  avgRating: 0
};

// All workflows
export const workflows: Workflow[] = [
  documentPipeline,
  dataAnalysisEngine,
  communicationRouter,
  financialOpsSuite,
  salesAutomation,
  researchSynthesizer,
  qualityAssurance,
  hrAutomation
];

export function getWorkflowById(id: string): Workflow | undefined {
  return workflows.find(w => w.id === id);
}

export function getWorkflowByCode(code: string): Workflow | undefined {
  return workflows.find(w => w.code === code);
}
