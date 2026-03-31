import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/pool';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim();
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    if (!query && !category) {
      return NextResponse.json(
        { error: 'Either q or category parameter is required' },
        { status: 400 }
      );
    }

    let results: Occupation[];
    let total: number;

    if (query) {
      const searchResults = await pool.query(
        `SELECT 
          id, 
          title, 
          slug, 
          major_category
        FROM occupations
        WHERE LOWER(title) ILIKE $1
        ORDER BY 
          CASE 
            WHEN LOWER(title) LIKE $2 THEN 1
            WHEN LOWER(title) LIKE $3 THEN 2
            ELSE 3
          END,
          LENGTH(title) ASC
        LIMIT $4
        OFFSET $5`,
        [
          `%${query.toLowerCase()}%`,
          `${query.toLowerCase()}%`,
          `%${query.toLowerCase()}%`,
          limit,
          offset
        ]
      );

      results = searchResults.rows;

      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM occupations WHERE LOWER(title) ILIKE $1`,
        [`%${query.toLowerCase()}%`]
      );
      total = parseInt(countResult.rows[0].count);

    } else if (category) {
      const categoryResults = await pool.query(
        `SELECT id, title, slug, major_category
        FROM occupations
        WHERE major_category = $1
        ORDER BY title ASC
        LIMIT $2
        OFFSET $3`,
        [category, limit, offset]
      );

      results = categoryResults.rows;

      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM occupations WHERE major_category = $1`,
        [category]
      );
      total = parseInt(countResult.rows[0].count);
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    return NextResponse.json({
      results,
      total,
      limit,
      offset,
      query: query || null,
      category: category || null,
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
