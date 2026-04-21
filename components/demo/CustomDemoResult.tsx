"use client"

import Link from "next/link"
import { RotateCcw } from "lucide-react"
import type { DemoRoleData } from "@/lib/demo/types"
import { AgentSuiteDemo } from "./AgentSuiteDemo"
import { DemoFadeIn } from "./DemoFadeIn"
import { EmailCaptureCard } from "./EmailCaptureCard"

type Props = {
  role: DemoRoleData
  taskDescription: string
  occupationContext?: string
  onReset: () => void
}

export function CustomDemoResult({ role, taskDescription, occupationContext, onReset }: Props) {
  const contactHref = occupationContext
    ? `/contact?source=demo-try&role=${encodeURIComponent(occupationContext)}`
    : "/contact?source=demo-try"

  return (
    <DemoFadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            Built from your task: <span className="italic">&ldquo;{truncate(taskDescription, 100)}&rdquo;</span>
          </p>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Try another task
          </button>
        </div>

        <AgentSuiteDemo roles={[role]} occupationTitle={role.displayName} />

        <EmailCaptureCard
          taskDescription={taskDescription}
          occupationContext={occupationContext}
        />

        <p className="text-center text-xs text-muted-foreground">
          Prefer to talk directly?{" "}
          <Link
            href={contactHref}
            className="underline hover:text-foreground transition-colors"
          >
            Book a scoping call instead →
          </Link>
        </p>
      </div>
    </DemoFadeIn>
  )
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trim() + "…"
}
