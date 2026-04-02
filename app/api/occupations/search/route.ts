import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? ""

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("occupations")
      .select("id, title, slug, major_category")
      .or(`title.ilike.%${query}%,major_category.ilike.%${query}%`)
      .order("title")
      .limit(10)

    if (error) {
      return NextResponse.json({ results: [] }, { status: 200 })
    }

    return NextResponse.json({ results: data ?? [] })
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 })
  }
}
