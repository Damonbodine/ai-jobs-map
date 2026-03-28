import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tier = searchParams.get('tier');
    const occupation = searchParams.get('occupation');

    let query = 'SELECT * FROM automation_packages';
    const params: string[] = [];
    
    if (tier) {
      query += ' WHERE tier = $1';
      params.push(tier);
    }
    
    query += ' ORDER BY base_price ASC';

    const result = await pool.query(query, params);

    return NextResponse.json({
      packages: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Packages API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
