import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    let query = 'SELECT * FROM automation_workflows';
    const params: string[] = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY base_price ASC';

    const result = await pool.query(query, params);

    return NextResponse.json({
      workflows: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Workflows API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}
