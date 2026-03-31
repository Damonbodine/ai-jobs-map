import { pool } from '@/lib/db/pool';

export interface SmartWorkflowResult {
  id: number;
  name: string;
  description: string;
  category: string;
  integrations: string[];
  integrationCount: number;
  triggerType: string;
  complexity: string;
  estimatedHoursSaved: number;
  relevanceScore: number;
  automationSolutionKey: string | null;
  skillCodePrefix: string | null;
}

/**
 * Get smart workflows relevant to a specific occupation.
 * Queries across 3 mapping levels:
 *   1. Direct occupation_id match (highest relevance)
 *   2. major_category match
 *   3. skill_code_prefix match
 * Returns deduplicated, sorted by relevance.
 */
export async function getWorkflowsForOccupation(
  occupationId: number,
  majorCategory: string,
  limit = 6
): Promise<SmartWorkflowResult[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (sw.id)
       sw.id, sw.name, sw.description, sw.category,
       sw.integrations, sw.integration_count, sw.trigger_type,
       sw.complexity, sw.estimated_hours_saved,
       m.relevance_score, m.automation_solution_key, m.skill_code_prefix
     FROM smart_workflows sw
     JOIN smart_workflow_occupation_mappings m ON m.workflow_id = sw.id
     WHERE sw.is_active = true
       AND (m.occupation_id = $1 OR m.major_category = $2)
     ORDER BY sw.id, m.relevance_score DESC`,
    [occupationId, majorCategory]
  );

  return rows
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      integrations: row.integrations ? JSON.parse(row.integrations) : [],
      integrationCount: row.integration_count,
      triggerType: row.trigger_type,
      complexity: row.complexity,
      estimatedHoursSaved: row.estimated_hours_saved,
      relevanceScore: row.relevance_score,
      automationSolutionKey: row.automation_solution_key,
      skillCodePrefix: row.skill_code_prefix,
    }));
}

/**
 * Search smart workflows by text query, category, or solution key.
 */
export async function searchWorkflows(params: {
  search?: string;
  category?: string;
  solution?: string;
  limit?: number;
}): Promise<SmartWorkflowResult[]> {
  const conditions: string[] = ['sw.is_active = true'];
  const values: (string | number)[] = [];
  let idx = 1;

  if (params.search) {
    conditions.push(`(sw.name ILIKE $${idx} OR sw.description ILIKE $${idx})`);
    values.push(`%${params.search}%`);
    idx++;
  }
  if (params.category) {
    conditions.push(`m.major_category = $${idx}`);
    values.push(params.category);
    idx++;
  }
  if (params.solution) {
    conditions.push(`m.automation_solution_key = $${idx}`);
    values.push(params.solution);
    idx++;
  }

  const limit = params.limit || 6;
  values.push(limit);

  const { rows } = await pool.query(
    `SELECT DISTINCT ON (sw.id)
       sw.id, sw.name, sw.description, sw.category,
       sw.integrations, sw.integration_count, sw.trigger_type,
       sw.complexity, sw.estimated_hours_saved,
       COALESCE(m.relevance_score, 0.5) as relevance_score,
       m.automation_solution_key, m.skill_code_prefix
     FROM smart_workflows sw
     LEFT JOIN smart_workflow_occupation_mappings m ON m.workflow_id = sw.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY sw.id, COALESCE(m.relevance_score, 0.5) DESC
     LIMIT $${idx}`,
    values
  );

  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as number,
    name: row.name as string,
    description: row.description as string,
    category: row.category as string,
    integrations: row.integrations ? JSON.parse(row.integrations as string) : [],
    integrationCount: row.integration_count as number,
    triggerType: row.trigger_type as string,
    complexity: row.complexity as string,
    estimatedHoursSaved: row.estimated_hours_saved as number,
    relevanceScore: row.relevance_score as number,
    automationSolutionKey: row.automation_solution_key as string | null,
    skillCodePrefix: row.skill_code_prefix as string | null,
  }));
}
