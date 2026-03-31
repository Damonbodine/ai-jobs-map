import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/pool';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { occupationSlug, occupationId, email, hourlyRate = 50 } = body;

    let occupation;
    
    // Find occupation
    if (occupationId) {
      const result = await pool.query(
        'SELECT id, title, slug FROM occupations WHERE id = $1',
        [occupationId]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Occupation not found' }, { status: 404 });
      }
      occupation = result.rows[0];
    } else if (occupationSlug) {
      const result = await pool.query(
        'SELECT id, title, slug FROM occupations WHERE slug = $1',
        [occupationSlug]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Occupation not found' }, { status: 404 });
      }
      occupation = result.rows[0];
    } else {
      return NextResponse.json({ error: 'occupationId or occupationSlug required' }, { status: 400 });
    }

    // Get enhanced tasks for this occupation
    const tasksResult = await pool.query(`
      SELECT 
        et.*,
        tc.category_name,
        tc.category_code,
        tc.icon as category_icon
      FROM enhanced_tasks et
      LEFT JOIN task_categories tc ON et.category_id = tc.id
      WHERE et.occupation_id = $1
      ORDER BY 
        CASE et.automation_readiness 
          WHEN 'ready_now' THEN 1 
          WHEN 'ready_soon' THEN 2 
          WHEN 'needs_review' THEN 3 
          ELSE 4 
        END,
        et.estimated_annual_savings_dollars DESC
    `, [occupation.id]);

    const tasks = tasksResult.rows;

    // Get proof points for top tasks
    const taskIds = tasks.slice(0, 10).map(t => t.id);
    let proofPoints: any[] = [];
    if (taskIds.length > 0) {
      const proofResult = await pool.query(`
        SELECT * FROM task_proof_points 
        WHERE enhanced_task_id = ANY($1)
        ORDER BY credibility_score DESC
      `, [taskIds]);
      proofPoints = proofResult.rows;
    }

    // Calculate audit summary
    const totalWeeklyHours = tasks.reduce((sum, t) => sum + (parseFloat(t.weekly_hours) || 0), 0);
    const automatableTasks = tasks.filter(t => t.automation_readiness === 'ready_now');
    const automatableHours = automatableTasks.reduce((sum, t) => sum + (parseFloat(t.weekly_hours) || 0), 0);
    const totalAnnualSavings = automatableTasks.reduce((sum, t) => sum + (parseFloat(t.estimated_annual_savings_dollars) || 0), 0);
    
    const automationScore = Math.round((automatableHours / Math.max(totalWeeklyHours, 1)) * 100);

    // Categorize tasks
    const categorizedTasks = {
      ready_now: tasks.filter(t => t.automation_readiness === 'ready_now'),
      ready_soon: tasks.filter(t => t.automation_readiness === 'ready_soon'),
      needs_review: tasks.filter(t => t.automation_readiness === 'needs_review'),
      not_ready: tasks.filter(t => t.automation_readiness === 'not_ready'),
    };

    // Group by category
    const tasksByCategory = tasks.reduce((acc, task) => {
      const cat = task.category_code || 'other';
      if (!acc[cat]) {
        acc[cat] = {
          category_name: task.category_name,
          category_icon: task.category_icon,
          tasks: [],
          total_hours: 0,
          total_savings: 0,
        };
      }
      acc[cat].tasks.push(task);
      acc[cat].total_hours += parseFloat(task.weekly_hours) || 0;
      acc[cat].total_savings += parseFloat(task.estimated_annual_savings_dollars) || 0;
      return acc;
    }, {} as Record<string, any>);

    // Create audit session
    const sessionToken = crypto.randomUUID();
    await pool.query(`
      INSERT INTO audit_sessions (
        session_token, email, occupation_id, job_title, hourly_rate,
        automation_score, total_weekly_hours, automatable_hours, total_annual_savings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      sessionToken, email, occupation.id, occupation.title, hourlyRate,
      automationScore, totalWeeklyHours, automatableHours, totalAnnualSavings
    ]);

    // Generate personalized insights
    const insights = generateInsights(tasks, hourlyRate);

    return NextResponse.json({
      session: {
        token: sessionToken,
        occupation: occupation.title,
        generated_at: new Date().toISOString(),
      },
      summary: {
        automation_score: automationScore,
        total_tasks: tasks.length,
        ready_now_tasks: automatableTasks.length,
        total_weekly_hours: Math.round(totalWeeklyHours * 10) / 10,
        automatable_weekly_hours: Math.round(automatableHours * 10) / 10,
        potential_weekly_savings: Math.round(totalAnnualSavings / 52),
        potential_annual_savings: Math.round(totalAnnualSavings),
      },
      tasks_by_readiness: categorizedTasks,
      tasks_by_category: tasksByCategory,
      top_opportunities: automatableTasks.slice(0, 5).map(task => ({
        ...task,
        proof_points: proofPoints.filter(p => p.enhanced_task_id === task.id),
      })),
      insights,
      hourly_rate: hourlyRate,
    });

  } catch (error) {
    console.error('Error generating audit:', error);
    return NextResponse.json({ error: 'Failed to generate audit' }, { status: 500 });
  }
}

function generateInsights(tasks: any[], hourlyRate: number) {
  const insights: string[] = [];
  
  const readyNow = tasks.filter(t => t.automation_readiness === 'ready_now');
  const lowRisk = tasks.filter(t => t.risk_level === 'low');
  const highValue = tasks.filter(t => t.estimated_annual_savings_dollars > 5000);
  
  if (readyNow.length > 0) {
    insights.push(`You have ${readyNow.length} tasks ready to automate today with minimal setup.`);
  }
  
  if (lowRisk.length > 0) {
    insights.push(`${lowRisk.length} tasks are low-risk and can be automated with confidence.`);
  }
  
  if (highValue.length > 0) {
    insights.push(`${highValue.length} tasks could save over $5,000/year each.`);
  }
  
  const dailyTasks = tasks.filter(t => t.frequency === 'daily');
  if (dailyTasks.length > 0) {
    const dailyHours = dailyTasks.reduce((sum, t) => sum + (parseFloat(t.weekly_hours) || 0) / 5, 0);
    insights.push(`Your daily tasks alone take ${Math.round(dailyHours * 10) / 10} hours per day.`);
  }
  
  // Quick win recommendation
  const quickWins = readyNow.filter(t => t.automation_difficulty === 'easy' || t.automation_difficulty === 'trivial');
  if (quickWins.length > 0) {
    insights.push(`Start with "${quickWins[0].task_name}" - it's easy to automate and saves ${Math.round(quickWins[0].estimated_annual_savings_dollars)} per year.`);
  }
  
  return insights;
}
