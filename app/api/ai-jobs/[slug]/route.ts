import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const occupationResult = await sql`
      SELECT 
        id,
        title,
        slug,
        major_category,
        sub_category,
        employment,
        hourly_wage,
        annual_wage
      FROM occupations
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (occupationResult.length === 0) {
      return NextResponse.json(
        { error: 'Occupation not found' },
        { status: 404 }
      );
    }

    const occupation = occupationResult[0];

    // Get AI opportunities for this occupation
    const opportunitiesResult = await sql`
      SELECT 
        id,
        title,
        description,
        category,
        impact_level,
        effort_level,
        is_ai_generated,
        is_approved
      FROM ai_opportunities
      WHERE occupation_id = ${occupation.id}
        AND is_approved = TRUE
      ORDER BY impact_level DESC, effort_level ASC
    `;

    // Get skill recommendations
    const skillsResult = await sql`
      SELECT 
        id,
        skill_name,
        skill_description,
        difficulty,
        learning_resources,
        priority
      FROM skill_recommendations
      WHERE occupation_id = ${occupation.id}
      ORDER BY priority DESC
    `;

    // Calculate AI readiness score
    const readinessScore = opportunitiesResult.length > 0
      ? Math.round(
          (opportunitiesResult.reduce((sum, o) => sum + o.impact_level, 0) / 
           opportunitiesResult.length) * 20
        )
      : 0;

    return NextResponse.json({
      occupation,
      opportunities: opportunitiesResult,
      skills: skillsResult,
      stats: {
        opportunityCount: opportunitiesResult.length,
        readinessScore,
        categoryBreakdown: opportunitiesResult.reduce((acc, o) => {
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
