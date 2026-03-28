import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (query.length < 1) {
      // Return popular occupations when no query
      const result = await pool.query(`
        SELECT 
          o.id,
          o.title,
          o.slug,
          o.major_category,
          oc.coverage_percent,
          oc.estimated_daily_hours_saved
        FROM occupations o
        LEFT JOIN occupation_coverage oc ON o.id = oc.occupation_id
        WHERE oc.coverage_percent IS NOT NULL
        ORDER BY oc.coverage_percent DESC
        LIMIT $1
      `, [limit]);
      
      return NextResponse.json({ results: result.rows });
    }

    // Search with autocomplete
    const result = await pool.query(`
      SELECT 
        o.id,
        o.title,
        o.slug,
        o.major_category,
        oc.coverage_percent,
        oc.estimated_daily_hours_saved
      FROM occupations o
      LEFT JOIN occupation_coverage oc ON o.id = oc.occupation_id
      WHERE o.title ILIKE $1
      ORDER BY 
        CASE WHEN o.title ILIKE $2 THEN 0 ELSE 1 END,
        o.title ASC
      LIMIT $3
    `, [`%${query}%`, `${query}%`, limit]);

    return NextResponse.json({ results: result.rows });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
