import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const supabase = createServerClient()

    // Split query into words and match each against the title.
    // "Financial Analyst" becomes: title ilike '%financial%' AND title ilike '%analyst%'
    const words = query.split(/\s+/).filter((w) => w.length >= 2)
    if (words.length === 0) {
      return NextResponse.json({ results: [] })
    }

    let builder = supabase
      .from("occupations")
      .select("id, title, slug, major_category")

    for (const word of words) {
      builder = builder.ilike("title", `%${word}%`)
    }

    const { data, error } = await builder.order("title").limit(10)

    if (error) {
      return NextResponse.json({ results: [] }, { status: 200 })
    }

    return NextResponse.json({ results: data ?? [] })
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 })
  }
}
