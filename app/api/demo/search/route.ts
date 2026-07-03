// app/api/demo/search/route.ts
import { db } from "@/lib/db/client"
import { occupations } from "@/lib/db/schema"
import { ilike, desc } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  try {
    const data = await db
      .select({
        slug: occupations.slug,
        title: occupations.title,
      })
      .from(occupations)
      .where(ilike(occupations.title, `%${q}%`))
      .orderBy(desc(occupations.employment))
      .limit(8)

    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}

