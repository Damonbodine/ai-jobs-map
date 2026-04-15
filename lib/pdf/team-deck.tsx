// lib/pdf/team-deck.tsx
import React from "react"
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { PDF_COLORS as C } from "./styles"
import type { RoleDeckSection, ModuleBreakdown, PhasedRoadmap } from "./team-deck-data"
import type { DepartmentTotals } from "@/lib/build-a-team/compute"

export type TeamDeckProps = {
  teamLabel: string
  contactEmail: string
  contactName?: string
  customRequests: string[]
  totals: DepartmentTotals
  roles: RoleDeckSection[]
  topModules: ModuleBreakdown[]
  phases: PhasedRoadmap
  siteUrl: string
  agencyName: string
  generatedAt: string
}

const s = StyleSheet.create({
  // ── Shared ──
  page: { backgroundColor: C.bg, padding: 48, fontSize: 10, color: C.fg, lineHeight: 1.5 },
  darkPage: { backgroundColor: C.fg, padding: 48, fontSize: 10, color: C.bg, lineHeight: 1.5 },
  footer: {
    position: "absolute", bottom: 32, left: 48, right: 48,
    borderTop: `1 solid ${C.border}`, paddingTop: 10,
    fontSize: 8, color: C.muted, flexDirection: "row", justifyContent: "space-between",
  },
  darkFooter: {
    position: "absolute", bottom: 32, left: 48, right: 48,
    borderTop: "1 solid rgba(255,255,255,0.15)", paddingTop: 10,
    fontSize: 8, color: "rgba(255,255,255,0.4)", flexDirection: "row", justifyContent: "space-between",
  },
  kicker: { fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, fontWeight: 600 },
  darkKicker: { fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6, fontWeight: 600, color: "rgba(255,255,255,0.45)" },
  h1: { fontSize: 28, fontWeight: 700, lineHeight: 1.2, marginBottom: 12 },
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 16 },
  h3: { fontSize: 13, fontWeight: 700, marginBottom: 8 },
  muted: { fontSize: 9, color: C.muted },
  section: { marginBottom: 24 },
  // ── Stats ──
  statsRow: { flexDirection: "row", marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.cardBg, border: `1 solid ${C.border}`, borderRadius: 8, padding: 12, marginRight: 10 },
  statLabel: { fontSize: 7, letterSpacing: 0.8, textTransform: "uppercase", color: C.muted, marginBottom: 3 },
  statValue: { fontSize: 22, fontWeight: 700 },
  statUnit: { fontSize: 10, color: C.muted },
  // ── Table ──
  tableHeader: { flexDirection: "row", borderBottom: `1 solid ${C.border}`, paddingBottom: 5, marginBottom: 5, fontSize: 8, letterSpacing: 0.5, textTransform: "uppercase", color: C.muted, fontWeight: 600 },
  tableRow: { flexDirection: "row", paddingVertical: 6, borderBottom: `1 solid ${C.border}` },
  // ── Bullet ──
  bullet: { flexDirection: "row", marginBottom: 6 },
  bulletDot: { width: 16, color: C.accent, fontWeight: 700 },
  bulletBody: { flex: 1 },
  // ── Module row ──
  moduleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, padding: 10, backgroundColor: C.cardBg, border: `1 solid ${C.border}`, borderRadius: 6 },
  // ── Callout ──
  callout: { backgroundColor: C.accentSoft, borderRadius: 8, padding: 14, marginBottom: 16 },
})

function Footer({ agencyName, siteUrl, page, dark }: { agencyName: string; siteUrl: string; page: number; dark?: boolean }) {
  return (
    <View style={dark ? s.darkFooter : s.footer} fixed>
      <Text>{agencyName} · {siteUrl}</Text>
      <Text>Page {page}</Text>
    </View>
  )
}

// ── Page 1: Cover ──────────────────────────────────────────────
function CoverPage({ props }: { props: TeamDeckProps }) {
  const hoursPerYear = Math.round((props.totals.totalMinutesPerDay * 240) / 60)
  return (
    <Page size="LETTER" style={s.darkPage}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={s.darkKicker}>AI Timeback · Team Blueprint</Text>
        <Text style={[s.h1, { color: C.bg, marginBottom: 6 }]}>
          Your team reclaims{"\n"}
          <Text style={{ color: "#60a5fa" }}>{hoursPerYear.toLocaleString()} hours</Text>
          {"\n"}every year.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 16 }}>
          {props.roles.map(r => (
            <View key={r.slug} style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 6 }}>
              <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>{r.title} ×{r.count}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ borderTop: "1 solid rgba(255,255,255,0.12)", paddingTop: 16 }}>
        <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.4)" }}>
          Prepared by {props.agencyName} · {props.generatedAt}
        </Text>
      </View>
    </Page>
  )
}

// ── Page 2: Team Overview ──────────────────────────────────────
function OverviewPage({ props }: { props: TeamDeckProps }) {
  const hoursPerYear = Math.round((props.totals.totalMinutesPerDay * 240) / 60)
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={[s.kicker, { color: C.accent }]}>Team at a Glance</Text>
      <Text style={s.h2}>What AI gives back — across your whole team</Text>
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Hours reclaimed / year</Text>
          <Text style={s.statValue}>{hoursPerYear.toLocaleString()}</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statLabel}>Annual value</Text>
          <Text style={s.statValue}>${Math.round(props.totals.totalAnnualValue).toLocaleString()}</Text>
        </View>
        <View style={[s.statCard, { marginRight: 0 }]}>
          <Text style={s.statLabel}>FTE equivalents</Text>
          <Text style={s.statValue}>{props.totals.fteEquivalents}<Text style={s.statUnit}> FTE</Text></Text>
        </View>
      </View>
      <Text style={s.h3}>Roles in this blueprint</Text>
      <View style={s.tableHeader}>
        <Text style={{ flex: 3 }}>Role</Text>
        <Text style={{ flex: 1, textAlign: "center" }}>People</Text>
        <Text style={{ flex: 1.5, textAlign: "right" }}>Min/day each</Text>
        <Text style={{ flex: 1.5, textAlign: "right" }}>Annual value</Text>
      </View>
      {props.roles.map(r => (
        <View key={r.slug} style={s.tableRow}>
          <Text style={{ flex: 3 }}>{r.title}</Text>
          <Text style={{ flex: 1, textAlign: "center" }}>{r.count}</Text>
          <Text style={{ flex: 1.5, textAlign: "right" }}>{r.minutesPerPerson}</Text>
          <Text style={{ flex: 1.5, textAlign: "right" }}>${Math.round(r.annualValuePerPerson * r.count).toLocaleString()}</Text>
        </View>
      ))}
      {props.customRequests.length > 0 && (
        <View style={[s.callout, { marginTop: 16 }]}>
          <Text style={[s.h3, { marginBottom: 6 }]}>Custom requests noted</Text>
          {props.customRequests.map((req, i) => (
            <View key={i} style={s.bullet}>
              <Text style={s.bulletDot}>·</Text>
              <Text style={s.bulletBody}>{req}</Text>
            </View>
          ))}
        </View>
      )}
      <Footer agencyName={props.agencyName} siteUrl={props.siteUrl} page={2} />
    </Page>
  )
}

// ── Page 3: Methodology ────────────────────────────────────────
function MethodologyPage({ props }: { props: TeamDeckProps }) {
  const steps = [
    { n: "1", text: "Bureau of Labor Statistics + O*NET occupational task data was loaded for each role in your team." },
    { n: "2", text: "Each task was scored for AI impact (1–5) based on task description, frequency, and category. Tasks requiring physical presence, creative judgment, or human empathy were scored lower." },
    { n: "3", text: "Tasks were grouped into AI agent modules (Documentation, Intake, Coordination, etc.) by their primary work function." },
    { n: "4", text: "Your task selections were applied as the filter — only the tasks you chose to include appear in this blueprint." },
  ]
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={[s.kicker, { color: C.accent }]}>How these numbers were derived</Text>
      <Text style={s.h2}>Methodology</Text>
      <View style={s.section}>
        {steps.map(step => (
          <View key={step.n} style={[s.bullet, { marginBottom: 14 }]}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.fg, marginRight: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Text style={{ fontSize: 9, fontWeight: 700, color: C.bg }}>{step.n}</Text>
            </View>
            <Text style={[s.bulletBody, { paddingTop: 3 }]}>{step.text}</Text>
          </View>
        ))}
      </View>
      <View style={[s.callout, { marginTop: 8 }]}>
        <Text style={{ fontSize: 9, color: C.fg, lineHeight: 1.5 }}>
          Numbers represent median estimates based on typical workflows for these occupations. Your actual time savings will depend on workflow complexity, EHR/tool integrations, and team adoption speed. We refine all estimates during the scoping engagement.
        </Text>
      </View>
      <Footer agencyName={props.agencyName} siteUrl={props.siteUrl} page={3} />
    </Page>
  )
}

// ── Role Section Page ──────────────────────────────────────────
function RoleSectionPage({ role, pageNum, props }: { role: RoleDeckSection; pageNum: number; props: TeamDeckProps }) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <View style={{ width: 6, height: 36, borderRadius: 3, backgroundColor: C.accent, marginRight: 12 }} />
        <View>
          <Text style={[s.h2, { marginBottom: 2 }]}>{role.title}</Text>
          <Text style={s.muted}>{role.count} {role.count === 1 ? "person" : "people"} · {role.minutesPerPerson} min/day · ${Math.round(role.annualValuePerPerson * role.count).toLocaleString()}/yr total</Text>
        </View>
      </View>

      <Text style={s.h3}>Time reclaimed by module</Text>
      {role.modules.map(mod => (
        <View key={mod.moduleKey} style={[s.moduleRow, { borderLeftWidth: 4, borderLeftColor: mod.accentColor }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: 600 }}>{mod.label}</Text>
            <Text style={s.muted}>{mod.topTasks.slice(0, 2).map(t => t.name).join(" · ")}</Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: 700, color: mod.accentColor }}>{mod.minutesPerDay} min</Text>
        </View>
      ))}

      <View style={{ marginTop: 20 }}>
        <Text style={s.h3}>Top tasks — before & after AI</Text>
        <View style={s.tableHeader}>
          <Text style={{ flex: 3 }}>Task</Text>
          <Text style={{ flex: 1, textAlign: "center" }}>Before</Text>
          <Text style={{ flex: 1, textAlign: "center" }}>After</Text>
          <Text style={{ flex: 1.5 }}>Tools</Text>
        </View>
        {role.topTasks.map((t, i) => (
          <View key={i} style={s.tableRow}>
            <View style={{ flex: 3 }}>
              <Text style={{ fontSize: 9, fontWeight: 600 }}>{t.name}</Text>
              <Text style={[s.muted, { fontSize: 8 }]}>{t.howItHelps.slice(0, 80)}{t.howItHelps.length > 80 ? "…" : ""}</Text>
            </View>
            <Text style={{ flex: 1, textAlign: "center", fontSize: 9 }}>{t.beforeMinutes}m</Text>
            <Text style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#16a34a", fontWeight: 600 }}>{t.afterMinutes}m</Text>
            <Text style={{ flex: 1.5, fontSize: 8, color: C.muted }}>{t.tools.split(",")[0]}</Text>
          </View>
        ))}
      </View>

      <Footer agencyName={props.agencyName} siteUrl={props.siteUrl} page={pageNum} />
    </Page>
  )
}

// ── Module Deep-Dive Page ──────────────────────────────────────
function ModuleDeepDivePage({ mod, pageNum, props }: { mod: ModuleBreakdown; pageNum: number; props: TeamDeckProps }) {
  return (
    <Page size="LETTER" style={s.page}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: mod.accentColor, marginRight: 8 }} />
        <Text style={[s.kicker, { color: mod.accentColor, marginBottom: 0 }]}>{mod.label} Module</Text>
      </View>
      <Text style={s.h2}>{mod.minutesPerDay} minutes reclaimed daily across your team</Text>

      <View style={s.tableHeader}>
        <Text style={{ flex: 3 }}>Task</Text>
        <Text style={{ flex: 1 }}>Freq</Text>
        <Text style={{ flex: 1, textAlign: "center" }}>Impact</Text>
        <Text style={{ flex: 1, textAlign: "center" }}>Before</Text>
        <Text style={{ flex: 1, textAlign: "center" }}>After</Text>
        <Text style={{ flex: 1.5 }}>Tools</Text>
      </View>
      {mod.topTasks.map((t, i) => (
        <View key={i} style={s.tableRow}>
          <View style={{ flex: 3 }}>
            <Text style={{ fontSize: 9, fontWeight: 600 }}>{t.name}</Text>
            <Text style={[s.muted, { fontSize: 8 }]}>{t.howItHelps.slice(0, 70)}{t.howItHelps.length > 70 ? "…" : ""}</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 8, color: C.muted }}>{t.frequency}</Text>
          <Text style={{ flex: 1, textAlign: "center", fontSize: 9 }}>{"●".repeat(t.impactLevel)}</Text>
          <Text style={{ flex: 1, textAlign: "center", fontSize: 9 }}>{t.beforeMinutes}m</Text>
          <Text style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#16a34a", fontWeight: 600 }}>{t.afterMinutes}m</Text>
          <Text style={{ flex: 1.5, fontSize: 8, color: C.muted }}>{t.tools.split(",")[0]}</Text>
        </View>
      ))}
      <Footer agencyName={props.agencyName} siteUrl={props.siteUrl} page={pageNum} />
    </Page>
  )
}

// ── Roadmap Page ───────────────────────────────────────────────
function RoadmapPage({ phases, pageNum, props }: { phases: PhasedRoadmap; pageNum: number; props: TeamDeckProps }) {
  const phaseConfig = [
    { key: "phase1" as const, label: "Phase 1 — Weeks 1–4", subtitle: "Quick wins: low effort, high impact", color: "#dcfce7", textColor: "#166534" },
    { key: "phase2" as const, label: "Phase 2 — Month 2–3", subtitle: "Medium lift: moderate setup required", color: "#eff6ff", textColor: "#1d4ed8" },
    { key: "phase3" as const, label: "Phase 3 — Month 4+", subtitle: "Heavy lift: deep integrations", color: "#faf5ff", textColor: "#7e22ce" },
  ]
  return (
    <Page size="LETTER" style={s.page}>
      <Text style={[s.kicker, { color: C.accent }]}>Implementation</Text>
      <Text style={s.h2}>Phased rollout — ordered by effort</Text>
      {phaseConfig.map(({ key, label, subtitle, color, textColor }) => (
        <View key={key} style={{ backgroundColor: color, borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: 700, color: textColor, marginBottom: 2 }}>{label}</Text>
          <Text style={{ fontSize: 8, color: textColor, opacity: 0.8, marginBottom: 8 }}>{subtitle}</Text>
          {phases[key].slice(0, 5).map((t, i) => (
            <View key={i} style={[s.bullet, { marginBottom: 3 }]}>
              <Text style={[s.bulletDot, { color: textColor }]}>·</Text>
              <Text style={{ flex: 1, fontSize: 9, color: "#1a1a1a" }}>
                {t.name}
                <Text style={{ color: C.muted }}>{" — "}{t.beforeMinutes}m → {t.afterMinutes}m</Text>
              </Text>
            </View>
          ))}
          {phases[key].length > 5 && (
            <Text style={{ fontSize: 8, color: textColor, opacity: 0.7, marginTop: 4 }}>
              + {phases[key].length - 5} more tasks
            </Text>
          )}
        </View>
      ))}
      <Footer agencyName={props.agencyName} siteUrl={props.siteUrl} page={pageNum} />
    </Page>
  )
}

// ── CTA Page ───────────────────────────────────────────────────
function CtaPage({ props }: { props: TeamDeckProps }) {
  return (
    <Page size="LETTER" style={s.darkPage}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={s.darkKicker}>Next step</Text>
        <Text style={[s.h1, { color: C.bg, marginBottom: 16 }]}>
          Book a 30-minute{"\n"}scoping call.
        </Text>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 400 }}>
          We'll walk through this blueprint together, answer questions, and give you a fixed-price implementation proposal within 48 hours.
        </Text>
      </View>
      <View style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 16 }}>
        <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Place To Stand Agency</Text>
        <Text style={{ fontSize: 10, color: C.bg }}>{props.agencyName}</Text>
        <Text style={{ fontSize: 10, color: "#60a5fa", marginTop: 2 }}>{props.contactEmail}</Text>
        <Text style={{ fontSize: 10, color: "#60a5fa" }}>{props.siteUrl}/contact</Text>
      </View>
    </Page>
  )
}

export function TeamDeckPdf(props: TeamDeckProps) {
  const roleStart = 4
  const moduleStart = roleStart + props.roles.length
  const roadmapPageNum = moduleStart + props.topModules.length
  return (
    <Document title={`AI Team Blueprint — ${props.teamLabel}`} author={props.agencyName}>
      <CoverPage props={props} />
      <OverviewPage props={props} />
      <MethodologyPage props={props} />
      {props.roles.map((role, i) => (
        <RoleSectionPage key={role.slug} role={role} pageNum={roleStart + i} props={props} />
      ))}
      {props.topModules.map((mod, i) => (
        <ModuleDeepDivePage key={mod.moduleKey} mod={mod} pageNum={moduleStart + i} props={props} />
      ))}
      <RoadmapPage phases={props.phases} pageNum={roadmapPageNum} props={props} />
      <CtaPage props={props} />
    </Document>
  )
}
