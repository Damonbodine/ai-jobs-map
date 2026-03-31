import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db/pool';
import { getOccupationRecommendationSnapshot } from '@/lib/ai-jobs/recommendations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const occupationSlug = searchParams.get('occupation');
    const occupationId = searchParams.get('id');

    if (!occupationSlug && !occupationId) {
      return NextResponse.json(
        { error: 'Provide occupation slug or id' },
        { status: 400 }
      );
    }

    // Get occupation details
    let occQuery = 'SELECT * FROM occupations WHERE ';
    const occParams: string[] = [];
    
    if (occupationId) {
      occQuery += 'id = $1';
      occParams.push(occupationId);
    } else {
      occQuery += 'slug = $1';
      occParams.push(occupationSlug!);
    }

    const occResult = await pool.query(occQuery, occParams);
    const occupation = occResult.rows[0];

    if (!occupation) {
      return NextResponse.json(
        { error: 'Occupation not found' },
        { status: 404 }
      );
    }

    const snapshot = await getOccupationRecommendationSnapshot(pool, occupation.id);

    return NextResponse.json({
      occupation: {
        id: occupation.id,
        title: occupation.title,
        slug: occupation.slug,
        category: occupation.major_category,
      },
      ...snapshot,
    });
  } catch (error) {
    console.error('Recommend API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
