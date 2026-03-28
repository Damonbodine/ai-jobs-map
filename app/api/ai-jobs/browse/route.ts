import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '24');
    const category = searchParams.get('category') || '';
    const query = searchParams.get('q') || '';
    const sort = searchParams.get('sort') || 'title';

    const offset = (page - 1) * pageSize;

    // Build WHERE clause
    let whereClause = '1=1';
    const params: (string | number)[] = [];
    
    if (category) {
      params.push(category);
      whereClause += ` AND o.major_category ILIKE $${params.length}`;
    }
    
    if (query) {
      params.push(`%${query}%`);
      whereClause += ` AND o.title ILIKE $${params.length}`;
    }

    // Determine sort
    let orderClause = 'o.title ASC';
    if (sort === 'ai_opportunities') {
      orderClause = 'ai_count DESC, o.title ASC';
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM occupations o
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / pageSize);

    // Get occupations with counts
    const result = await pool.query(
      `SELECT 
         o.id,
         o.title,
         o.slug,
         o.major_category,
         o.minor_category,
         COALESCE(ao_count.count, 0) as ai_opportunities_count,
         COALESCE(mt_count.count, 0) as micro_tasks_count
       FROM occupations o
       LEFT JOIN (
         SELECT occupation_id, COUNT(*) as count
         FROM ai_opportunities
         GROUP BY occupation_id
       ) ao_count ON o.id = ao_count.occupation_id
       LEFT JOIN (
         SELECT occupation_id, COUNT(*) as count
         FROM job_micro_tasks
         GROUP BY occupation_id
       ) mt_count ON o.id = mt_count.occupation_id
       WHERE ${whereClause}
       ORDER BY ${orderClause}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    return NextResponse.json({
      occupations: result.rows,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Browse API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch occupations' },
      { status: 500 }
    );
  }
}
