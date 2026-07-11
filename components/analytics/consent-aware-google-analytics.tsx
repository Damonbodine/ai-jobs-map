"use client"

import { GoogleAnalytics } from "@next/third-parties/google"
import { useEffect, useState } from "react"

type ConsentChoice = "granted" | "denied"
const COOKIE_NAME = "timeback_analytics_consent"

export function ConsentAwareGoogleAnalytics({ gaId }: { gaId: string }) {
  const [choice, setChoice] = useState<ConsentChoice | null>(null)
  const [hasChoice, setHasChoice] = useState(true)

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )timeback_analytics_consent=(granted|denied)/)
    // Consent is browser-only state and cannot be known during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice((match?.[1] as ConsentChoice | undefined) ?? null)
    setHasChoice(Boolean(match))
  }, [])

  function choose(nextChoice: ConsentChoice) {
    document.cookie = `${COOKIE_NAME}=${nextChoice}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`
    setChoice(nextChoice)
    setHasChoice(true)
    window.dispatchEvent(new Event("portfolio-analytics-consent"))
  }

  return (
    <>
      {choice === "granted" && <GoogleAnalytics gaId={gaId} />}
      {!hasChoice && (
        <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border bg-background p-5 shadow-2xl" aria-label="Analytics consent">
          <p className="text-sm text-muted-foreground">We use optional Google Analytics cookies to improve Timeback and understand which tools are useful.</p>
          <div className="mt-4 flex gap-3">
            <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => choose("denied")}>Reject</button>
            <button type="button" className="rounded-md bg-foreground px-4 py-2 text-sm text-background" onClick={() => choose("granted")}>Accept</button>
          </div>
        </aside>
      )}
    </>
  )
}
