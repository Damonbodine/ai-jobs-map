import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/pool';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        id,
        skill_code,
        skill_name,
        category,
        description,
        ai_dependence_score,
        difficulty_level,
        (SELECT COUNT(*) FROM task_skill_mapping WHERE micro_skill_id = micro_skills.id) as task_count
      FROM micro_skills
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (skill_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY task_count DESC, skill_name ASC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM micro_skills WHERE 1=1`;
    const countParams: any[] = [];
    let countIndex = 1;

    if (category && category !== 'all') {
      countQuery += ` AND category = $${countIndex}`;
      countParams.push(category);
      countIndex++;
    }

    if (search) {
      countQuery += ` AND (skill_name ILIKE $${countIndex} OR description ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    // Get categories with counts
    const categoryQuery = `
      SELECT category, COUNT(*) as count 
      FROM micro_skills 
      GROUP BY category 
      ORDER BY category
    `;
    const categoryResult = await pool.query(categoryQuery);

    return NextResponse.json({
      skills: result.rows,
      categories: categoryResult.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}
