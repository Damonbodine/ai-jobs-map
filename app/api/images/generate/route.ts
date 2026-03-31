import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-3.1-flash-image-preview';

// In-memory cache for the lifetime of the serverless function instance
const imageCache = new Map<string, string>();

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category');
  if (!category) {
    return NextResponse.json({ error: 'category param required' }, { status: 400 });
  }

  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-');

  // Check in-memory cache
  if (imageCache.has(slug)) {
    return new NextResponse(Buffer.from(imageCache.get(slug)!, 'base64'), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  }

  const prompt = `A warm, editorial-style photograph representing the occupation category "${category}".
Show a professional workspace scene with warm lighting, shallow depth of field, earth tones.
No text, no people's faces, no logos. Focus on tools, environment, and atmosphere of the work.
Style: editorial photography, warm color grading, slightly desaturated, high quality.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio: '16:9',
              imageSize: '1K',
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', err);
      return NextResponse.json({ error: 'Image generation failed', detail: err }, { status: 502 });
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json({ error: 'No image in response' }, { status: 502 });
    }

    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
    if (!imagePart) {
      return NextResponse.json({ error: 'No image part found' }, { status: 502 });
    }

    // Cache in memory
    imageCache.set(slug, imagePart.inlineData.data);

    return new NextResponse(Buffer.from(imagePart.inlineData.data, 'base64'), {
      headers: {
        'Content-Type': imagePart.inlineData.mimeType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (err) {
    console.error('Image generation error:', err);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
