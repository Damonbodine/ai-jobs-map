// app/demo/[slug]/error.tsx
"use client"
import { useEffect } from "react"

export default function DemoSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Demo slug error:", error)
  }, [error])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <p className="eyebrow mb-2" style={{ color: "var(--color-destructive)" }}>
          Demo Unavailable
        </p>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          We couldn&apos;t load this demo
        </h1>
        <p className="text-muted-foreground mb-6">
          This occupation&apos;s demo is still being generated. Try again in a moment.
        </p>
        <button
          onClick={reset}
          className="bg-cyan px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-cyan/80"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
