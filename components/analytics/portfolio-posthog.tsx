"use client"

import { usePathname } from "next/navigation"
import posthog from "posthog-js"
import { useEffect, useState } from "react"

export function PortfolioPostHog() {
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    function sync() {
      const granted = /(?:^|; )timeback_analytics_consent=granted/.test(document.cookie)
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
      if (granted && key && process.env.NODE_ENV === "production") {
        if (!posthog.__loaded) posthog.init(key, { api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com", autocapture: false, capture_pageview: false, capture_pageleave: true, disable_session_recording: true, person_profiles: "identified_only", loaded: client => client.register({ property: "timeback" }) })
        posthog.opt_in_capturing()
        setEnabled(true)
      } else {
        if (posthog.__loaded) posthog.opt_out_capturing()
        setEnabled(false)
      }
    }
    sync()
    window.addEventListener("portfolio-analytics-consent", sync)
    return () => window.removeEventListener("portfolio-analytics-consent", sync)
  }, [])
  useEffect(() => {
    if (enabled && pathname) posthog.capture("$pageview", { property: "timeback", $current_url: window.location.href })
  }, [enabled, pathname])
  return null
}
