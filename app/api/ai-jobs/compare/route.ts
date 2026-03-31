import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slugs = searchParams.get('slugs')?.split(',').filter(Boolean);

  if (!slugs || slugs.length < 2 || slugs.length > 4) {
    return NextResponse.json(
      { error: 'Provide 2-4 comma-separated slugs via ?slugs=slug1,slug2' },
      { status: 400 }
    );
  }

  try {
    const placeholders = slugs.map((_, i) => `$${i + 1}`).join(',');

    const result = await pool.query(
      `SELECT
         o.id, o.title, o.slug, o.major_category, o.employment, o.annual_wage,
         p.composite_score,
         p.ability_automation_potential,
         p.work_activity_automation_potential,
         p.keyword_score,
         p.knowledge_digital_readiness,
         p.task_frequency_weight,
         p.physical_ability_avg,
         p.cognitive_routine_avg,
         p.cognitive_creative_avg,
         oc.coverage_percent,
         oc.estimated_daily_hours_saved,
         (SELECT COUNT(*) FROM job_micro_tasks mt WHERE mt.occupation_id = o.id AND mt.ai_applicable = true) as automatable_tasks,
         (SELECT COUNT(*) FROM job_micro_tasks mt WHERE mt.occupation_id = o.id) as total_tasks
       FROM occupations o
       LEFT JOIN occupation_automation_profile p ON p.occupation_id = o.id
       LEFT JOIN occupation_coverage oc ON oc.occupation_id = o.id
       WHERE o.slug IN (${placeholders})
       ORDER BY p.composite_score DESC NULLS LAST`,
      slugs
    );

    if (result.rows.length < 2) {
      return NextResponse.json(
        { error: 'Could not find enough matching occupations. Check your slugs.' },
        { status: 404 }
      );
    }

    // Fetch top abilities for each occupation
    const occupations = await Promise.all(
      result.rows.map(async (occ) => {
        const abilities = await pool.query(
          `SELECT element_name, importance
           FROM onet_abilities WHERE occupation_id = $1
           ORDER BY importance DESC NULLS LAST LIMIT 5`,
          [occ.id]
        );

        const knowledge = await pool.query(
          `SELECT element_name, importance
           FROM onet_knowledge WHERE occupation_id = $1
           ORDER BY importance DESC NULLS LAST LIMIT 5`,
          [occ.id]
        );

        return {
          ...occ,
          top_abilities: abilities.rows,
          top_knowledge: knowledge.rows,
        };
      })
    );

    return NextResponse.json({ occupations });
  } catch (error) {
    console.error('Compare error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
