// Agent Types - The building blocks of our automation factory

export type AgentCapability = 
  | 'ocr'
  | 'parse'
  | 'classify'
  | 'normalize'
  | 'analyze'
  | 'generate'
  | 'compute'
  | 'transform'
  | 'validate'
  | 'check'
  | 'flag'
  | 'approve'
  | 'route'
  | 'notify'
  | 'store';

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: 'input' | 'processing' | 'quality' | 'routing';
  capabilities: AgentCapability[];
  skillRequirements: string[]; // Links to micro_skills
  estimatedLatency: number; // seconds
  costPerRun: number; // cents
  reliability: number; // 0-100%
  exampleInputs: string[];
  exampleOutputs: string[];
}

// Input Agents - Receive and prepare data
export const inputAgents: Agent[] = [
  {
    id: 'agent-ocr',
    name: 'OCR Processor',
    description: 'Extracts text from images, PDFs, scanned documents',
    category: 'input',
    capabilities: ['ocr', 'parse'],
    skillRequirements: [],
    estimatedLatency: 2,
    costPerRun: 5,
    reliability: 95,
    exampleInputs: ['invoice.pdf', 'receipt.jpg', 'scan.png'],
    exampleOutputs: ['extracted text', 'confidence scores', 'bounding boxes']
  },
  {
    id: 'agent-email-parse',
    name: 'Email Parser',
    description: 'Parses emails, extracts attachments, classifies content',
    category: 'input',
    capabilities: ['parse', 'classify', 'normalize'],
    skillRequirements: [],
    estimatedLatency: 0.5,
    costPerRun: 1,
    reliability: 98,
    exampleInputs: ['email message', 'email thread'],
    exampleOutputs: ['structured data', 'attachment list', 'classification']
  },
  {
    id: 'agent-form-parse',
    name: 'Form Parser',
    description: 'Parses web forms, surveys, applications',
    category: 'input',
    capabilities: ['parse', 'normalize', 'classify'],
    skillRequirements: [],
    estimatedLatency: 0.3,
    costPerRun: 1,
    reliability: 97,
    exampleInputs: ['web form submission', 'application data'],
    exampleOutputs: ['structured fields', 'validation results']
  },
  {
    id: 'agent-webhook',
    name: 'Webhook Handler',
    description: 'Receives and validates webhook payloads',
    category: 'input',
    capabilities: ['parse', 'validate', 'normalize'],
    skillRequirements: [],
    estimatedLatency: 0.1,
    costPerRun: 0.5,
    reliability: 99,
    exampleInputs: ['webhook payload', 'API POST'],
    exampleOutputs: ['validated data', 'routing decision']
  },
  {
    id: 'agent-schedule',
    name: 'Schedule Parser',
    description: 'Parses calendar events, detects availability',
    category: 'input',
    capabilities: ['parse', 'classify', 'normalize'],
    skillRequirements: [],
    estimatedLatency: 0.5,
    costPerRun: 1,
    reliability: 92,
    exampleInputs: ['calendar event', 'meeting invite'],
    exampleOutputs: ['availability slots', 'conflict detection']
  },
];

// Processing Agents - Do the main work
export const processingAgents: Agent[] = [
  {
    id: 'agent-data-extract',
    name: 'Data Extractor',
    description: 'Extracts structured data from unstructured text',
    category: 'processing',
    capabilities: ['analyze', 'transform'],
    skillRequirements: ['SK-ANAL-001', 'SK-INFO-001'],
    estimatedLatency: 1.5,
    costPerRun: 3,
    reliability: 88,
    exampleInputs: ['invoice text', 'contract paragraph'],
    exampleOutputs: ['key-value pairs', 'line items', 'totals']
  },
  {
    id: 'agent-classify',
    name: 'Classifier',
    description: 'Classifies content into categories using AI',
    category: 'processing',
    capabilities: ['analyze', 'classify'],
    skillRequirements: ['SK-ANAL-001'],
    estimatedLatency: 1,
    costPerRun: 2,
    reliability: 92,
    exampleInputs: ['email content', 'document text'],
    exampleOutputs: ['category scores', 'confidence levels']
  },
  {
    id: 'agent-summarize',
    name: 'Summarizer',
    description: 'Generates concise summaries of content',
    category: 'processing',
    capabilities: ['analyze', 'generate'],
    skillRequirements: ['SK-COMM-003'],
    estimatedLatency: 2,
    costPerRun: 4,
    reliability: 90,
    exampleInputs: ['long document', 'meeting transcript'],
    exampleOutputs: ['executive summary', 'key points', 'action items']
  },
  {
    id: 'agent-analyze',
    name: 'Data Analyzer',
    description: 'Performs statistical analysis on data',
    category: 'processing',
    capabilities: ['analyze', 'compute', 'transform'],
    skillRequirements: ['SK-ANAL-004', 'SK-MATH-001'],
    estimatedLatency: 3,
    costPerRun: 5,
    reliability: 95,
    exampleInputs: ['sales data', 'financial records'],
    exampleOutputs: ['trends', 'forecasts', 'anomalies']
  },
  {
    id: 'agent-generate',
    name: 'Content Generator',
    description: 'Generates drafts, emails, reports using AI',
    category: 'processing',
    capabilities: ['generate', 'transform'],
    skillRequirements: ['SK-COMM-003', 'SK-COMM-004'],
    estimatedLatency: 3,
    costPerRun: 6,
    reliability: 85,
    exampleInputs: ['brief', 'outline', 'data points'],
    exampleOutputs: ['draft email', 'report section', 'proposal']
  },
  {
    id: 'agent-match',
    name: 'Matching Engine',
    description: 'Finds matches, duplicates, related records',
    category: 'processing',
    capabilities: ['analyze', 'compute'],
    skillRequirements: ['SK-ANAL-001'],
    estimatedLatency: 2,
    costPerRun: 3,
    reliability: 90,
    exampleInputs: ['new record', 'candidate profile'],
    exampleOutputs: ['matches', 'similarity scores', 'duplicates']
  },
  {
    id: 'agent-enrich',
    name: 'Data Enricher',
    description: 'Enriches data with external information',
    category: 'processing',
    capabilities: ['analyze', 'transform'],
    skillRequirements: ['SK-ANAL-006', 'SK-INFO-006'],
    estimatedLatency: 4,
    costPerRun: 8,
    reliability: 87,
    exampleInputs: ['company name', 'email address'],
    exampleOutputs: ['company info', 'social profiles', 'news']
  },
];

// Quality Agents - Validate and check
export const qualityAgents: Agent[] = [
  {
    id: 'agent-validate',
    name: 'Validator',
    description: 'Validates data against rules and schemas',
    category: 'quality',
    capabilities: ['validate', 'check', 'flag'],
    skillRequirements: [],
    estimatedLatency: 0.2,
    costPerRun: 0.5,
    reliability: 99,
    exampleInputs: ['form data', 'transaction'],
    exampleOutputs: ['validation result', 'error list', 'compliance status']
  },
  {
    id: 'agent-approve',
    name: 'Approval Agent',
    description: 'Routes items for human approval when needed',
    category: 'quality',
    capabilities: ['check', 'flag', 'approve'],
    skillRequirements: [],
    estimatedLatency: 0.1,
    costPerRun: 0.5,
    reliability: 100,
    exampleInputs: ['pending item', 'exception'],
    exampleOutputs: ['approval request', 'escalation', 'auto-approve']
  },
  {
    id: 'agent-factcheck',
    name: 'Fact Checker',
    description: 'Verifies claims against known facts',
    category: 'quality',
    capabilities: ['validate', 'check'],
    skillRequirements: ['SK-ANAL-001', 'SK-LEGAL-001'],
    estimatedLatency: 2,
    costPerRun: 4,
    reliability: 88,
    exampleInputs: ['generated content', 'extracted claims'],
    exampleOutputs: ['verified facts', 'confidence scores', 'discrepancies']
  },
];

// Routing Agents - Deliver and complete
export const routingAgents: Agent[] = [
  {
    id: 'agent-route',
    name: 'Router',
    description: 'Routes data to appropriate destinations',
    category: 'routing',
    capabilities: ['route', 'store'],
    skillRequirements: [],
    estimatedLatency: 0.1,
    costPerRun: 0.5,
    reliability: 99,
    exampleInputs: ['processed item', 'routing rules'],
    exampleOutputs: ['destination', 'confirmation', 'logging']
  },
  {
    id: 'agent-notify',
    name: 'Notifier',
    description: 'Sends notifications via email, Slack, SMS',
    category: 'routing',
    capabilities: ['notify', 'generate'],
    skillRequirements: ['SK-COMM-001'],
    estimatedLatency: 0.5,
    costPerRun: 1,
    reliability: 97,
    exampleInputs: ['alert', 'summary', 'approval request'],
    exampleOutputs: ['email', 'Slack message', 'SMS']
  },
  {
    id: 'agent-store',
    name: 'Storage Agent',
    description: 'Stores data in databases, S3, file systems',
    category: 'routing',
    capabilities: ['store'],
    skillRequirements: [],
    estimatedLatency: 0.3,
    costPerRun: 1,
    reliability: 99,
    exampleInputs: ['structured data', 'files'],
    exampleOutputs: ['storage confirmation', 'record ID']
  },
  {
    id: 'agent-crm',
    name: 'CRM Sync',
    description: 'Syncs data to CRM (Salesforce, HubSpot)',
    category: 'routing',
    capabilities: ['route', 'store'],
    skillRequirements: ['SK-TECH-012'],
    estimatedLatency: 1,
    costPerRun: 2,
    reliability: 95,
    exampleInputs: ['contact', 'deal', 'activity'],
    exampleOutputs: ['CRM record', 'sync status']
  },
];

// All agents
export const allAgents = [...inputAgents, ...processingAgents, ...qualityAgents, ...routingAgents];

export function getAgentsByCategory(category: Agent['category']): Agent[] {
  return allAgents.filter(a => a.category === category);
}

export function getAgentById(id: string): Agent | undefined {
  return allAgents.find(a => a.id === id);
}

export function getAgentsByCapability(capability: AgentCapability): Agent[] {
  return allAgents.filter(a => a.capabilities.includes(capability));
}
