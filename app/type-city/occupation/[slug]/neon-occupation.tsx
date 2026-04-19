"use client"

import { Archivo, Archivo_Black, DM_Mono, Fraunces, Space_Grotesk } from "next/font/google"
import Link from "next/link"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useInView, useCountUp } from "../../_lib/motion"
import "../../type-city.css"
import { OrbitalBuilder } from "./orbital-builder"

// -----------------------------------------------------------------------------
// Font setup (page-scoped, mirrors /type-city homepage)

const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--tc-archivo", display: "swap" })
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--tc-archivo-black", display: "swap" })
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "600", "700", "900"], variable: "--tc-fraunces", display: "swap" })
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--tc-mono", display: "swap" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--tc-grotesk", display: "swap" })

const FONT_VARS = [archivo.variable, archivoBlack.variable, fraunces.variable, dmMono.variable, spaceGrotesk.variable].join(" ")

const F = {
  black: `"Archivo Black", var(--tc-archivo-black), sans-serif`,
  archivo: `"Archivo", var(--tc-archivo), sans-serif`,
  fraunces: `"Fraunces", var(--tc-fraunces), serif`,
  mono: `"DM Mono", var(--tc-mono), ui-monospace, monospace`,
  grotesk: `"Space Grotesk", var(--tc-grotesk), system-ui, sans-serif`,
} as const

const NEON = {
  cyan: "#00E5FF",
  magenta: "#FF3EA5",
  purple: "#B56CFF",
  yellow: "#FFD400",
  green: "#00FF88",
  orange: "#FF6B00",
} as const

// -----------------------------------------------------------------------------
// Background primitives (aurora + grid). Full-viewport fixed layer.

function AuroraBG() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 50% at 30% 20%, rgba(0,229,255,0.38) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(181,108,255,0.35) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(0,255,136,0.25) 0%, transparent 60%)",
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
            "linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)",
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

// -----------------------------------------------------------------------------
// Rising minute coins — scaled to this occupation's claimed minutes.

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

function RisingMinutes({ count = 26, claimed }: { count?: number; claimed: number }) {
  const [coins, setCoins] = useState<CoinSpec[]>([])
  useEffect(() => {
    const colors = [NEON.cyan, NEON.purple, NEON.magenta, NEON.yellow, NEON.green]
    // Distribute minute values around the claimed total so the coins feel
    // connected to the role (rather than a generic assortment).
    const mins = [5, 10, 15, 20, 30, 45, Math.max(15, Math.round(claimed / 6))]
    setCoins(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: (Math.random() * 18).toFixed(2),
        duration: 14 + Math.random() * 10,
        size: 22 + Math.random() * 20,
        color: colors[i % colors.length],
        minutes: mins[i % mins.length],
        drift: (Math.random() - 0.5) * 60,
      })),
    )
  }, [count, claimed])

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
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
              fontSize: Math.floor(c.size * 0.3),
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

// -----------------------------------------------------------------------------
// Kinetic title — splits occupation title into words + letters with stagger.

function KineticTitle({ title }: { title: string }) {
  const words = title.split(" ")
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [])
  let globalIdx = 0
  return (
    <h1
      style={{
        fontFamily: F.black,
        fontSize: "clamp(56px, 10vw, 148px)",
        lineHeight: 0.88,
        letterSpacing: "-0.04em",
        color: "#fff",
        textTransform: "uppercase",
        margin: 0,
        textShadow: "0 0 60px rgba(0,229,255,0.2)",
      }}
    >
      {words.map((word, wi) => (
        <span key={wi} style={{ display: "inline-block", marginRight: "0.35em" }}>
          {word.split("").map((ch) => {
            const i = globalIdx++
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0) rotateX(0deg)" : "translateY(0.6em) rotateX(40deg)",
                  transition: `opacity .5s ease ${i * 0.035}s, transform .8s cubic-bezier(.2,1.2,.3,1) ${i * 0.035}s`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </span>
      ))}
    </h1>
  )
}

// -----------------------------------------------------------------------------
// Morphing verb for hero lede.

function MorphingVerb({ verbs = ["RECLAIM", "REWIRE", "REDEFINE", "REWRITE"] }: { verbs?: string[] }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % verbs.length), 2200)
    return () => clearInterval(t)
  }, [verbs.length])
  return (
    <span style={{ display: "inline-block", position: "relative", minWidth: "9ch", textAlign: "left" }}>
      {verbs.map((v, idx) => (
        <span
          key={v}
          style={{
            position: idx === 0 ? "relative" : "absolute",
            left: 0,
            top: 0,
            opacity: idx === i ? 1 : 0,
            transform: idx === i ? "translateY(0)" : "translateY(0.22em)",
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

// -----------------------------------------------------------------------------
// Minutes count-up, shown as giant gradient number.

function MinutesBig({ target }: { target: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.3)
  const val = useCountUp(target, 1600, seen)
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
      <span
        style={{
          fontFamily: F.black,
          fontSize: "clamp(64px, 12vw, 180px)",
          lineHeight: 0.85,
          letterSpacing: "-0.05em",
          background: "linear-gradient(135deg, #00E5FF 0%, #B56CFF 50%, #FF3EA5 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 40px rgba(0,229,255,0.4))",
        }}
      >
        {Math.round(val)}
      </span>
      <span
        style={{
          fontFamily: F.fraunces,
          fontStyle: "italic",
          fontSize: "clamp(24px, 3.6vw, 52px)",
          color: NEON.green,
          letterSpacing: "-0.02em",
          filter: "drop-shadow(0 0 20px rgba(0,255,136,0.5))",
        }}
      >
        minutes/day
      </span>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Value chip — floats in corner of hero with $ value per year.

function ValueChip({ annualValue }: { annualValue: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.5)
  const val = useCountUp(annualValue, 1800, seen)
  return (
    <div
      ref={ref}
      style={{
        padding: "20px 26px",
        borderRadius: 20,
        border: `1px solid ${NEON.yellow}`,
        background: "rgba(255, 212, 0, 0.07)",
        boxShadow: `0 0 40px ${NEON.yellow}33, inset 0 0 20px ${NEON.yellow}11`,
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 220,
      }}
    >
      <div style={{ fontFamily: F.mono, fontSize: 11, color: NEON.yellow, letterSpacing: "0.18em", textTransform: "uppercase" }}>
        reclaimed value
      </div>
      <div style={{ fontFamily: F.black, fontSize: 44, lineHeight: 1, color: "#fff", letterSpacing: "-0.03em" }}>
        ${Math.round(val / 1000)}K
      </div>
      <div style={{ fontFamily: F.grotesk, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
        per person · per year
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Proof strip — small row of mono stats below the hero.

function ProofStrip({
  employment,
  hourlyWage,
  claimed,
  annualMinutes,
}: {
  employment: number | null
  hourlyWage: number | null
  claimed: number
  annualMinutes: number
}) {
  const items = [
    employment ? { k: "U.S. workforce", v: fmtNumber(employment) } : null,
    hourlyWage ? { k: "Median wage", v: `$${hourlyWage.toFixed(0)}/hr` } : null,
    { k: "Reclaim/day", v: `${claimed} min` },
    { k: "Reclaim/yr", v: `${fmtK(annualMinutes)} min` },
  ].filter(Boolean) as { k: string; v: string }[]
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 1,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            padding: "18px 22px",
            background: "#0a0c17",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
            {it.k}
          </div>
          <div style={{ fontFamily: F.archivo, fontSize: 22, fontWeight: 800, color: "#fff" }}>{it.v}</div>
        </div>
      ))}
    </div>
  )
}

function fmtNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}
function fmtK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return `${n}`
}

// -----------------------------------------------------------------------------
// Hero section

function Hero({
  title,
  category,
  claimed,
  annualValue,
  employment,
  hourlyWage,
  annualMinutes,
  slug,
}: {
  title: string
  category: string
  claimed: number
  annualValue: number
  employment: number | null
  hourlyWage: number | null
  annualMinutes: number
  slug: string
}) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        padding: "40px 32px 60px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AuroraBG />
      <RisingMinutes claimed={claimed} />

      {/* Top bar */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          href="/type-city"
          style={{
            fontFamily: F.mono,
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            textDecoration: "none",
          }}
        >
          ← type city
        </Link>
        <div
          style={{
            padding: "6px 14px",
            border: `1px solid ${NEON.cyan}`,
            borderRadius: 999,
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: NEON.cyan,
            background: "rgba(0,229,255,0.05)",
            textShadow: `0 0 10px ${NEON.cyan}`,
          }}
        >
          {category}
        </div>
      </div>

      {/* Main hero content */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          flex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "center",
          gap: 40,
          marginTop: 40,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            · a neon prototype · occupation feature
          </div>

          <KineticTitle title={title} />

          <div
            style={{
              marginTop: 28,
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              fontFamily: F.black,
              fontSize: "clamp(28px, 4.5vw, 56px)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            <MorphingVerb />
            <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 400, fontFamily: F.fraunces, fontStyle: "italic" }}>
              your
            </span>
          </div>

          <div style={{ marginTop: 20 }}>
            <MinutesBig target={claimed} />
          </div>

          <div
            style={{
              marginTop: 28,
              fontFamily: F.grotesk,
              fontSize: 18,
              color: "rgba(255,255,255,0.75)",
              maxWidth: 560,
              lineHeight: 1.5,
            }}
          >
            Custom AI agents, built for the real work of{" "}
            <span style={{ color: "#fff", fontWeight: 600 }}>{title.toLowerCase()}</span>
            {" "}— not a generic chatbot.
          </div>

          <div style={{ marginTop: 36, display: "flex", gap: 18, flexWrap: "wrap" }}>
            <Link
              href="/contact"
              style={{
                padding: "16px 28px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #00E5FF 0%, #B56CFF 100%)",
                color: "#05060E",
                fontFamily: F.archivo,
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "0.02em",
                textDecoration: "none",
                animation: "btn-breathe 3s ease-in-out infinite",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              Book a scoping call →
            </Link>
            <a
              href="#anatomy"
              style={{
                padding: "16px 28px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.22)",
                color: "#fff",
                fontFamily: F.archivo,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(8px)",
              }}
            >
              See the anatomy ↓
            </a>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 5 }}>
          <ValueChip annualValue={annualValue} />
        </div>
      </div>

      {/* Proof strip — anchored at bottom of hero */}
      <div style={{ position: "relative", zIndex: 5, marginTop: 48 }}>
        <ProofStrip
          employment={employment}
          hourlyWage={hourlyWage}
          claimed={claimed}
          annualMinutes={annualMinutes}
        />
      </div>
    </section>
  )
}

// -----------------------------------------------------------------------------
// Day strip — before/after story with motion reveal.

function DayStrip({ dayChanges, whyItFits, title, claimed }: { dayChanges: string; whyItFits: string; title: string; claimed: number }) {
  const [ref, seen] = useInView<HTMLElement>(0.25)
  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        padding: "120px 32px",
        background: "#05060e",
        borderTop: "1px solid rgba(0,229,255,0.1)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            color: NEON.magenta,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginBottom: 18,
            textShadow: `0 0 10px ${NEON.magenta}`,
          }}
        >
          · section 01 / a day
        </div>

        <h2
          style={{
            fontFamily: F.fraunces,
            fontStyle: "italic",
            fontSize: "clamp(48px, 8vw, 112px)",
            lineHeight: 0.9,
            letterSpacing: "-0.03em",
            color: "#fff",
            margin: "0 0 60px",
            maxWidth: 1100,
            opacity: seen ? 1 : 0,
            transform: seen ? "translateY(0)" : "translateY(30px)",
            transition: "opacity 1s ease, transform 1s cubic-bezier(.2,1.2,.3,1)",
          }}
        >
          what changes <br />
          when {title.toLowerCase()} get <br />
          <span style={{ color: NEON.green, filter: `drop-shadow(0 0 40px ${NEON.green}88)` }}>
            {claimed} minutes
          </span>{" "}
          back?
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            fontFamily: F.grotesk,
            fontSize: 17,
            lineHeight: 1.65,
          }}
        >
          <div
            style={{
              padding: 28,
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.03), transparent)",
              color: "rgba(255,255,255,0.85)",
              opacity: seen ? 1 : 0,
              transform: seen ? "translateX(0)" : "translateX(-30px)",
              transition: "opacity 1s ease .2s, transform 1s cubic-bezier(.2,1.2,.3,1) .2s",
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: 10, color: NEON.cyan, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 14 }}>
              the day changes
            </div>
            <div>{dayChanges || `A ${title.toLowerCase()} stops carrying the administrative weight of the role, and spends that energy on the parts only a human can do.`}</div>
          </div>

          <div
            style={{
              padding: 28,
              borderRadius: 20,
              border: `1px solid ${NEON.green}55`,
              background: `linear-gradient(180deg, ${NEON.green}11, transparent)`,
              color: "rgba(255,255,255,0.9)",
              boxShadow: `inset 0 0 40px ${NEON.green}15`,
              opacity: seen ? 1 : 0,
              transform: seen ? "translateX(0)" : "translateX(30px)",
              transition: "opacity 1s ease .35s, transform 1s cubic-bezier(.2,1.2,.3,1) .35s",
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: 10, color: NEON.green, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 14 }}>
              why it fits
            </div>
            <div>{whyItFits || `The role has a specific shape: high-value judgment work surrounded by recurring operational friction. That's exactly what custom agents are good at absorbing.`}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// -----------------------------------------------------------------------------
// Task rail — grid of neon task chips with on-scroll stagger reveal.

function TaskRail({ tasks }: { tasks: { id: number; name: string; minutes: number; impact: number; block: string }[] }) {
  const [ref, seen] = useInView<HTMLElement>(0.15)
  const palette = [NEON.cyan, NEON.magenta, NEON.purple, NEON.yellow, NEON.green, NEON.orange]
  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        padding: "120px 32px",
        borderTop: "1px solid rgba(181,108,255,0.12)",
        background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(181,108,255,0.12), transparent)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            color: NEON.purple,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginBottom: 18,
            textShadow: `0 0 10px ${NEON.purple}`,
          }}
        >
          · section 02 / the tasks the agents take
        </div>

        <h2
          style={{
            fontFamily: F.black,
            fontSize: "clamp(44px, 7vw, 96px)",
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            color: "#fff",
            margin: "0 0 16px",
            textTransform: "uppercase",
          }}
        >
          every minute <br />
          <span style={{ fontFamily: F.fraunces, fontStyle: "italic", fontWeight: 700, color: NEON.yellow, textTransform: "none", filter: `drop-shadow(0 0 30px ${NEON.yellow}88)` }}>
            has a receipt.
          </span>
        </h2>

        <p
          style={{
            fontFamily: F.grotesk,
            fontSize: 16,
            color: "rgba(255,255,255,0.7)",
            margin: "0 0 44px",
            maxWidth: 640,
          }}
        >
          Top recurring tasks we offload — each counted in real minutes, derived from BLS task data and our automation scoring.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {tasks.map((t, i) => {
            const color = palette[i % palette.length]
            return (
              <div
                key={t.id}
                style={{
                  position: "relative",
                  padding: 22,
                  borderRadius: 16,
                  border: `1px solid ${color}66`,
                  background: "rgba(255,255,255,0.03)",
                  boxShadow: `inset 0 0 30px ${color}11`,
                  backdropFilter: "blur(10px)",
                  opacity: seen ? 1 : 0,
                  transform: seen ? "translateY(0)" : "translateY(30px)",
                  transition: `opacity .7s ease ${i * 0.06}s, transform .9s cubic-bezier(.2,1.2,.3,1) ${i * 0.06}s`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontSize: 10,
                      color,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                    }}
                  >
                    {t.block}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 3,
                    }}
                  >
                    {Array.from({ length: 5 }).map((_, k) => (
                      <div
                        key={k}
                        style={{
                          width: 6,
                          height: 14,
                          borderRadius: 2,
                          background: k < t.impact ? color : "rgba(255,255,255,0.1)",
                          boxShadow: k < t.impact ? `0 0 8px ${color}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: F.archivo,
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.3,
                    marginBottom: 14,
                    minHeight: "2.6em",
                  }}
                >
                  {t.name}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: F.black,
                      fontSize: 36,
                      color,
                      letterSpacing: "-0.03em",
                      textShadow: `0 0 20px ${color}88`,
                    }}
                  >
                    +{t.minutes}
                  </span>
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: 12,
                      color: "rgba(255,255,255,0.6)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    min/day
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// -----------------------------------------------------------------------------
// Agent anatomy — orbit layout with center "brain" pulsing and agent cards
// arranged around it. Connecting lines in SVG.

function AgentAnatomy({
  agents,
  claimed,
}: {
  agents: {
    blockName: string
    role: string
    color: string
    minutesSaved: number
    automatedCount: number
    assistedCount: number
    topTasks: string[]
  }[]
  claimed: number
}) {
  const [ref, seen] = useInView<HTMLElement>(0.2)
  const n = Math.max(agents.length, 1)

  return (
    <section
      id="anatomy"
      ref={ref}
      style={{
        position: "relative",
        padding: "120px 32px",
        borderTop: `1px solid ${NEON.cyan}22`,
        background:
          "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,229,255,0.1) 0%, transparent 70%)",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            color: NEON.cyan,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginBottom: 18,
            textShadow: `0 0 10px ${NEON.cyan}`,
          }}
        >
          · section 03 / the agent anatomy
        </div>

        <h2
          style={{
            fontFamily: F.black,
            fontSize: "clamp(44px, 7vw, 96px)",
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            color: "#fff",
            margin: "0 0 16px",
            textTransform: "uppercase",
          }}
        >
          {agents.length} agents. <br />
          <span style={{ fontFamily: F.fraunces, fontStyle: "italic", fontWeight: 700, color: NEON.cyan, textTransform: "none" }}>
            one workday.
          </span>
        </h2>

        <p
          style={{
            fontFamily: F.grotesk,
            fontSize: 16,
            color: "rgba(255,255,255,0.7)",
            margin: "0 0 64px",
            maxWidth: 640,
          }}
        >
          Each agent is a specialist. They communicate, hand off, and stay inside the guardrails of your workflow.
        </p>

        {/* Orbit visualization — CSS only, responsive */}
        <div
          style={{
            position: "relative",
            width: "min(720px, 100%)",
            aspectRatio: "1 / 1",
            margin: "0 auto 64px",
          }}
        >
          {/* Center core */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "radial-gradient(circle at 30% 30%, rgba(0,229,255,0.6), rgba(181,108,255,0.3) 60%, transparent)",
              border: `1px solid ${NEON.cyan}`,
              boxShadow: `0 0 60px ${NEON.cyan}66, inset 0 0 40px ${NEON.purple}44`,
              animation: "logo-pulse 3s ease-in-out infinite",
              display: "grid",
              placeItems: "center",
              zIndex: 2,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: F.mono, fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                reclaimed
              </div>
              <div style={{ fontFamily: F.black, fontSize: 42, color: "#fff", lineHeight: 1 }}>{claimed}</div>
              <div style={{ fontFamily: F.fraunces, fontStyle: "italic", fontSize: 14, color: NEON.green }}>
                min/day
              </div>
            </div>
          </div>

          {/* Rotating orbit ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1px dashed rgba(0,229,255,0.25)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "8%",
              borderRadius: "50%",
              border: "1px dashed rgba(181,108,255,0.18)",
            }}
          />

          {/* Connecting lines SVG */}
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {agents.map((_, i) => {
              const angle = (i / n) * Math.PI * 2 - Math.PI / 2
              const x = 50 + Math.cos(angle) * 42
              const y = 50 + Math.sin(angle) * 42
              return (
                <line
                  key={i}
                  x1={50}
                  y1={50}
                  x2={x}
                  y2={y}
                  stroke={agents[i].color}
                  strokeWidth={0.15}
                  strokeDasharray="1 1.5"
                  opacity={seen ? 0.5 : 0}
                  style={{ transition: `opacity 1s ease ${0.3 + i * 0.08}s` }}
                />
              )
            })}
          </svg>

          {/* Agent nodes */}
          {agents.map((a, i) => {
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2
            const radius = 42
            const x = 50 + Math.cos(angle) * radius
            const y = 50 + Math.sin(angle) * radius
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  width: 120,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: `1px solid ${a.color}`,
                  background: "rgba(10,12,23,0.92)",
                  boxShadow: `0 0 24px ${a.color}55, inset 0 0 20px ${a.color}11`,
                  backdropFilter: "blur(10px)",
                  opacity: seen ? 1 : 0,
                  transitionProperty: "opacity, transform",
                  transitionDuration: "0.8s",
                  transitionTimingFunction: "cubic-bezier(.2,1.2,.3,1)",
                  transitionDelay: `${0.2 + i * 0.1}s`,
                }}
              >
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 9,
                    color: a.color,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  {a.blockName}
                </div>
                <div
                  style={{
                    fontFamily: F.archivo,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.2,
                    marginBottom: 6,
                  }}
                >
                  {a.role}
                </div>
                <div
                  style={{
                    fontFamily: F.black,
                    fontSize: 20,
                    color: a.color,
                    letterSpacing: "-0.02em",
                  }}
                >
                  +{Math.round(a.minutesSaved)}m
                </div>
              </div>
            )
          })}
        </div>

        {/* Agent detail grid below orbit */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {agents.map((a, i) => (
            <div
              key={i}
              style={{
                padding: 22,
                borderRadius: 16,
                border: `1px solid ${a.color}44`,
                background: "rgba(255,255,255,0.02)",
                opacity: seen ? 1 : 0,
                transform: seen ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.7s ease ${0.6 + i * 0.05}s`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 10,
                    color: a.color,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                  }}
                >
                  {a.blockName}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: 10,
                      color: NEON.green,
                      padding: "3px 8px",
                      borderRadius: 999,
                      border: `1px solid ${NEON.green}44`,
                    }}
                  >
                    {a.automatedCount} auto
                  </span>
                  <span
                    style={{
                      fontFamily: F.mono,
                      fontSize: 10,
                      color: NEON.yellow,
                      padding: "3px 8px",
                      borderRadius: 999,
                      border: `1px solid ${NEON.yellow}44`,
                    }}
                  >
                    {a.assistedCount} assist
                  </span>
                </div>
              </div>
              <div
                style={{
                  fontFamily: F.archivo,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 12,
                  lineHeight: 1.25,
                }}
              >
                {a.role}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {a.topTasks.map((task, k) => (
                  <li
                    key={k}
                    style={{
                      fontFamily: F.grotesk,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.75)",
                      paddingLeft: 16,
                      position: "relative",
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "0.6em",
                        width: 8,
                        height: 1,
                        background: a.color,
                        boxShadow: `0 0 6px ${a.color}`,
                      }}
                    />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// -----------------------------------------------------------------------------
// Big number moment — full-viewport annual impact.

function BigNumberMoment({ claimed, annualMinutes, annualValue }: { claimed: number; annualMinutes: number; annualValue: number }) {
  const [ref, seen] = useInView<HTMLElement>(0.3)
  const minutes = useCountUp(annualMinutes, 2000, seen)
  const dollars = useCountUp(annualValue, 2000, seen)
  const workDays = Math.round(annualMinutes / (8 * 60))
  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        minHeight: "90vh",
        padding: "120px 32px",
        borderTop: `1px solid ${NEON.magenta}22`,
        background:
          "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,62,165,0.2) 0%, transparent 70%)",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", textAlign: "center", position: "relative", zIndex: 2 }}>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            color: NEON.magenta,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginBottom: 18,
            textShadow: `0 0 10px ${NEON.magenta}`,
          }}
        >
          · section 04 / the year, rewritten
        </div>

        <div
          style={{
            fontFamily: F.fraunces,
            fontStyle: "italic",
            fontSize: "clamp(28px, 4vw, 48px)",
            color: "rgba(255,255,255,0.75)",
            marginBottom: 32,
          }}
        >
          one person, {claimed} minutes a day, 260 working days —
        </div>

        <div
          style={{
            fontFamily: F.black,
            fontSize: "clamp(80px, 18vw, 280px)",
            lineHeight: 0.85,
            letterSpacing: "-0.05em",
            background: "linear-gradient(135deg, #FF3EA5 0%, #FFD400 50%, #00FF88 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 60px rgba(255,62,165,0.4))",
            margin: "0 0 24px",
          }}
        >
          {fmtK(Math.round(minutes))}
        </div>

        <div
          style={{
            fontFamily: F.grotesk,
            fontSize: 24,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 48,
          }}
        >
          minutes returned. That's{" "}
          <span
            style={{
              fontFamily: F.fraunces,
              fontStyle: "italic",
              color: NEON.green,
              fontSize: 30,
              filter: `drop-shadow(0 0 20px ${NEON.green}88)`,
            }}
          >
            {workDays} full work days
          </span>{" "}
          per person, every year.
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 16,
            padding: "20px 40px",
            borderRadius: 999,
            border: `1px solid ${NEON.yellow}`,
            background: "rgba(255, 212, 0, 0.08)",
            boxShadow: `0 0 40px ${NEON.yellow}33`,
          }}
        >
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 12,
              color: NEON.yellow,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}>
            value reclaimed
          </span>
          <span
            style={{
              fontFamily: F.black,
              fontSize: 48,
              color: "#fff",
              letterSpacing: "-0.03em",
            }}
          >
            ${Math.round(dollars / 1000)}K/yr
          </span>
        </div>
      </div>
    </section>
  )
}

// -----------------------------------------------------------------------------
// Final CTA

function FinaleCTA({ title, slug }: { title: string; slug: string }) {
  return (
    <section
      style={{
        position: "relative",
        padding: "140px 32px 100px",
        borderTop: "1px solid rgba(0,229,255,0.15)",
        background:
          "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,255,136,0.15) 0%, transparent 70%)",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            fontFamily: F.black,
            fontSize: "clamp(56px, 10vw, 140px)",
            lineHeight: 0.88,
            letterSpacing: "-0.04em",
            color: "#fff",
            textTransform: "uppercase",
            margin: "0 0 24px",
          }}
        >
          <MorphingVerb verbs={["REDEFINE", "RECLAIM", "REWIRE", "REWRITE"]} />{" "}
          <br />
          <span
            style={{
              fontFamily: F.fraunces,
              fontStyle: "italic",
              fontWeight: 400,
              color: NEON.green,
              textTransform: "none",
              filter: `drop-shadow(0 0 40px ${NEON.green}88)`,
            }}
          >
            the {title.toLowerCase()} workday.
          </span>
        </h2>

        <p
          style={{
            fontFamily: F.grotesk,
            fontSize: 20,
            color: "rgba(255,255,255,0.75)",
            maxWidth: 640,
            margin: "0 auto 44px",
            lineHeight: 1.5,
          }}
        >
          45-minute scoping call. No sales deck. We map the 3 places your agents earn their keep in month one.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/contact"
            style={{
              padding: "20px 36px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #00E5FF 0%, #B56CFF 100%)",
              color: "#05060E",
              fontFamily: F.archivo,
              fontWeight: 800,
              fontSize: 17,
              letterSpacing: "0.02em",
              textDecoration: "none",
              animation: "btn-breathe 3s ease-in-out infinite",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            Book a scoping call →
          </Link>
          <Link
            href={`/occupation/${slug}`}
            style={{
              padding: "20px 36px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              fontFamily: F.archivo,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(8px)",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            Try the live demo →
          </Link>
        </div>

        <div
          style={{
            marginTop: 80,
            paddingTop: 40,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontFamily: F.mono,
            fontSize: 11,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          · neon prototype · ai timeback · a place to stand ·
        </div>
      </div>
    </section>
  )
}

// -----------------------------------------------------------------------------
// Top-level page component

export function NeonOccupation({
  slug,
  title,
  category,
  employment,
  hourlyWage,
  claimedMinutes,
  annualMinutes,
  annualValue,
  dayChanges,
  whyItFits,
  taskCards,
  agents,
  moduleGroups,
  occupationId,
}: {
  slug: string
  title: string
  category: string
  employment: number | null
  hourlyWage: number | null
  claimedMinutes: number
  annualMinutes: number
  annualValue: number
  dayChanges: string
  whyItFits: string
  handles: string[]
  staysWithYou: string[]
  taskCards: { id: number; name: string; minutes: number; impact: number; how: string; block: string }[]
  agents: {
    blockName: string
    role: string
    color: string
    minutesSaved: number
    automatedCount: number
    assistedCount: number
    topTasks: string[]
  }[]
  // Keep in sync with ModuleGroup in ./page
  moduleGroups: {
    moduleKey: string
    label: string
    description: string
    color: string
    taskCount: number
    groupMinutes: number
    taskIds: number[]
  }[]
  occupationId: number
}) {
  return (
    <div className={`type-city-root ${FONT_VARS}`}>
      <Hero
        title={title}
        category={category}
        claimed={claimedMinutes}
        annualValue={annualValue}
        employment={employment}
        hourlyWage={hourlyWage}
        annualMinutes={annualMinutes}
        slug={slug}
      />

      <DayStrip dayChanges={dayChanges} whyItFits={whyItFits} title={title} claimed={claimedMinutes} />

      <TaskRail tasks={taskCards} />

      {agents.length > 0 && <AgentAnatomy agents={agents} claimed={claimedMinutes} />}

      <OrbitalBuilder
        slug={slug}
        occupationId={occupationId}
        occupationTitle={title}
        hourlyWage={hourlyWage}
        moduleGroups={moduleGroups}
      />

      <BigNumberMoment
        claimed={claimedMinutes}
        annualMinutes={annualMinutes}
        annualValue={annualValue}
      />

      <FinaleCTA title={title} slug={slug} />
    </div>
  )
}
