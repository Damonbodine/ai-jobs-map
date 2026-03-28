import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const occupationSlug = searchParams.get('occupation');
    const occupationId = searchParams.get('id');

    if (!occupationSlug && !occupationId) {
      return NextResponse.json(
        { error: 'Provide occupation slug or id' },
        { status: 400 }
      );
    }

    // Get occupation details
    let occQuery = 'SELECT * FROM occupations WHERE ';
    const occParams: string[] = [];
    
    if (occupationId) {
      occQuery += 'id = $1';
      occParams.push(occupationId);
    } else {
      occQuery += 'slug = $1';
      occParams.push(occupationSlug!);
    }

    const occResult = await pool.query(occQuery, occParams);
    const occupation = occResult.rows[0];

    if (!occupation) {
      return NextResponse.json(
        { error: 'Occupation not found' },
        { status: 404 }
      );
    }

    // Get top actions for this occupation
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
    `, [occupation.id]);

    // Get matching workflows based on top actions
    const actionIds = actionsResult.rows.map((a: any) => a.id);
    
    const workflowsResult = await pool.query(`
      SELECT DISTINCT
        aw.*,
        COUNT(DISTINCT aa.id) as matching_actions
      FROM automation_workflows aw
      JOIN automation_actions aa ON aa.action_code = ANY(
        SELECT jsonb_array_elements_text(aw.action_ids::jsonb)
      )
      WHERE aa.id = ANY($1)
      GROUP BY aw.id
      ORDER BY matching_actions DESC, aw.base_price ASC
    `, [actionIds]);

    // Get recommended packages
    const packagesResult = await pool.query(`
      SELECT DISTINCT
        ap.*,
        COUNT(DISTINCT aw.id) as matching_workflows
      FROM automation_packages ap
      JOIN automation_workflows aw ON aw.id = ANY(ap.workflow_ids)
      WHERE aw.id = ANY($1)
      GROUP BY ap.id
      ORDER BY 
        CASE ap.tier 
          WHEN 'starter' THEN 1 
          WHEN 'growth' THEN 2 
          WHEN 'enterprise' THEN 3 
        END,
        ap.base_price ASC
    `, [workflowsResult.rows.map((w: any) => w.id)]);

    // Calculate estimated ROI using coverage data
    const coverageHours = coverageStats.rows[0] ? parseFloat(coverageStats.rows[0].estimated_daily_hours_saved) : 0;
    const avgTimeSaved = coverageHours || workflowsResult.rows.reduce(
      (sum: number, w: any) => sum + parseFloat(w.estimated_time_saved_per_day || 0), 
      0
    );
    const workDaysPerYear = 250;
    const hourlyRate = 75; // Conservative estimate
    const yearlyValue = Math.min(avgTimeSaved, 4) * workDaysPerYear * hourlyRate;

    // Get O*NET task stats
    const taskStats = await pool.query(`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE ai_automatable = true) as automatable_tasks,
        ROUND(AVG(ai_automation_score)::numeric, 1) as avg_automation_score
      FROM onet_tasks
      WHERE occupation_id = $1
    `, [occupation.id]);

    // Get coverage data from occupation_coverage table
    const coverageStats = await pool.query(`
      SELECT 
        coverage_percent,
        covered_tasks,
        estimated_daily_hours_saved,
        top_actions,
        top_workflows,
        recommended_packages
      FROM occupation_coverage
      WHERE occupation_id = $1
    `, [occupation.id]);
    
    const coverage = coverageStats.rows[0] || {};

    return NextResponse.json({
      occupation: {
        id: occupation.id,
        title: occupation.title,
        slug: occupation.slug,
        category: occupation.major_category,
      },
      coverage: {
        percent: parseFloat(coverage.coverage_percent) || 0,
        coveredTasks: parseInt(coverage.covered_tasks) || 0,
        estimatedDailyHoursSaved: parseFloat(coverage.estimated_daily_hours_saved) || 0,
        estimatedWeeklyHoursSaved: Math.round((parseFloat(coverage.estimated_daily_hours_saved) || 0) * 5),
        estimatedYearlyValue: Math.round((parseFloat(coverage.estimated_daily_hours_saved) || 0) * 250 * 75),
      },
      analysis: {
        totalTasks: parseInt(taskStats.rows[0].total_tasks) || 0,
        automatableTasks: parseInt(taskStats.rows[0].automatable_tasks) || 0,
        avgAutomationScore: parseFloat(taskStats.rows[0].avg_automation_score) || 0,
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
        paybackDays: packagesResult.rows[0] 
          ? Math.round((parseInt(packagesResult.rows[0].base_price) / (yearlyValue / 365)))
          : 90,
        yearOneROI: packagesResult.rows[0]
          ? Math.round(((yearlyValue - (parseInt(packagesResult.rows[0].base_price) + parseInt(packagesResult.rows[0].monthly_price) * 12)) / (parseInt(packagesResult.rows[0].base_price) + parseInt(packagesResult.rows[0].monthly_price) * 12)) * 100)
          : 200,
      },
    });
  } catch (error) {
    console.error('Recommend API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
