import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const occupationResult = await pool.query(
      `SELECT 
        id,
        title,
        slug,
        major_category,
        sub_category,
        employment,
        hourly_wage,
        annual_wage
      FROM occupations
      WHERE slug = $1
      LIMIT 1`,
      [slug]
    );

    if (occupationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Occupation not found' },
        { status: 404 }
      );
    }

    const occupation = occupationResult.rows[0];

    const opportunitiesResult = await pool.query(
      `SELECT 
        id,
        title,
        description,
        category,
        impact_level,
        effort_level,
        is_ai_generated,
        is_approved
      FROM ai_opportunities
      WHERE occupation_id = $1
        AND is_approved = TRUE
      ORDER BY impact_level DESC, effort_level ASC`,
      [occupation.id]
    );

    const skillsResult = await pool.query(
      `SELECT 
        id,
        skill_name,
        skill_description,
        difficulty,
        learning_resources,
        priority
      FROM skill_recommendations
      WHERE occupation_id = $1
      ORDER BY priority DESC`,
      [occupation.id]
    );

    const readinessScore = opportunitiesResult.rows.length > 0
      ? Math.round(
          (opportunitiesResult.rows.reduce((sum: number, o: any) => sum + o.impact_level, 0) / 
           opportunitiesResult.rows.length) * 20
        )
      : 0;

    return NextResponse.json({
      occupation,
      opportunities: opportunitiesResult.rows,
      skills: skillsResult.rows,
      stats: {
        opportunityCount: opportunitiesResult.rows.length,
        readinessScore,
        categoryBreakdown: opportunitiesResult.rows.reduce((acc: Record<string, number>, o: any) => {
          acc[o.category] = (acc[o.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    });

  } catch (error) {
    console.error('Occupation fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
