import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/client"
import { occupations } from "@/lib/db/schema"
import { ilike, and } from "drizzle-orm"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Split query into words and match each against the title.
    // "Financial Analyst" becomes: title ilike '%financial%' AND title ilike '%analyst%'
    const words = query.split(/\s+/).filter((w) => w.length >= 2)
    if (words.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const conditions = words.map((word) => ilike(occupations.title, `%${word}%`))

    const data = await db
      .select({
        id: occupations.id,
        title: occupations.title,
        slug: occupations.slug,
        major_category: occupations.majorCategory,
      })
      .from(occupations)
      .where(and(...conditions))
      .orderBy(occupations.title)
      .limit(10)

    return NextResponse.json({ results: data ?? [] })
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 })
  }
}

