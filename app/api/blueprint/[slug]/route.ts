import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/pool';
import { generateBlueprint } from '@/lib/ai-blueprints/generate-blueprint';
import { classifyOccupation } from '@/lib/ai-jobs/archetypes';

const frequencyMeta: Record<string, { dayWeight: number }> = {
  daily: { dayWeight: 1 },
  weekly: { dayWeight: 0.35 },
  monthly: { dayWeight: 0.12 },
  'as-needed': { dayWeight: 0.18 },
};

function describeTaskLens(task: any) {
  const meta = frequencyMeta[task.frequency] ?? frequencyMeta['as-needed'];
  const impact = Number(task.ai_impact_level || 0);
  const effort = Number(task.ai_effort_to_implement || 3);
  const automationFactor = task.ai_applicable
    ? Math.max(0.24, impact * 0.18 + (6 - effort) * 0.08)
    : 0.06;
  return { modeledMinutesPerDay: Math.round(meta.dayWeight * 26 * automationFactor) };
}

function inferWorkBlock(task: any) {
  const content = `${task.task_name || ''} ${task.task_description || ''} ${task.ai_how_it_helps || ''}`.toLowerCase();
  const category = String(task.ai_category || '').toLowerCase();
  if (category === 'communication' || /(schedule|follow[- ]?up|coordinate|communicat|notify|respond|meeting|handoff|route)/.test(content)) return 'coordination';
  if (category === 'research_discovery' || category === 'data_analysis' || category === 'decision_support' || /(analy|evaluat|compare|research|assess|forecast|estimate|study|review options)/.test(content)) return 'analysis';
  if (category === 'creative_assistance' || /(design|draft|document|report|write|plan|layout|prepare|model)/.test(content)) return 'documentation';
  if (/(inspect|validate|verify|check|monitor|audit|compliance|quality|exception)/.test(content)) return 'exceptions';
  return 'intake';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { rows: [occupation] } = await pool.query(
    'SELECT id, title, slug, major_category FROM occupations WHERE slug = $1',
    [slug]
  );
  if (!occupation) {
    return NextResponse.json({ error: 'Occupation not found' }, { status: 404 });
  }

  const [microResult, onetResult, profileResult] = await Promise.all([
    pool.query('SELECT * FROM job_micro_tasks WHERE occupation_id = $1', [occupation.id]),
    pool.query(
      'SELECT task_title, ai_automation_score, ai_difficulty, estimated_time_saved_percent, gwa_title FROM onet_tasks WHERE occupation_id = $1 ORDER BY ai_automation_score DESC NULLS LAST LIMIT 30',
      [occupation.id]
    ),
    pool.query('SELECT * FROM occupation_automation_profile WHERE occupation_id = $1', [occupation.id]),
  ]);

  const taskEntries = microResult.rows.map((task: any) => ({
    ...task,
    lens: describeTaskLens(task),
    workBlock: inferWorkBlock(task),
  }));

  const profile = profileResult.rows[0] || null;
  const archetype = classifyOccupation(profile);
  const timeRangeByBlock = profile?.time_range_by_block ? JSON.parse(profile.time_range_by_block) : null;
  const blueprint = generateBlueprint(taskEntries, archetype, occupation.title, onetResult.rows, timeRangeByBlock);

  return NextResponse.json({
    occupation: { id: occupation.id, title: occupation.title, slug: occupation.slug, majorCategory: occupation.major_category },
    blueprint,
  });
}
