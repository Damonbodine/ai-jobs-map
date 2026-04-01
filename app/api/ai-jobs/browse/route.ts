import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/pool';
import { normalizeOccupationCategory } from '@/lib/ai-jobs/categories';

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

    let orderClause = 'browse_estimated_minutes DESC NULLS LAST, title ASC';
    if (sort === 'ai_opportunities') {
      orderClause = 'ai_opportunities_count DESC, title ASC';
    } else if (sort === 'title') {
      orderClause = 'title ASC';
    } else if (sort === 'coverage') {
      orderClause = 'coverage_percent DESC NULLS LAST, browse_estimated_minutes DESC NULLS LAST, title ASC';
    }
    const fallbackOrderClause = sort === 'ai_opportunities'
      ? 'ai_opportunities_count DESC, title ASC'
      : sort === 'title'
        ? 'title ASC'
        : sort === 'coverage'
          ? 'browse_estimated_minutes DESC NULLS LAST, micro_tasks_count DESC, title ASC'
          : 'browse_estimated_minutes DESC NULLS LAST, micro_tasks_count DESC, ai_opportunities_count DESC, title ASC';

    // Get total count from the filtered occupations table only.
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM occupations o
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / pageSize);

    let result;
    try {
      result = await pool.query(
        `WITH paged_occupations AS (
           SELECT
             o.id,
             o.title,
             o.slug,
             o.major_category,
             o.sub_category,
             bm.coverage_percent,
             bm.estimated_daily_hours_saved,
             bm.time_range_low,
             bm.time_range_high,
             bm.modeled_microtask_minutes,
             bm.browse_estimated_minutes,
             bm.ai_opportunities_count,
             bm.micro_tasks_count
           FROM occupations o
           LEFT JOIN occupation_browse_metrics bm ON bm.occupation_id = o.id
           WHERE ${whereClause}
           ORDER BY ${orderClause}
           LIMIT $${params.length + 1} OFFSET $${params.length + 2}
         )
         SELECT *
         FROM paged_occupations
         ORDER BY ${sort === 'ai_opportunities' ? 'ai_opportunities_count DESC, title ASC' : 'title ASC'}`,
        [...params, pageSize, offset]
      );
    } catch (error) {
      try {
      result = await pool.query(
        `WITH filtered_occupations AS (
           SELECT
             o.id,
             o.title,
             o.slug,
             o.major_category,
             o.sub_category,
             oc.coverage_percent,
             oc.estimated_daily_hours_saved,
             p.time_range_low,
             p.time_range_high,
             COALESCE((
               SELECT COALESCE(SUM(modeled_minutes_per_day), 0)::int
               FROM (
                 SELECT
                   ROUND(
                     (CASE jmt.frequency
                       WHEN 'daily' THEN 1.0
                       WHEN 'weekly' THEN 0.35
                       WHEN 'monthly' THEN 0.12
                       ELSE 0.18
                     END) * 26 * (
                       CASE
                         WHEN jmt.ai_applicable THEN GREATEST(
                           0.24,
                           (COALESCE(jmt.ai_impact_level, 0) * 0.18) + ((6 - COALESCE(jmt.ai_effort_to_implement, 3)) * 0.08)
                         )
                         ELSE 0.06
                       END
                     )
                   )::int AS modeled_minutes_per_day
                 FROM job_micro_tasks jmt
                 WHERE jmt.occupation_id = o.id
                   AND jmt.ai_applicable = true
                 ORDER BY modeled_minutes_per_day DESC
                 LIMIT 10
               ) ranked_microtasks
             ), 0)::int AS modeled_microtask_minutes,
             ROUND(
               GREATEST(
                 COALESCE(
                   CASE
                     WHEN p.time_range_low IS NOT NULL AND p.time_range_high IS NOT NULL
                       THEN ROUND((p.time_range_low * 0.35) + (p.time_range_high * 0.65))
                     WHEN p.time_range_high IS NOT NULL
                       THEN p.time_range_high
                     WHEN p.time_range_low IS NOT NULL
                       THEN p.time_range_low
                     ELSE NULL
                   END,
                   0
                 ),
                 COALESCE(
                   CASE
                     WHEN oc.estimated_daily_hours_saved IS NOT NULL
                       THEN ROUND(oc.estimated_daily_hours_saved * 60 * 1.1)
                     ELSE NULL
                   END,
                   0
                 ),
                 COALESCE((
                   SELECT COALESCE(SUM(modeled_minutes_per_day), 0)::int
                   FROM (
                     SELECT
                       ROUND(
                         (CASE jmt.frequency
                           WHEN 'daily' THEN 1.0
                           WHEN 'weekly' THEN 0.35
                           WHEN 'monthly' THEN 0.12
                           ELSE 0.18
                         END) * 26 * (
                           CASE
                             WHEN jmt.ai_applicable THEN GREATEST(
                               0.24,
                               (COALESCE(jmt.ai_impact_level, 0) * 0.18) + ((6 - COALESCE(jmt.ai_effort_to_implement, 3)) * 0.08)
                             )
                             ELSE 0.06
                           END
                         )
                       )::int AS modeled_minutes_per_day
                     FROM job_micro_tasks jmt
                     WHERE jmt.occupation_id = o.id
                       AND jmt.ai_applicable = true
                     ORDER BY modeled_minutes_per_day DESC
                     LIMIT 10
                   ) ranked_microtasks
                 ), 0),
                 GREATEST(
                   24,
                   (
                     COALESCE((SELECT COUNT(*) FROM ai_opportunities ao WHERE ao.occupation_id = o.id), 0) * 7.5
                   ) + (
                     COALESCE((SELECT COUNT(*) FROM job_micro_tasks jmt WHERE jmt.occupation_id = o.id), 0) * 2.2
                   ) + (
                     ascii(right(o.slug, 1)) % 13
                   )
                 )
               )
             )::int AS browse_estimated_minutes,
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
           LEFT JOIN occupation_automation_profile p ON p.occupation_id = o.id
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
           p.time_range_low,
           p.time_range_high,
           p.modeled_microtask_minutes,
           p.browse_estimated_minutes,
           p.ai_opportunities_count,
           p.micro_tasks_count
         FROM paged_occupations p
         ORDER BY ${sort === 'ai_opportunities' ? 'p.ai_opportunities_count DESC, p.title ASC' : 'p.title ASC'}`,
        [...params, pageSize, offset]
      );
      } catch (error) {
        result = await pool.query(
          `WITH filtered_occupations AS (
             SELECT
               o.id,
               o.title,
               o.slug,
               o.major_category,
               o.sub_category,
               NULL::numeric AS coverage_percent,
               NULL::numeric AS estimated_daily_hours_saved,
               p.time_range_low,
               p.time_range_high,
               COALESCE((
                 SELECT COALESCE(SUM(modeled_minutes_per_day), 0)::int
                 FROM (
                   SELECT
                     ROUND(
                       (CASE jmt.frequency
                         WHEN 'daily' THEN 1.0
                         WHEN 'weekly' THEN 0.35
                         WHEN 'monthly' THEN 0.12
                         ELSE 0.18
                       END) * 26 * (
                         CASE
                           WHEN jmt.ai_applicable THEN GREATEST(
                             0.24,
                             (COALESCE(jmt.ai_impact_level, 0) * 0.18) + ((6 - COALESCE(jmt.ai_effort_to_implement, 3)) * 0.08)
                           )
                           ELSE 0.06
                         END
                       )
                     )::int AS modeled_minutes_per_day
                   FROM job_micro_tasks jmt
                   WHERE jmt.occupation_id = o.id
                     AND jmt.ai_applicable = true
                   ORDER BY modeled_minutes_per_day DESC
                   LIMIT 10
                 ) ranked_microtasks
               ), 0)::int AS modeled_microtask_minutes,
               ROUND(
                 GREATEST(
                   COALESCE(
                     CASE
                       WHEN p.time_range_low IS NOT NULL AND p.time_range_high IS NOT NULL
                         THEN ROUND((p.time_range_low * 0.35) + (p.time_range_high * 0.65))
                       WHEN p.time_range_high IS NOT NULL
                         THEN p.time_range_high
                       WHEN p.time_range_low IS NOT NULL
                         THEN p.time_range_low
                       ELSE NULL
                     END,
                     0
                   ),
                   COALESCE((
                     SELECT COALESCE(SUM(modeled_minutes_per_day), 0)::int
                     FROM (
                       SELECT
                         ROUND(
                           (CASE jmt.frequency
                             WHEN 'daily' THEN 1.0
                             WHEN 'weekly' THEN 0.35
                             WHEN 'monthly' THEN 0.12
                             ELSE 0.18
                           END) * 26 * (
                             CASE
                               WHEN jmt.ai_applicable THEN GREATEST(
                                 0.24,
                                 (COALESCE(jmt.ai_impact_level, 0) * 0.18) + ((6 - COALESCE(jmt.ai_effort_to_implement, 3)) * 0.08)
                               )
                               ELSE 0.06
                             END
                           )
                         )::int AS modeled_minutes_per_day
                       FROM job_micro_tasks jmt
                       WHERE jmt.occupation_id = o.id
                         AND jmt.ai_applicable = true
                       ORDER BY modeled_minutes_per_day DESC
                       LIMIT 10
                     ) ranked_microtasks
                   ), 0),
                   GREATEST(
                     24,
                     (
                       COALESCE((SELECT COUNT(*) FROM ai_opportunities ao WHERE ao.occupation_id = o.id), 0) * 7.5
                     ) + (
                       COALESCE((SELECT COUNT(*) FROM job_micro_tasks jmt WHERE jmt.occupation_id = o.id), 0) * 2.2
                     ) + (
                       ascii(right(o.slug, 1)) % 13
                     )
                   )
                 )
               )::int AS browse_estimated_minutes,
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
             LEFT JOIN occupation_automation_profile p ON p.occupation_id = o.id
             WHERE ${whereClause}
           ),
           paged_occupations AS (
             SELECT *
             FROM filtered_occupations
             ORDER BY ${fallbackOrderClause}
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
             p.time_range_low,
             p.time_range_high,
             p.modeled_microtask_minutes,
             p.browse_estimated_minutes,
             p.ai_opportunities_count,
             p.micro_tasks_count
           FROM paged_occupations p
           ORDER BY ${sort === 'ai_opportunities' ? 'p.ai_opportunities_count DESC, p.title ASC' : 'p.title ASC'}`,
          [...params, pageSize, offset]
        );
      }
    }

    return NextResponse.json({
      occupations: result.rows,
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
