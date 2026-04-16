// app/api/demo/search/route.ts
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const supabase = createServerClient()
  const { data } = await supabase
    .from("occupations")
    .select("slug, title")
    .ilike("title", `%${q}%`)
    .order("employment", { ascending: false, nullsFirst: false })
    .limit(8)

  return NextResponse.json(data ?? [])
}
