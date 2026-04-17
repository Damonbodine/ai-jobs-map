import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { FadeIn } from "@/components/FadeIn"
import { PageTransition } from "@/components/PageTransition"
import { CustomDemoForm } from "@/components/demo/CustomDemoForm"

export const metadata: Metadata = {
  title: "Try a Custom AI Agent Demo | AI Jobs Map",
  description: "Describe a task you spend too much time on. We'll generate a custom AI agent demo for it in seconds.",
}

export default function CustomDemoTryPage() {
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/demo" className="hover:text-foreground transition-colors">
            Demo
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Try your own task</span>
        </nav>

        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 border border-border rounded-full px-3 py-1">
              Live Custom Demo
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-balance mb-4">
              Describe your task. See the agent.
            </h1>
            <p className="font-heading text-lg sm:text-xl text-muted-foreground leading-snug text-balance">
              Tell us what you spend too much time on. We&apos;ll generate a custom AI agent
              demo for it — the same shell, tailored to your words.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <CustomDemoForm />
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-16 max-w-2xl mx-auto text-center">
            <p className="text-xs text-muted-foreground">
              Looking for a specific role instead?{" "}
              <Link href="/demo" className="underline hover:text-foreground transition-colors">
                Browse pre-built demos for 800+ occupations →
              </Link>
            </p>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  )
}
