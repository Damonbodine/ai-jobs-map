import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

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
      // Fuzzy search using trigram similarity and ILIKE
      const searchTerms = query.toLowerCase().split(/\s+/);
      const searchPattern = searchTerms.map(term => `%${term}%`).join('');

      // Search with ranking based on match position
      const searchResults = await sql`
        SELECT 
          id, 
          title, 
          slug, 
          major_category,
          -- Priority match: title starts with query
          CASE 
            WHEN LOWER(title) LIKE ${query.toLowerCase() + '%'} THEN 1
            WHEN LOWER(title) LIKE ${'%' + query.toLowerCase() + '%'} THEN 2
            ELSE 3
          END as match_priority,
          -- Length penalty (shorter titles often more relevant)
          LENGTH(title) as title_length
        FROM occupations
        WHERE LOWER(title) ILIKE ${'%' + query.toLowerCase() + '%'}
           OR LOWER(title) % ${query.toLowerCase()}
        ORDER BY 
          match_priority ASC,
          title_length ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      results = searchResults;

      // Get total count
      const countResult = await sql`
        SELECT COUNT(*) as count
        FROM occupations
        WHERE LOWER(title) ILIKE ${'%' + query.toLowerCase() + '%'}
           OR LOWER(title) % ${query.toLowerCase()}
      `;
      total = Number(countResult[0].count);

    } else if (category) {
      // Category filter
      const categoryResults = await sql`
        SELECT id, title, slug, major_category
        FROM occupations
        WHERE major_category = ${category}
        ORDER BY title ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      results = categoryResults;

      const countResult = await sql`
        SELECT COUNT(*) as count
        FROM occupations
        WHERE major_category = ${category}
      `;
      total = Number(countResult[0].count);
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
