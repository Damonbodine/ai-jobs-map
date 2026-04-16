"use client"

import { useEffect, useRef, useState } from "react"

const FULL_TEXT = "Custom AI agents, built to power your exact workflow. Reclaim your precious timeback."
const CHARS_PER_SECOND = 38

export function DemoHeroText() {
  const [displayed, setDisplayed] = useState(0)
  const [started, setStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start when visible
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Type when started
  useEffect(() => {
    if (!started) return
    const ms = 1000 / CHARS_PER_SECOND
    intervalRef.current = setInterval(() => {
      setDisplayed((prev) => {
        if (prev >= FULL_TEXT.length) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return prev
        }
        return prev + 1
      })
    }, ms)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [started])

  const isDone = displayed >= FULL_TEXT.length

  return (
    <div ref={containerRef} className="mb-8 min-h-[2.5rem]">
      <p className="font-heading text-xl sm:text-2xl font-bold text-foreground leading-snug tracking-tight">
        {FULL_TEXT.slice(0, displayed)}
        {!isDone && (
          <span className="inline-block w-0.5 h-5 bg-foreground ml-0.5 align-middle animate-pulse" />
        )}
      </p>
    </div>
  )
}
