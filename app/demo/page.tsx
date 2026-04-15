import type { Metadata } from "next"
import { computeDemoRoles } from "@/lib/demo/compute-demo"
import { AgentSuiteDemo } from "@/components/demo/AgentSuiteDemo"

export const metadata: Metadata = {
  title: "Interactive Demo · AI Timeback",
  description:
    "See the full AI agent suite in action for a complete workday. Watch how Scout, Quill, Cal, Iris, and Reed transform how professionals work.",
}

export default async function DemoPage() {
  const roles = await computeDemoRoles()

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
          A full workday. Transformed.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Pick a role. Watch the AI suite run the day. Each agent has a name,
          a job, and a moment where it hands control back to you.
        </p>
      </div>

      <AgentSuiteDemo roles={roles} />
    </div>
  )
}
