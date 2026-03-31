import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/pool';
import { searchWorkflows } from '@/lib/smart-workflows/queries';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const occupationSlug = searchParams.get('occupation');
  const category = searchParams.get('category');
  const solution = searchParams.get('solution');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '6', 10);

  // If querying by occupation slug, resolve to id + majorCategory first
  if (occupationSlug) {
    const { rows } = await pool.query(
      'SELECT id, major_category FROM occupations WHERE slug = $1',
      [occupationSlug]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Occupation not found' }, { status: 404 });
    }
    const { getWorkflowsForOccupation } = await import('@/lib/smart-workflows/queries');
    const workflows = await getWorkflowsForOccupation(rows[0].id, rows[0].major_category, limit);
    return NextResponse.json({ workflows, total: workflows.length });
  }

  // General search/filter
  const workflows = await searchWorkflows({ search: search || undefined, category: category || undefined, solution: solution || undefined, limit });
  return NextResponse.json({ workflows, total: workflows.length });
}
