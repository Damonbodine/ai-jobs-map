"use client"

import { Archivo, Archivo_Black, DM_Mono, Fraunces, Space_Grotesk } from "next/font/google"
import Link from "next/link"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { OCCUPATIONS } from "./data"
import "./type-city.css"

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--tc-archivo",
  display: "swap",
})
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--tc-archivo-black",
  display: "swap",
})
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "600", "700", "900"],
  variable: "--tc-fraunces",
  display: "swap",
})
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--tc-mono",
  display: "swap",
})
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--tc-grotesk",
  display: "swap",
})

// Font-variable class string applied to the root of the page.
const FONT_VARS = [
  archivo.variable,
  archivoBlack.variable,
  fraunces.variable,
  dmMono.variable,
  spaceGrotesk.variable,
].join(" ")

// Font-family shorthand strings — referenced from inline styles below.
// Using font family names directly (not CSS vars inside style strings) because
// the prototype's styles are value-dense; readability wins.
const F = {
  black: `"Archivo Black", var(--tc-archivo-black), sans-serif`,
  archivo: `"Archivo", var(--tc-archivo), sans-serif`,
  fraunces: `"Fraunces", var(--tc-fraunces), serif`,
  mono: `"DM Mono", var(--tc-mono), ui-monospace, monospace`,
  grotesk: `"Space Grotesk", var(--tc-grotesk), system-ui, sans-serif`,
} as const

// ----------------------------------------------------------------------------
// Hooks

function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen] as const
}

function useCountUp(target: number, duration = 1400, start = 0) {
  const [val, setVal] = useState(start)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(start + (target - start) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start])
  return val
}

// ----------------------------------------------------------------------------
// Background primitives

function AuroraBG() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 30% 20%, rgba(0,229,255,0.45) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(181,108,255,0.4) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(0,255,136,0.3) 0%, transparent 60%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          animation: "aurora-breathe 12s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(0,229,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 80% 100% at 50% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 100% at 50% 50%, black, transparent)",
          pointerEvents: "none",
          animation: "grid-drift 40s linear infinite",
        }}
      />
    </>
  )
}

type CoinSpec = {
  id: number
  left: number
  delay: string
  duration: number
  size: number
  color: string
  minutes: number
  drift: number
}

function RisingMinutes({ count = 22, zIndex = 1 }: { count?: number; zIndex?: number }) {
  // Client-only generation: Math.random() differs between SSR and hydration,
  // so we seed the array after mount to avoid a hydration mismatch.
  const [coins, setCoins] = useState<CoinSpec[]>([])
  useEffect(() => {
    const colors = ["#00E5FF", "#B56CFF", "#FF3EA5", "#FFD400", "#00FF88"]
    const mins = [5, 8, 12, 15, 20, 25, 30, 45, 60]
    setCoins(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: (Math.random() * 18).toFixed(2),
        duration: 14 + Math.random() * 10,
        size: 22 + Math.random() * 18,
        color: colors[i % colors.length],
        minutes: mins[i % mins.length],
        drift: (Math.random() - 0.5) * 60,
      })),
    )
  }, [count])

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex,
      }}
    >
      {coins.map((c) => (
        <div
          key={c.id}
          style={
            {
              position: "absolute",
              left: `${c.left}%`,
              bottom: -80,
              animation: `rise-coin ${c.duration}s linear infinite`,
              animationDelay: `${c.delay}s`,
              "--drift": `${c.drift}px`,
            } as CSSProperties
          }
        >
          <div
            style={{
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              background: `radial-gradient(circle at 30% 30%, ${c.color}ff, ${c.color}44)`,
              border: `1px solid ${c.color}`,
              boxShadow: `0 0 20px ${c.color}88, inset 0 0 10px ${c.color}66`,
              display: "grid",
              placeItems: "center",
              fontFamily: F.mono,
              fontSize: Math.floor(c.size * 0.32),
              fontWeight: 700,
              color: "#05060E",
              whiteSpace: "nowrap",
            }}
          >
            +{c.minutes}m
          </div>
        </div>
      ))}
    </div>
  )
}

// ----------------------------------------------------------------------------
// Morphing verb — RECLAIM / REDEFINE / REIMAGINE / REWIRE / REWRITE
function MorphingVerb() {
  const verbs = ["RECLAIM", "REDEFINE", "REIMAGINE", "REWIRE", "REWRITE"]
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % verbs.length), 2000)
    return () => clearInterval(t)
  }, [verbs.length])
  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        minWidth: "10ch",
        textAlign: "left",
      }}
    >
      {verbs.map((v, idx) => (
        <span
          key={v}
          style={{
            position: idx === 0 ? "relative" : "absolute",
            left: 0,
            top: 0,
            opacity: idx === i ? 1 : 0,
            transform: idx === i ? "translateY(0) scale(1)" : "translateY(0.22em) scale(0.96)",
            transition: "all .6s cubic-bezier(.2,1.2,.3,1)",
            background: "linear-gradient(90deg, #00E5FF 0%, #B56CFF 50%, #FF3EA5 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 30px rgba(0,229,255,0.5))",
            whiteSpace: "nowrap",
          }}
        >
          {v}
        </span>
      ))}
    </span>
  )
}

// ----------------------------------------------------------------------------
// Kinetic "workday." — satellites scatter, then condense into the word.
function WorkdayKinetic() {
  const [assembled, setAssembled] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAssembled(true), 400)
    return () => clearTimeout(t)
  }, [])

  const [satellites, setSatellites] = useState<
    {
      id: number
      startX: number
      startY: number
      endX: number
      endY: number
      color: string
      size: number
      delay: string
    }[]
  >([])
  useEffect(() => {
    setSatellites(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        startX: (Math.random() - 0.5) * 700,
        startY: (Math.random() - 0.5) * 500,
        endX: (Math.random() - 0.5) * 80,
        endY: (Math.random() - 0.5) * 40,
        color: ["#00E5FF", "#B56CFF", "#FF3EA5", "#00FF88", "#FFD400"][i % 5],
        size: 8 + Math.random() * 10,
        delay: (i * 0.03).toFixed(2),
      })),
    )
  }, [])

  return (
    <div style={{ position: "relative", display: "inline-block", lineHeight: 0.85 }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
        {satellites.map((s) => (
          <div
            key={s.id}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: s.color,
              boxShadow: `0 0 20px ${s.color}`,
              transform: assembled
                ? `translate(calc(-50% + ${s.endX}px), calc(-50% + ${s.endY}px)) scale(0.4)`
                : `translate(calc(-50% + ${s.startX}px), calc(-50% + ${s.startY}px)) scale(1)`,
              opacity: assembled ? 0 : 1,
              transition: `transform 1.3s cubic-bezier(.22,1,.36,1) ${s.delay}s, opacity 1s ease ${s.delay}s`,
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          fontFamily: F.fraunces,
          fontStyle: "italic",
          fontWeight: 400,
          letterSpacing: "-0.04em",
          fontSize: "0.95em",
          color: "#00FF88",
          filter: "drop-shadow(0 0 60px rgba(0,255,136,0.55))",
          opacity: assembled ? 1 : 0,
          transform: assembled ? "scale(1)" : "scale(0.9)",
          transition: "opacity 0.5s ease 0.9s, transform 1s cubic-bezier(.2,1.2,.3,1) 0.9s",
        }}
      >
        workday.
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Neon ticker — two rails of glowing occupation chips scroll across the hero.
function NeonTicker({
  occs,
  direction = 1,
  bottom,
}: {
  occs: typeof OCCUPATIONS
  direction?: 1 | -1
  bottom: number
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: 0,
        right: 0,
        height: 68,
        overflow: "hidden",
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 18,
          animation: `type-city-${direction > 0 ? "rtl" : "ltr"} 60s linear infinite`,
          whiteSpace: "nowrap",
        }}
      >
        {[...occs, ...occs].map((o, i) => (
          <span
            key={`${o.slug}-${i}`}
            style={{
              padding: "14px 22px",
              borderRadius: 14,
              border: `1px solid ${o.color}`,
              background: "rgba(255,255,255,0.03)",
              color: o.color,
              fontFamily: F.archivo,
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              textShadow: `0 0 12px ${o.color}88`,
              boxShadow: `inset 0 0 20px ${o.color}22`,
              backdropFilter: "blur(6px)",
            }}
          >
            {o.title.toUpperCase()}
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
                textShadow: "none",
              }}
            >
              +{o.minutes}min
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------
// Section 1 — Hero
function Hero() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        paddingBottom: 240,
        overflow: "hidden",
      }}
    >
      <AuroraBG />
      <RisingMinutes count={22} zIndex={1} />

      <nav
        style={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "40px 48px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: F.black,
            fontSize: 18,
            letterSpacing: "-0.02em",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "linear-gradient(135deg, #00E5FF, #B56CFF)",
              boxShadow: "0 0 20px rgba(0,229,255,0.6)",
              animation: "logo-pulse 3s ease-in-out infinite",
            }}
          />
          AI JOBS MAP
        </div>
        <div
          style={{
            display: "flex",
            gap: 28,
            fontFamily: F.grotesk,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {["Explore", "Industries", "Build a Team", "Pricing"].map((l) => (
            <span key={l} style={{ color: "rgba(255,255,255,0.75)", cursor: "pointer" }}>
              {l}
            </span>
          ))}
        </div>
        <Link
          href="/contact"
          style={{
            background: "transparent",
            color: "#00E5FF",
            border: "1.5px solid #00E5FF",
            padding: "10px 20px",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            fontFamily: F.grotesk,
            boxShadow: "0 0 20px rgba(0,229,255,0.3)",
          }}
        >
          Book a Call
        </Link>
      </nav>

      <div
        style={{
          position: "relative",
          zIndex: 3,
          maxWidth: 1600,
          margin: "0 auto",
          padding: "100px 48px 120px",
        }}
      >
        <h1
          style={{
            fontFamily: F.black,
            fontSize: "clamp(70px, 14vw, 240px)",
            lineHeight: 0.86,
            letterSpacing: "-0.055em",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          <div>
            <MorphingVerb />
          </div>
          <div style={{ color: "#fff" }}>YOUR</div>
          <div>
            <WorkdayKinetic />
          </div>
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 48,
            marginTop: 48,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              maxWidth: 480,
              fontSize: 20,
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.8)",
              margin: 0,
              fontFamily: F.grotesk,
            }}
          >
            Not another chart about &ldquo;the future of work.&rdquo;
            <br />A{" "}
            <span style={{ color: "#00E5FF", fontWeight: 700 }}>task-by-task</span> map of yours —
            with the minutes you get back.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/browse"
              style={{
                padding: "18px 32px",
                background: "linear-gradient(135deg, #00E5FF, #B56CFF)",
                color: "#05060E",
                border: "none",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 15,
                textDecoration: "none",
                fontFamily: F.grotesk,
                boxShadow: "0 10px 40px rgba(0,229,255,0.4)",
                animation: "btn-breathe 3s ease-in-out infinite",
              }}
            >
              EXPLORE MY ROLE ↗
            </Link>
            <Link
              href="/build-a-team"
              style={{
                padding: "18px 32px",
                background: "transparent",
                color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.25)",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                fontFamily: F.grotesk,
              }}
            >
              BUILD A TEAM
            </Link>
          </div>
        </div>
      </div>

      <NeonTicker occs={OCCUPATIONS.slice(0, 6)} direction={1} bottom={120} />
      <NeonTicker occs={OCCUPATIONS.slice(6, 12)} direction={-1} bottom={40} />
    </section>
  )
}

// ----------------------------------------------------------------------------
// Section 2 — Anatomy of your day (phased slice dissolve → catcher pill)
function Anatomy() {
  const [ref, seen] = useInView<HTMLElement>(0.25)
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    if (!seen) return
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [seen])

  const slices = [
    { label: "Meetings",       original: 150, saved: 18, color: "#00E5FF" },
    { label: "Docs & Writing", original: 108, saved: 16, color: "#B56CFF" },
    { label: "Email & Chat",   original: 84,  saved: 12, color: "#FF3EA5" },
    { label: "Coordination",   original: 66,  saved: 7,  color: "#FFD400" },
    { label: "Deep Work",      original: 72,  saved: 5,  color: "#00FF88" },
  ]
  const totalSaved = slices.reduce((a, s) => a + s.saved, 0)
  const counter = useCountUp(phase >= 2 ? totalSaved : 0, 900)

  return (
    <section
      ref={ref}
      style={{
        padding: "180px 48px",
        background: "#05060E",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(181,108,255,0.15), transparent 70%)",
        }}
      />
      <RisingMinutes count={14} zIndex={0} />
      <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 12,
            letterSpacing: "0.12em",
            color: "#00E5FF",
            marginBottom: 24,
          }}
        >
          ◆◆ 02 · THE ANATOMY OF YOUR DAY
        </div>

        <h2
          style={{
            fontFamily: F.black,
            fontSize: "clamp(56px, 10vw, 170px)",
            lineHeight: 0.88,
            letterSpacing: "-0.04em",
            margin: "0 0 80px",
            maxWidth: "11ch",
            textTransform: "uppercase",
          }}
        >
          8 HOURS.
          <br />
          <span
            style={{
              fontFamily: F.fraunces,
              fontStyle: "italic",
              fontWeight: 400,
              textTransform: "lowercase",
              background: "linear-gradient(90deg, #00E5FF, #FF3EA5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            where do they go?
          </span>
        </h2>

        <div style={{ position: "relative", marginBottom: 60 }}>
          <div
            style={{
              display: "flex",
              height: 160,
              borderRadius: 20,
              overflow: "visible",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            {slices.map((s, i) => {
              const shownHours = (s.original - (phase >= 1 ? s.saved : 0)) / 60
              return (
                <div
                  key={s.label}
                  style={{
                    flex: shownHours,
                    transition: "flex 1.2s cubic-bezier(.4,1.2,.3,1)",
                    background: `linear-gradient(180deg, ${s.color}33, ${s.color}66)`,
                    borderLeft: i ? `1px solid ${s.color}44` : "none",
                    position: "relative",
                    padding: 20,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontSize: 11,
                      color: s.color,
                      textShadow: `0 0 10px ${s.color}`,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {s.label.toUpperCase()}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 20,
                      left: 20,
                      fontFamily: F.black,
                      fontSize: 40,
                      color: s.color,
                      letterSpacing: "-0.04em",
                      textShadow: `0 0 20px ${s.color}66`,
                    }}
                  >
                    {Math.round(s.original - (phase >= 1 ? s.saved : 0))}m
                  </div>

                  {phase >= 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: -30,
                        left: "50%",
                        transform:
                          phase >= 2
                            ? "translate(-50%, -400%) scale(0.6)"
                            : "translate(-50%, 0) scale(1)",
                        opacity: phase >= 2 ? 0 : 1,
                        transition:
                          "transform 1.1s cubic-bezier(.3,1.2,.3,1) 0.2s, opacity 0.8s ease 1.1s",
                        padding: "6px 12px",
                        background: s.color,
                        color: "#05060E",
                        borderRadius: 999,
                        fontFamily: F.mono,
                        fontSize: 12,
                        fontWeight: 700,
                        boxShadow: `0 0 30px ${s.color}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      +{s.saved}m
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div
            style={{
              position: "absolute",
              top: -110,
              right: 40,
              padding: "16px 28px",
              background:
                phase >= 2 ? "linear-gradient(135deg, #00FF88, #00E5FF)" : "rgba(0,255,136,0.1)",
              color: phase >= 2 ? "#05060E" : "#00FF88",
              border: phase >= 2 ? "none" : "1px solid rgba(0,255,136,0.4)",
              borderRadius: 999,
              fontFamily: F.black,
              fontSize: 22,
              letterSpacing: "-0.02em",
              boxShadow: phase >= 2 ? "0 10px 40px rgba(0,255,136,0.4)" : "none",
              transition: "all 0.6s ease",
              transform: phase >= 2 ? "scale(1.05)" : "scale(1)",
            }}
          >
            ← RECLAIMED: +{Math.round(counter)}min/day
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
            alignItems: "center",
          }}
        >
          <div style={{ gridColumn: "1 / span 2" }}>
            <p
              style={{
                fontFamily: F.fraunces,
                fontSize: 32,
                lineHeight: 1.3,
                fontWeight: 400,
                margin: 0,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Across{" "}
              <span style={{ fontStyle: "italic", color: "#00E5FF" }}>
                meetings, emails, docs &amp; coordination
              </span>{" "}
              — we found{" "}
              <b
                style={{
                  color: "#00FF88",
                  fontFamily: F.black,
                  fontStyle: "normal",
                }}
              >
                58 minutes
              </b>{" "}
              of friction AI can dissolve. That&rsquo;s a workout, a long lunch, or an hour of real
              thinking.
            </p>
          </div>
          <div
            style={{
              fontFamily: F.black,
              fontSize: 200,
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              textAlign: "right",
              background: "linear-gradient(135deg, #00E5FF, #B56CFF, #FF3EA5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 40px rgba(255,62,165,0.3))",
            }}
          >
            58′
          </div>
        </div>
      </div>
    </section>
  )
}

// ----------------------------------------------------------------------------
// Section 3 — Your Day, Re-sequenced (before/after 10-hour timeline)
type DayBlock = { label: string; start: number; len: number; color: string }

function DayStrip() {
  const [ref, seen] = useInView<HTMLElement>(0.3)

  const beforeBlocks: DayBlock[] = [
    { label: "Meetings",  start: 0,   len: 90, color: "#00E5FF" },
    { label: "Email",     start: 90,  len: 45, color: "#FF3EA5" },
    { label: "Docs",      start: 135, len: 60, color: "#B56CFF" },
    { label: "Meetings",  start: 195, len: 60, color: "#00E5FF" },
    { label: "Admin",     start: 255, len: 50, color: "#FFD400" },
    { label: "Email",     start: 305, len: 35, color: "#FF3EA5" },
    { label: "Docs",      start: 340, len: 50, color: "#B56CFF" },
    { label: "Meetings",  start: 390, len: 80, color: "#00E5FF" },
    { label: "Admin",     start: 470, len: 40, color: "#FFD400" },
    { label: "Email",     start: 510, len: 60, color: "#FF3EA5" },
    { label: "Deep Work", start: 570, len: 30, color: "#00FF88" },
  ]
  const afterBlocks: DayBlock[] = [
    { label: "Meetings",  start: 0,   len: 70, color: "#00E5FF" },
    { label: "Deep Work", start: 70,  len: 80, color: "#00FF88" },
    { label: "Docs",      start: 150, len: 45, color: "#B56CFF" },
    { label: "Meetings",  start: 195, len: 50, color: "#00E5FF" },
    { label: "Deep Work", start: 245, len: 70, color: "#00FF88" },
    { label: "Docs",      start: 315, len: 40, color: "#B56CFF" },
    { label: "Meetings",  start: 355, len: 60, color: "#00E5FF" },
    { label: "YOU",       start: 415, len: 58, color: "#FFD400" },
    { label: "Deep Work", start: 473, len: 57, color: "#00FF88" },
    { label: "Email",     start: 530, len: 30, color: "#FF3EA5" },
    { label: "Wrap",      start: 560, len: 40, color: "#B56CFF" },
  ]
  const hours = ["8", "9", "10", "11", "12p", "1", "2", "3", "4", "5", "6"]

  const renderStrip = (blocks: DayBlock[], phase: number, label: string, tint: string) => (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <span
          style={{
            fontFamily: F.black,
            fontSize: 22,
            letterSpacing: "-0.02em",
            color: tint,
            textShadow: `0 0 15px ${tint}66`,
          }}
        >
          {label}
        </span>
        <span
          style={{
            flex: 1,
            height: 1,
            background: `linear-gradient(90deg, ${tint}66, transparent)`,
          }}
        />
      </div>
      <div
        style={{
          position: "relative",
          height: 72,
          borderRadius: 14,
          overflow: "hidden",
          border: `1px solid ${tint}33`,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        {blocks.map((b, i) => (
          <div
            key={`${phase}-${i}`}
            style={{
              position: "absolute",
              left: `${(b.start / 600) * 100}%`,
              width: `${(b.len / 600) * 100}%`,
              top: 0,
              bottom: 0,
              background: `linear-gradient(180deg, ${b.color}44, ${b.color}88)`,
              borderLeft: i ? `1px solid ${b.color}` : "none",
              opacity: seen ? 1 : 0,
              transform: seen ? "translateY(0)" : "translateY(20px)",
              transition: `all 0.6s cubic-bezier(.3,1,.3,1) ${phase * 0.02 + i * 0.04}s`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              padding: "0 4px",
            }}
          >
            {b.len > 50 && (
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff",
                  textShadow: "0 0 6px rgba(0,0,0,0.5)",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}
              >
                {b.label.toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 6,
          fontFamily: F.mono,
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
        }}
      >
        {hours.map((h, i) => (
          <span key={h} style={{ flex: 1, textAlign: i === 0 ? "left" : "center" }}>
            {h}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <section
      ref={ref}
      style={{
        padding: "160px 48px",
        background: "#05060E",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(0,255,136,0.12), transparent 60%)",
        }}
      />
      <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 12,
            letterSpacing: "0.12em",
            color: "#00FF88",
            marginBottom: 24,
          }}
        >
          ◆◆ 03 · YOUR DAY, RE-SEQUENCED
        </div>
        <h2
          style={{
            fontFamily: F.black,
            fontSize: "clamp(48px, 7.5vw, 130px)",
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            margin: "0 0 60px",
            textTransform: "uppercase",
            maxWidth: "13ch",
          }}
        >
          Same 8 hours.
          <br />
          <span
            style={{
              fontFamily: F.fraunces,
              fontStyle: "italic",
              fontWeight: 400,
              textTransform: "lowercase",
              color: "#00FF88",
              textShadow: "0 0 50px rgba(0,255,136,0.4)",
            }}
          >
            a better one.
          </span>
        </h2>

        {renderStrip(beforeBlocks, 0, "BEFORE", "#FF3EA5")}
        {renderStrip(afterBlocks, 1, "AFTER", "#00FF88")}

        <p
          style={{
            marginTop: 40,
            fontFamily: F.fraunces,
            fontSize: 26,
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.85)",
            maxWidth: 900,
          }}
        >
          Email, admin, and back-to-back status meetings shrink.{" "}
          <span style={{ color: "#FFD400", fontStyle: "italic" }}>Deep work</span>, focus, and{" "}
          <span style={{ color: "#00FF88", fontStyle: "italic" }}>time for yourself</span> expand
          into the gap.
        </p>
      </div>
    </section>
  )
}

// ----------------------------------------------------------------------------
// Section 4 — Occupation grid with freed-time spark on hover
function Grid() {
  const [ref, seen] = useInView<HTMLElement>(0.1)
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <section
      ref={ref}
      style={{
        padding: "160px 48px",
        background: "#05060E",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <RisingMinutes count={10} zIndex={0} />
      <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            marginBottom: 60,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 12,
                letterSpacing: "0.12em",
                color: "#B56CFF",
                marginBottom: 20,
              }}
            >
              ◆◆ 04 · PICK YOUR ROLE
            </div>
            <h2
              style={{
                fontFamily: F.black,
                fontSize: "clamp(40px, 6vw, 96px)",
                lineHeight: 0.9,
                letterSpacing: "-0.04em",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              847 ways
              <br />
              <span
                style={{
                  fontFamily: F.fraunces,
                  fontStyle: "italic",
                  fontWeight: 400,
                  textTransform: "lowercase",
                  color: "#00FF88",
                }}
              >
                to start.
              </span>
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {OCCUPATIONS.map((occ, i) => {
            const isHover = hovered === i
            return (
              <Link
                key={occ.slug}
                href={`/occupation/${occ.slug}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: "32px 24px 28px",
                  borderRadius: 16,
                  background: isHover ? `${occ.color}15` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isHover ? occ.color : occ.color + "40"}`,
                  textDecoration: "none",
                  color: "#fff",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all .3s cubic-bezier(.2,.8,.2,1)",
                  opacity: seen ? 1 : 0,
                  transform: seen
                    ? isHover
                      ? "translateY(-6px)"
                      : "translateY(0)"
                    : "translateY(16px)",
                  transitionDelay: seen && !isHover ? `${i * 50}ms` : "0ms",
                  boxShadow: isHover
                    ? `0 0 60px ${occ.color}55, inset 0 0 30px ${occ.color}15`
                    : "none",
                  display: "block",
                }}
              >
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    color: occ.color,
                    marginBottom: 16,
                    textShadow: `0 0 8px ${occ.color}`,
                  }}
                >
                  {occ.category.toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily: F.black,
                    fontSize: 22,
                    letterSpacing: "-0.02em",
                    marginBottom: 24,
                    lineHeight: 1.05,
                    textTransform: "uppercase",
                  }}
                >
                  {occ.title}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span
                    style={{
                      fontFamily: F.black,
                      fontSize: 48,
                      letterSpacing: "-0.04em",
                      color: occ.color,
                      textShadow: `0 0 20px ${occ.color}66`,
                    }}
                  >
                    {occ.minutes}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                      fontFamily: F.mono,
                    }}
                  >
                    MIN/DAY BACK
                  </span>
                </div>

                {isHover && (
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    {Array.from({ length: 6 }, (_, k) => (
                      <span
                        key={k}
                        style={{
                          position: "absolute",
                          left: `${15 + k * 14}%`,
                          bottom: 10,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: occ.color,
                          boxShadow: `0 0 14px ${occ.color}`,
                          animation: `spark-rise 1.4s cubic-bezier(.3,.9,.3,1) ${k * 0.08}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ----------------------------------------------------------------------------
// Section 5 — Build a team calculator
type Seat = { role: string; count: number; per: number; color: string }

function BuildATeam() {
  const [ref, seen] = useInView<HTMLElement>()
  const [seats, setSeats] = useState<Seat[]>([
    { role: "Software Engineers", count: 4, per: 112, color: "#00E5FF" },
    { role: "Customer Success",   count: 3, per: 95,  color: "#B56CFF" },
    { role: "Marketing",          count: 2, per: 82,  color: "#FF3EA5" },
  ])
  const totalMin = seats.reduce((a, s) => a + s.count * s.per, 0)
  const counter = useCountUp(seen ? totalMin : 0, 1200)

  return (
    <section
      ref={ref}
      style={{
        padding: "160px 48px",
        background: "linear-gradient(180deg, #05060E 0%, #0A0A2E 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 80% 50%, rgba(0,229,255,0.15), transparent 55%)",
        }}
      />
      <RisingMinutes count={12} zIndex={0} />
      <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 12,
            letterSpacing: "0.12em",
            color: "#00FF88",
            marginBottom: 20,
          }}
        >
          ◆◆ 05 · FOR OPS LEADERS
        </div>
        <h2
          style={{
            fontFamily: F.black,
            fontSize: "clamp(44px, 7vw, 120px)",
            lineHeight: 0.88,
            letterSpacing: "-0.04em",
            margin: "0 0 72px",
            textTransform: "uppercase",
          }}
        >
          Staff a whole
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #00E5FF, #00FF88)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            function.
          </span>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(0,229,255,0.25)",
              borderRadius: 24,
              padding: 36,
              boxShadow: "0 0 40px rgba(0,229,255,0.08)",
            }}
          >
            {seats.map((s, i) => (
              <div
                key={s.role}
                style={{
                  padding: "20px 0",
                  borderBottom:
                    i < seats.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: s.color,
                    boxShadow: `0 0 10px ${s.color}`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.archivo, fontWeight: 700, fontSize: 16 }}>
                    {s.role}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontFamily: F.mono,
                      color: "rgba(255,255,255,0.5)",
                      marginTop: 2,
                    }}
                  >
                    {s.per} min/day · person
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() =>
                      setSeats((v) =>
                        v.map((x, idx) => (idx === i ? { ...x, count: Math.max(0, x.count - 1) } : x)),
                      )
                    }
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "transparent",
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: F.grotesk,
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontFamily: F.black,
                      fontSize: 22,
                      width: 30,
                      textAlign: "center",
                      color: s.color,
                    }}
                  >
                    {s.count}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSeats((v) =>
                        v.map((x, idx) => (idx === i ? { ...x, count: x.count + 1 } : x)),
                      )
                    }
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      border: `1px solid ${s.color}`,
                      background: `${s.color}22`,
                      color: s.color,
                      cursor: "pointer",
                      fontFamily: F.grotesk,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 11,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
                marginBottom: 12,
              }}
            >
              DAILY TIME RECLAIMED
            </div>
            <div
              style={{
                fontFamily: F.black,
                fontSize: "clamp(100px, 14vw, 240px)",
                lineHeight: 0.85,
                letterSpacing: "-0.05em",
                background: "linear-gradient(180deg, #00E5FF, #00FF88)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 40px rgba(0,255,136,0.3))",
              }}
            >
              {Math.round(counter)}
              <span
                style={{
                  fontSize: "0.22em",
                  fontFamily: F.fraunces,
                  fontStyle: "italic",
                  fontWeight: 400,
                  WebkitTextFillColor: "rgba(255,255,255,0.5)",
                }}
              >
                min
              </span>
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 18,
                color: "rgba(255,255,255,0.7)",
                fontFamily: F.fraunces,
                fontStyle: "italic",
              }}
            >
              ≈ {(totalMin / 480).toFixed(1)} equivalent FTEs · $
              {Math.round((totalMin / 60) * 85 * 250).toLocaleString()}/year
            </div>
            <Link
              href="/build-a-team"
              style={{
                marginTop: 32,
                padding: "18px 32px",
                background: "linear-gradient(135deg, #00E5FF, #00FF88)",
                color: "#05060E",
                border: "none",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 15,
                cursor: "pointer",
                fontFamily: F.grotesk,
                boxShadow: "0 10px 40px rgba(0,229,255,0.3)",
                display: "block",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              GENERATE MY HIRING PLAN ↗
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ----------------------------------------------------------------------------
// Section 6 — CTA finale (sunrise gradient)
function CTA() {
  return (
    <section
      style={{
        padding: "220px 48px 160px",
        background: "#05060E",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "-30%",
          transform: "translateX(-50%)",
          width: "160vw",
          height: "100vw",
          maxWidth: 2000,
          maxHeight: 1200,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at center, #FFD400 0%, #FF3EA5 30%, #B56CFF 55%, transparent 75%)",
          filter: "blur(20px)",
          opacity: 0.35,
          animation: "sunrise 8s ease-in-out infinite",
        }}
      />
      <RisingMinutes count={20} zIndex={1} />
      <div style={{ position: "relative", maxWidth: 1400, margin: "0 auto", zIndex: 3 }}>
        <div
          style={{
            fontFamily: F.black,
            fontSize: "clamp(72px, 14vw, 240px)",
            lineHeight: 0.85,
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
          }}
        >
          START
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #FFD400, #FF3EA5, #B56CFF, #00E5FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "200% 100%",
              animation: "gradient-shift 6s ease-in-out infinite",
            }}
          >
            RECLAIMING.
          </span>
        </div>
        <p
          style={{
            maxWidth: 620,
            margin: "36px auto 0",
            fontFamily: F.fraunces,
            fontSize: 22,
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.85)",
            fontStyle: "italic",
          }}
        >
          Your role. Your team. Your day — mapped in under a minute.
        </p>
        <Link
          href="/browse"
          style={{
            marginTop: 40,
            padding: "22px 44px",
            background: "#fff",
            color: "#05060E",
            border: "none",
            borderRadius: 999,
            fontWeight: 800,
            fontSize: 16,
            fontFamily: F.grotesk,
            boxShadow: "0 20px 60px rgba(255,255,255,0.2)",
            display: "inline-block",
            textDecoration: "none",
          }}
        >
          EXPLORE 847 ROLES ↗
        </Link>
      </div>
    </section>
  )
}

// ----------------------------------------------------------------------------
// Footer
function TypeCityFooter() {
  return (
    <footer
      style={{
        padding: "64px 48px 48px",
        background: "#05060E",
        color: "rgba(255,255,255,0.5)",
        fontFamily: F.mono,
        fontSize: 11,
        letterSpacing: "0.08em",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <span>© 2026 · PLACE TO STAND AGENCY</span>
      <span>BUILT ON BLS · O*NET</span>
    </footer>
  )
}

// ----------------------------------------------------------------------------
export default function TypeCityPage() {
  return (
    <div className={`type-city-root ${FONT_VARS}`}>
      <Hero />
      <Anatomy />
      <DayStrip />
      <Grid />
      <BuildATeam />
      <CTA />
      <TypeCityFooter />
    </div>
  )
}
