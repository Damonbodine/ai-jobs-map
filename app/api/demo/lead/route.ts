// app/api/demo/lead/route.ts
// POST captures an email + the task description that generated the custom demo.
// v1 just writes to Supabase; sending the follow-up PDF is a later step.

import { NextResponse } from "next/server"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"

export const runtime = "nodejs"

const requestSchema = z.object({
  email: z.string().trim().email().max(200),
  taskDescription: z.string().trim().min(1).max(800),
  occupationContext: z.string().trim().max(120).optional(),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const ipHash = hashIp(ip)

  // 3 lead submissions per IP per hour is plenty for genuine users and
  // well below what a bot would try.
  if (
    isRateLimited("demo-lead", ipHash, {
      windowMs: 60 * 60 * 1000,
      max: 3,
    })
  ) {
    return NextResponse.json(
      { error: "Too many submissions. Try again shortly." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { email, taskDescription, occupationContext } = parsed.data

  const supabase = createServerClient()
  const { error: dbError } = await supabase.from("demo_leads").insert({
    email,
    task_description: taskDescription,
    occupation_context: occupationContext ?? null,
    ip_hash: ipHash,
  })

  if (dbError) {
    console.error("[demo/lead] supabase insert failed", dbError)
    return NextResponse.json(
      { error: "We couldn't save that. Please try again shortly." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
