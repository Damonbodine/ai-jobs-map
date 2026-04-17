// app/api/demo/generate/route.ts
// POST free-text task description → generated one-agent DemoRoleData.
// Used by /demo/try to render a custom demo live from user input.

import { NextResponse } from "next/server"
import { z } from "zod"
import { generateCustomDemo } from "@/lib/demo/generate-custom-demo"
import { getClientIp, hashIp, isRateLimited } from "@/lib/rate-limit"

export const runtime = "nodejs"
// OpenRouter calls can take 3–8 seconds. Default (10s) is tight.
export const maxDuration = 30

const requestSchema = z.object({
  taskDescription: z.string().trim().min(12, "Describe the task in a bit more detail").max(800),
  occupationContext: z.string().trim().max(120).optional(),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const ipHash = hashIp(ip)

  // 5 custom demos per IP per 24h. In-memory bucket (per instance) — see
  // lib/rate-limit.ts for the "speed bump, not fortress" rationale.
  if (
    isRateLimited("demo-generate", ipHash, {
      windowMs: 24 * 60 * 60 * 1000,
      max: 5,
    })
  ) {
    return NextResponse.json(
      { error: "Daily demo limit reached from this network. Try again tomorrow, or book a call to see more." },
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

  try {
    const role = await generateCustomDemo(parsed.data)
    return NextResponse.json({ role }, { status: 200 })
  } catch (err) {
    console.error("[demo/generate] generation failed", err)
    return NextResponse.json(
      { error: "We couldn't generate a demo for that description. Try rephrasing or adding more detail." },
      { status: 500 }
    )
  }
}
