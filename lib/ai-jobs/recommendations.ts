import type { Pool } from 'pg';

export interface OccupationCoverageSnapshot {
  percent: number;
  coveredTasks: number;
  estimatedDailyHoursSaved: number;
  estimatedWeeklyHoursSaved: number;
  estimatedYearlyValue: number;
}

export interface OccupationActionRecommendation {
  code: string;
  name: string;
  category: string;
  taskCount: number;
  confidence: number;
}

export interface OccupationWorkflowRecommendation {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  monthlyPrice: number;
  timeSavedPerDay: number;
  requiresApproval: boolean;
}

export interface OccupationPackageRecommendation {
  id: number;
  code: string;
  name: string;
  description: string;
  tier: string;
  basePrice: number;
  monthlyPrice: number;
  includesSelfHealing: boolean;
  roiMultiplier: number;
}

export interface OccupationRecommendationSnapshot {
  coverage: OccupationCoverageSnapshot;
  analysis: {
    totalTasks: number;
    automatableTasks: number;
    avgAutomationScore: number;
    estimatedDailyTimeSaved: number;
  };
  topActions: OccupationActionRecommendation[];
  recommendedWorkflows: OccupationWorkflowRecommendation[];
  recommendedPackages: OccupationPackageRecommendation[];
  roi: {
    estimatedDailyTimeSaved: number;
    estimatedYearlyValue: number;
    paybackDays: number;
    yearOneROI: number;
  };
}

export async function getOccupationRecommendationSnapshot(
  pool: Pool,
  occupationId: number
): Promise<OccupationRecommendationSnapshot> {
  const actionsResult = await pool.query(`
    SELECT 
      aa.*,
      COUNT(ttm.id) as task_count,
      ROUND(AVG(ttm.confidence_score)::numeric, 2) as avg_confidence
    FROM automation_actions aa
    JOIN task_to_action_mapping ttm ON aa.id = ttm.action_id
    JOIN onet_tasks ot ON ttm.onet_task_id = ot.id
    WHERE ot.occupation_id = $1
    GROUP BY aa.id
    ORDER BY task_count DESC
    LIMIT 10
  `, [occupationId]);

  const actionIds = actionsResult.rows.map((a: any) => a.id);

  const workflowsResult = actionIds.length > 0
    ? await pool.query(`
        SELECT DISTINCT
          aw.*,
          (SELECT COUNT(*) FROM unnest(aw.action_ids) aid WHERE aid = ANY($1)) as matching_actions
        FROM automation_workflows aw
        WHERE aw.id IN (
          SELECT DISTINCT aw2.id
          FROM automation_workflows aw2
          CROSS JOIN unnest(aw2.action_ids) as aid
          WHERE aid = ANY($1)
        )
        ORDER BY matching_actions DESC, aw.base_price ASC
        LIMIT 5
      `, [actionIds])
    : { rows: [] };

  const workflowIds = workflowsResult.rows.map((w: any) => w.id);

  const packagesResult = workflowIds.length > 0
    ? await pool.query(`
        SELECT ap.*,
          (SELECT COUNT(*) FROM unnest(ap.workflow_ids) wid WHERE wid = ANY($1)) as matching_workflows
        FROM automation_packages ap
        WHERE EXISTS (
          SELECT 1 FROM unnest(ap.workflow_ids) wid WHERE wid = ANY($1)
        )
        ORDER BY 
          CASE ap.tier 
            WHEN 'starter' THEN 1 
            WHEN 'growth' THEN 2 
            WHEN 'enterprise' THEN 3 
          END,
          ap.base_price ASC
      `, [workflowIds])
    : { rows: [] };

  const taskStats = await pool.query(`
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(*) FILTER (WHERE ai_automatable = true) as automatable_tasks,
      ROUND(AVG(ai_automation_score)::numeric, 1) as avg_automation_score
    FROM onet_tasks
    WHERE occupation_id = $1
  `, [occupationId]);

  const coverageStats = await pool.query(`
    SELECT 
      coverage_percent,
      covered_tasks,
      estimated_daily_hours_saved
    FROM occupation_coverage
    WHERE occupation_id = $1
  `, [occupationId]);

  const coverage = coverageStats.rows[0] || {};
  const coverageHours = parseFloat(coverage.estimated_daily_hours_saved) || 0;
  const avgTimeSaved = coverageHours || workflowsResult.rows.reduce(
    (sum: number, w: any) => sum + parseFloat(w.estimated_time_saved_per_day || 0),
    0
  );
  const yearlyValue = Math.min(avgTimeSaved, 4) * 250 * 75;
  const firstPackage = packagesResult.rows[0];
  const annualPackageCost = firstPackage
    ? parseInt(firstPackage.base_price) + (parseInt(firstPackage.monthly_price) * 12)
    : 0;

  return {
    coverage: {
      percent: parseFloat(coverage.coverage_percent) || 0,
      coveredTasks: parseInt(coverage.covered_tasks) || 0,
      estimatedDailyHoursSaved: coverageHours,
      estimatedWeeklyHoursSaved: Math.round(coverageHours * 5),
      estimatedYearlyValue: Math.round(coverageHours * 250 * 75),
    },
    analysis: {
      totalTasks: parseInt(taskStats.rows[0]?.total_tasks) || 0,
      automatableTasks: parseInt(taskStats.rows[0]?.automatable_tasks) || 0,
      avgAutomationScore: parseFloat(taskStats.rows[0]?.avg_automation_score) || 0,
      estimatedDailyTimeSaved: Math.min(avgTimeSaved, 3),
    },
    topActions: actionsResult.rows.slice(0, 6).map((a: any) => ({
      code: a.action_code,
      name: a.action_name,
      category: a.category,
      taskCount: parseInt(a.task_count),
      confidence: parseFloat(a.avg_confidence),
    })),
    recommendedWorkflows: workflowsResult.rows.slice(0, 5).map((w: any) => ({
      id: w.id,
      code: w.workflow_code,
      name: w.workflow_name,
      description: w.workflow_description,
      category: w.category,
      basePrice: parseInt(w.base_price),
      monthlyPrice: parseInt(w.monthly_maintenance),
      timeSavedPerDay: parseFloat(w.estimated_time_saved_per_day),
      requiresApproval: w.requires_human_approval,
    })),
    recommendedPackages: packagesResult.rows.map((p: any) => ({
      id: p.id,
      code: p.package_code,
      name: p.package_name,
      description: p.package_description,
      tier: p.tier,
      basePrice: parseInt(p.base_price),
      monthlyPrice: parseInt(p.monthly_price),
      includesSelfHealing: p.includes_self_healing,
      roiMultiplier: parseFloat(p.roi_multiplier),
    })),
    roi: {
      estimatedDailyTimeSaved: Math.min(avgTimeSaved, 3),
      estimatedYearlyValue: yearlyValue,
      paybackDays: firstPackage && yearlyValue > 0
        ? Math.round(parseInt(firstPackage.base_price) / (yearlyValue / 365))
        : 90,
      yearOneROI: firstPackage && annualPackageCost > 0
        ? Math.round(((yearlyValue - annualPackageCost) / annualPackageCost) * 100)
        : 200,
    },
  };
}
