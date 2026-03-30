import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { normalizeOccupationCategory } from '@/lib/ai-jobs/categories';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function safeParseJson<T>(value: unknown, fallback: T): T {
  if (!value) {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(48, Math.max(1, parseInt(searchParams.get('pageSize') || '24', 10)));
    const category = normalizeOccupationCategory(searchParams.get('category'));
    const query = (searchParams.get('q') || '').trim();
    const sort = searchParams.get('sort') || 'time_back';

    const offset = (page - 1) * pageSize;

    let whereClause = '1=1';
    const params: (string | number)[] = [];

    if (category) {
      params.push(category);
      whereClause += ` AND o.major_category = $${params.length}`;
    }

    if (query) {
      params.push(`%${query}%`);
      whereClause += ` AND (
        o.title ILIKE $${params.length}
        OR o.major_category ILIKE $${params.length}
        OR COALESCE(o.sub_category, '') ILIKE $${params.length}
      )`;
    }

    let orderClause = 'estimated_daily_hours_saved DESC NULLS LAST, coverage_percent DESC NULLS LAST, title ASC';
    if (sort === 'ai_opportunities') {
      orderClause = 'ai_opportunities_count DESC, title ASC';
    } else if (sort === 'title') {
      orderClause = 'title ASC';
    } else if (sort === 'coverage') {
      orderClause = 'coverage_percent DESC NULLS LAST, estimated_daily_hours_saved DESC NULLS LAST, title ASC';
    }

    // Get total count from the filtered occupations table only.
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM occupations o
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / pageSize);

    const result = await pool.query(
      `WITH filtered_occupations AS (
         SELECT
           o.id,
           o.title,
           o.slug,
           o.major_category,
           o.sub_category,
           oc.coverage_percent,
           oc.estimated_daily_hours_saved,
           oc.top_actions,
           oc.recommended_packages,
           COALESCE((
             SELECT COUNT(*)
             FROM ai_opportunities ao
             WHERE ao.occupation_id = o.id
           ), 0)::int AS ai_opportunities_count,
           COALESCE((
             SELECT COUNT(*)
             FROM job_micro_tasks jmt
             WHERE jmt.occupation_id = o.id
           ), 0)::int AS micro_tasks_count
         FROM occupations o
         LEFT JOIN occupation_coverage oc ON oc.occupation_id = o.id
         WHERE ${whereClause}
       ),
       paged_occupations AS (
         SELECT *
         FROM filtered_occupations
         ORDER BY ${orderClause}
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}
       )
       SELECT
         p.id,
         p.title,
         p.slug,
         p.major_category,
         p.sub_category,
         p.coverage_percent,
         p.estimated_daily_hours_saved,
         p.top_actions,
         p.recommended_packages,
         p.ai_opportunities_count,
         p.micro_tasks_count
       FROM paged_occupations p
       ORDER BY ${sort === 'ai_opportunities' ? 'p.ai_opportunities_count DESC, p.title ASC' : 'p.title ASC'}`,
      [...params, pageSize, offset]
    );

    return NextResponse.json({
      occupations: result.rows.map((row) => ({
        ...row,
        top_actions: safeParseJson(row.top_actions, []),
        recommended_packages: safeParseJson(row.recommended_packages, []),
      })),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Browse API error:', error);

    if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error: 'The occupation database is currently unavailable.',
          code: 'database_unavailable',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch occupations' },
      { status: 500 }
    );
  }
}
