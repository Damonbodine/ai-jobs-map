import { NextRequest, NextResponse } from 'next/server';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// In-memory cache for the lifetime of the function instance
const cache = new Map<string, string>();

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'q param required' }, { status: 400 });
  }

  if (!PEXELS_API_KEY) {
    return NextResponse.json({ error: 'PEXELS_API_KEY not configured' }, { status: 500 });
  }

  const cacheKey = query.toLowerCase().trim();
  if (cache.has(cacheKey)) {
    return NextResponse.json({ url: cache.get(cacheKey), cached: true }, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    });
  }

  try {
    const searchQuery = `${query} professional workplace`;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Pexels API error' }, { status: 502 });
    }

    const data = await res.json();
    const photo = data.photos?.[0];

    if (!photo) {
      return NextResponse.json({ error: 'No photo found', url: null });
    }

    // Use the "medium" size — good balance of quality and speed
    const url = photo.src.medium;
    cache.set(cacheKey, url);

    return NextResponse.json({ url, photographer: photo.photographer, cached: false }, {
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    });
  } catch (err) {
    console.error('Pexels error:', err);
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
  }
}
