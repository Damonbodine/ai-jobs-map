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
    <main className="min-h-screen bg-[#fafaf7] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <p className="text-sm font-semibold text-red-500 uppercase tracking-widest mb-2">
          Demo Unavailable
        </p>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-3">
          We couldn&apos;t load this demo
        </h1>
        <p className="text-[#666] mb-6">
          This occupation&apos;s demo is still being generated. Try again in a moment.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
