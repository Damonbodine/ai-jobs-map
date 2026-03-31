/**
 * Fetches workflow templates from n8n's public API,
 * maps them to occupation categories and skill prefixes,
 * and inserts them into the smart_workflows tables.
 *
 * Usage: npx tsx scripts/fetch-smart-workflows.ts
 */

import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── n8n API types ──────────────────────────────────────────────

interface N8nNode {
  displayName: string;
  name: string;
}

interface N8nWorkflow {
  id: number;
  name: string;
  description: string;
  totalViews: number;
  nodes: N8nNode[];
  createdAt: string;
}

interface N8nSearchResponse {
  totalWorkflows: number;
  workflows: N8nWorkflow[];
}

// ── Mapping configuration ──────────────────────────────────────

// Search terms → what to search on n8n for
const searchQueries = [
  'email automation',
  'invoice processing',
  'document parsing',
  'CRM lead',
  'sales pipeline',
  'HR onboarding',
  'recruiting applicant',
  'data analysis spreadsheet',
  'report generation',
  'slack notification',
  'customer support ticket',
  'social media scheduling',
  'file backup sync',
  'PDF extract',
  'form submission',
  'meeting notes summary',
  'expense tracking',
  'inventory management',
  'content publishing',
  'monitoring alerts',
  'research web scrape',
  'calendar scheduling',
  'contract review',
  'compliance audit',
  'project management task',
  'accounting bookkeeping',
  'translation language',
  'image processing',
  'database sync',
  'webhook automation',
];

// Keyword patterns → skill prefix + internal workflow code + occupation categories
const keywordMappings: {
  keywords: string[];
  skillPrefix: string;
  workflowCode: string;
  categories: string[];
  solutionKey: string;
}[] = [
  {
    keywords: ['document', 'pdf', 'ocr', 'extract', 'parse', 'file', 'attachment'],
    skillPrefix: 'SK-INFO',
    workflowCode: 'WF-DOC-PIPE',
    categories: ['Office and Administrative Support'],
    solutionKey: 'intake',
  },
  {
    keywords: ['email', 'slack', 'notification', 'message', 'chat', 'teams', 'discord'],
    skillPrefix: 'SK-COMM',
    workflowCode: 'WF-COMM-ROUTE',
    categories: ['Office and Administrative Support', 'Management'],
    solutionKey: 'coordination',
  },
  {
    keywords: ['spreadsheet', 'analysis', 'data', 'report', 'chart', 'dashboard', 'analytics'],
    skillPrefix: 'SK-ANAL',
    workflowCode: 'WF-DATA-ANALYZE',
    categories: ['Computer and Mathematical', 'Business and Financial Operations'],
    solutionKey: 'analysis',
  },
  {
    keywords: ['crm', 'lead', 'sales', 'pipeline', 'hubspot', 'salesforce', 'deal', 'prospect'],
    skillPrefix: 'SK-SALE',
    workflowCode: 'WF-SALES-AUTO',
    categories: ['Sales and Related'],
    solutionKey: 'intake',
  },
  {
    keywords: ['invoice', 'expense', 'accounting', 'bookkeeping', 'payment', 'financial', 'tax', 'quickbooks'],
    skillPrefix: 'SK-FINA',
    workflowCode: 'WF-FIN-OPS',
    categories: ['Business and Financial Operations'],
    solutionKey: 'documentation',
  },
  {
    keywords: ['hr', 'recruit', 'onboarding', 'applicant', 'hiring', 'employee', 'payroll'],
    skillPrefix: 'SK-HR',
    workflowCode: 'WF-HR-AUTO',
    categories: ['Management'],
    solutionKey: 'coordination',
  },
  {
    keywords: ['research', 'scrape', 'rss', 'news', 'summarize', 'aggregate', 'web search'],
    skillPrefix: 'SK-RESE',
    workflowCode: 'WF-RESEARCH',
    categories: ['Life Physical and Social Science', 'Legal'],
    solutionKey: 'analysis',
  },
  {
    keywords: ['monitor', 'alert', 'validate', 'check', 'audit', 'compliance', 'quality'],
    skillPrefix: 'SK-OPS',
    workflowCode: 'WF-QA',
    categories: ['Management', 'Business and Financial Operations'],
    solutionKey: 'exceptions',
  },
  {
    keywords: ['schedule', 'calendar', 'meeting', 'appointment', 'booking'],
    skillPrefix: 'SK-COMM',
    workflowCode: 'WF-COMM-ROUTE',
    categories: ['Office and Administrative Support', 'Management'],
    solutionKey: 'coordination',
  },
  {
    keywords: ['content', 'publish', 'social media', 'blog', 'post', 'marketing'],
    skillPrefix: 'SK-COMM',
    workflowCode: 'WF-COMM-ROUTE',
    categories: ['Arts Design Entertainment Sports and Media', 'Sales and Related'],
    solutionKey: 'documentation',
  },
  {
    keywords: ['support', 'ticket', 'helpdesk', 'customer', 'service'],
    skillPrefix: 'SK-COMM',
    workflowCode: 'WF-COMM-ROUTE',
    categories: ['Office and Administrative Support', 'Sales and Related'],
    solutionKey: 'intake',
  },
  {
    keywords: ['contract', 'legal', 'review', 'document review'],
    skillPrefix: 'SK-LEGAL',
    workflowCode: 'WF-RESEARCH',
    categories: ['Legal'],
    solutionKey: 'analysis',
  },
  {
    keywords: ['inventory', 'stock', 'warehouse', 'supply'],
    skillPrefix: 'SK-OPS',
    workflowCode: 'WF-QA',
    categories: ['Production', 'Transportation and Material Moving'],
    solutionKey: 'exceptions',
  },
  {
    keywords: ['project', 'task', 'workflow', 'kanban', 'trello', 'asana', 'jira'],
    skillPrefix: 'SK-OPS',
    workflowCode: 'WF-QA',
    categories: ['Management', 'Computer and Mathematical'],
    solutionKey: 'coordination',
  },
];

// Node display names to skip (internal n8n nodes, not user-facing integrations)
const skipNodes = new Set([
  'When clicking \'Test workflow\'',
  'Manual Trigger',
  'Start',
  'No Operation, do nothing',
  'Set',
  'IF',
  'Switch',
  'Merge',
  'Code',
  'Function',
  'Function Item',
  'Item Lists',
  'Split In Batches',
  'Wait',
  'Execute Command',
  'HTTP Request',
  'Webhook',
  'Cron',
  'Schedule Trigger',
  'Error Trigger',
  'Execute Workflow',
  'Sticky Note',
  'n8n',
  'Date & Time',
  'Crypto',
  'XML',
  'HTML',
  'Markdown',
  'RSS Read',
  'Edit Fields (Set)',
  'Filter',
  'Sort',
  'Limit',
  'Remove Duplicates',
  'Aggregate',
  'Compare Datasets',
  'Summarize',
  'Loop Over Items',
  'Execute Workflow Trigger',
  'When Called by Another Workflow',
]);

// ── Helpers ────────────────────────────────────────────────────

function getIntegrations(nodes: N8nNode[]): string[] {
  const seen = new Set<string>();
  return nodes
    .map((n) => n.displayName)
    .filter((name) => {
      if (skipNodes.has(name) || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
}

function getTriggerType(nodes: N8nNode[]): string {
  const nodeNames = nodes.map((n) => n.name.toLowerCase());
  const displayNames = nodes.map((n) => n.displayName.toLowerCase());
  if (nodeNames.some((n) => n.includes('webhook') || n.includes('trigger'))) {
    if (displayNames.some((d) => d.includes('schedule') || d.includes('cron'))) return 'schedule';
    if (displayNames.some((d) => d.includes('email') || d.includes('gmail') || d.includes('imap'))) return 'email';
    return 'webhook';
  }
  return 'manual';
}

function getComplexity(nodeCount: number): string {
  if (nodeCount <= 5) return 'beginner';
  if (nodeCount <= 12) return 'intermediate';
  return 'advanced';
}

function estimateHoursSaved(nodeCount: number, triggerType: string): number {
  const base = triggerType === 'schedule' ? 2.0 : triggerType === 'webhook' ? 1.5 : 0.5;
  const scale = Math.min(nodeCount * 0.3, 4.0);
  return Math.round((base + scale) * 10) / 10;
}

function findBestMapping(name: string, description: string) {
  const text = `${name} ${description}`.toLowerCase();
  let bestMatch = keywordMappings[0];
  let bestScore = 0;

  for (const mapping of keywordMappings) {
    const score = mapping.keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = mapping;
    }
  }

  return { mapping: bestMatch, score: bestScore };
}

function cleanName(name: string): string {
  return name
    .replace(/\bwith n8n\b/gi, '')
    .replace(/\bn8n\b/gi, '')
    .replace(/\btemplate\b/gi, '')
    .replace(/\bcompanion workflow for.*docs?\b/gi, '')
    // Strip emoji sequences
    .replace(/[\u{1F300}-\u{1FAD6}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}✨⭐🔪🩷🤖💡🚀🔥💬🎯📧📊🔄⚡️]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDescription(description: string): string {
  return description
    .replace(/\bn8n\b/gi, 'automation')
    .replace(/\bthis workflow\b/gi, 'this automation')
    .replace(/\bthis template\b/gi, 'this automation')
    .trim();
}

// ── Main ───────────────────────────────────────────────────────

async function fetchFromN8n(query: string, page = 1, rows = 15): Promise<N8nSearchResponse> {
  const url = `https://api.n8n.io/api/templates/search?page=${page}&rows=${rows}&search=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`n8n API error: ${res.status} for query "${query}"`);
  return res.json() as Promise<N8nSearchResponse>;
}

async function main() {
  console.log('🔄 Fetching workflow templates from n8n...\n');

  // Deduplicate across search queries by n8n template ID
  const seen = new Map<number, { workflow: N8nWorkflow; query: string }>();

  for (const query of searchQueries) {
    try {
      const data = await fetchFromN8n(query, 1, 10);
      for (const wf of data.workflows) {
        if (!seen.has(wf.id) && wf.description && wf.nodes.length >= 2) {
          seen.set(wf.id, { workflow: wf, query });
        }
      }
      console.log(`  ✓ "${query}" → ${data.workflows.length} results (${seen.size} unique total)`);
      // Small delay to be polite to the API
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ✗ "${query}" failed:`, (err as Error).message);
    }
  }

  console.log(`\n📦 ${seen.size} unique templates fetched. Mapping and inserting...\n`);

  // Filter to quality templates (>= 2 real nodes, has description, maps to something)
  const templates = [...seen.values()]
    .filter(({ workflow }) => {
      const integrations = getIntegrations(workflow.nodes);
      const { score } = findBestMapping(workflow.name, workflow.description);
      return integrations.length >= 1 && score >= 1;
    })
    .sort((a, b) => (b.workflow.totalViews || 0) - (a.workflow.totalViews || 0))
    .slice(0, 150); // Take top 150 by popularity

  console.log(`📋 ${templates.length} templates pass quality filter.\n`);

  // Clear existing data
  await pool.query('DELETE FROM smart_workflow_internal_mappings');
  await pool.query('DELETE FROM smart_workflow_occupation_mappings');
  await pool.query('DELETE FROM smart_workflows');

  let inserted = 0;

  for (const { workflow } of templates) {
    const integrations = getIntegrations(workflow.nodes);
    const triggerType = getTriggerType(workflow.nodes);
    const complexity = getComplexity(workflow.nodes.length);
    const hoursSaved = estimateHoursSaved(integrations.length, triggerType);
    const { mapping, score } = findBestMapping(workflow.name, workflow.description);
    const relevance = Math.min(score / 4, 1.0);
    const tags = [...new Set(workflow.nodes.flatMap((n) => {
      const parts = n.name.split('.');
      return parts.length > 1 ? [parts[parts.length - 1]] : [];
    }))];

    // Insert smart_workflow
    const wfResult = await pool.query(
      `INSERT INTO smart_workflows
       (source_template_id, name, description, source_url, category, tags, integrations,
        integration_count, trigger_type, complexity, estimated_hours_saved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (source_template_id) DO UPDATE SET
         name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW()
       RETURNING id`,
      [
        String(workflow.id),
        cleanName(workflow.name),
        cleanDescription(workflow.description || ''),
        `https://n8n.io/workflows/${workflow.id}`,
        mapping.workflowCode,
        JSON.stringify(tags),
        JSON.stringify(integrations),
        integrations.length,
        triggerType,
        complexity,
        hoursSaved,
      ]
    );

    const smartWorkflowId = wfResult.rows[0].id;

    // Insert occupation mappings — one per category
    for (const category of mapping.categories) {
      await pool.query(
        `INSERT INTO smart_workflow_occupation_mappings
         (workflow_id, major_category, skill_code_prefix, automation_solution_key, relevance_score, mapping_source)
         VALUES ($1, $2, $3, $4, $5, 'auto_keyword')`,
        [smartWorkflowId, category, mapping.skillPrefix, mapping.solutionKey, relevance]
      );
    }

    // Insert internal workflow mapping
    await pool.query(
      `INSERT INTO smart_workflow_internal_mappings
       (workflow_id, internal_workflow_code, relationship)
       VALUES ($1, $2, 'reference')`,
      [smartWorkflowId, mapping.workflowCode]
    );

    inserted++;
  }

  console.log(`✅ Inserted ${inserted} smart workflows with mappings.\n`);

  // Summary
  const stats = await pool.query(`
    SELECT category, count(*) as count
    FROM smart_workflows
    GROUP BY category
    ORDER BY count DESC
  `);
  console.log('📊 Distribution by category:');
  for (const row of stats.rows) {
    console.log(`   ${row.category}: ${row.count}`);
  }

  const mappingStats = await pool.query(`
    SELECT major_category, count(*) as count
    FROM smart_workflow_occupation_mappings
    WHERE major_category IS NOT NULL
    GROUP BY major_category
    ORDER BY count DESC
  `);
  console.log('\n📊 Distribution by occupation category:');
  for (const row of mappingStats.rows) {
    console.log(`   ${row.major_category}: ${row.count}`);
  }

  await pool.end();
  console.log('\n🏁 Done.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
