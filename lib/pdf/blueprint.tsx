import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

// PDF intentionally uses react-pdf's built-in Helvetica family rather
// than registering Newsreader / Manrope from a CDN. Google Fonts'
// gstatic URLs are versioned and unstable for hardcoded use, and a
// 404 on font fetch fails the entire renderToBuffer call — losing the
// PDF attachment for an otherwise-successful submission. The two-
// writes-no-silent-failure pattern catches it (the lead row still
// lands), but the user gets an email with no attachment.
//
// TODO (future plan): vendor TTFs of Newsreader (heading) + Manrope
// (body) into /public/fonts and Font.register from local file:// or
// imported binary URLs. Then we can match the site's brand typography
// in the PDF without depending on a third-party CDN at runtime.

import { PDF_COLORS as COLORS } from "./styles"

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    padding: 48,
    // No fontFamily — react-pdf defaults to its built-in Helvetica.
    // See file header for the rationale and the vendor-fonts TODO.
    fontSize: 10,
    color: COLORS.fg,
    lineHeight: 1.5,
  },
  header: {
    borderBottom: `1 solid ${COLORS.border}`,
    paddingBottom: 16,
    marginBottom: 24,
  },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: COLORS.accent,
    fontWeight: 600,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: COLORS.fg,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 1.4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 14,
    border: `1 solid ${COLORS.border}`,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: COLORS.muted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.fg,
  },
  statUnit: {
    fontSize: 10,
    color: COLORS.muted,
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    color: COLORS.fg,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 10,
    color: COLORS.accent,
    fontWeight: 600,
  },
  bulletBody: {
    flex: 1,
    color: COLORS.fg,
  },
  moduleCard: {
    backgroundColor: COLORS.cardBg,
    border: `1 solid ${COLORS.border}`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  moduleName: {
    fontWeight: 600,
    fontSize: 11,
    marginBottom: 3,
  },
  moduleBlurb: {
    color: COLORS.muted,
    fontSize: 9,
  },
  calloutCard: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 4,
  },
  calloutBody: {
    fontSize: 10,
    color: COLORS.fg,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTop: `1 solid ${COLORS.border}`,
    paddingTop: 12,
    fontSize: 8,
    color: COLORS.muted,
    flexDirection: "row",
    justifyContent: "space-between",
  },
})

export type BlueprintPdfProps = {
  variant: "builder" | "one-pager"
  occupation: {
    title: string
    slug: string
  }
  stats: {
    minutesPerDay: number
    annualValueDollars: number
    taskCount: number
  }
  selectedTasks: Array<{
    name: string
    minutesPerDay: number
  }>
  recommendedModules: Array<{
    name: string
    blurb: string
  }>
  // Only set when variant === "builder"
  tier?: {
    label: string
    basePrice: number
  }
  teamSize?: string
  customRequests?: string[]
  contact: {
    name?: string
    email: string
  }
  siteUrl: string
  agencyName: string
  generatedAt: string // ISO date string
}

export function BlueprintPdf(props: BlueprintPdfProps) {
  const variantLabel =
    props.variant === "builder"
      ? "CUSTOM AI ASSISTANT BLUEPRINT"
      : "AI TIME-BACK ONE-PAGER"

  return (
    <Document
      title={`AI Blueprint — ${props.occupation.title}`}
      author={props.agencyName}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{variantLabel}</Text>
          <Text style={styles.title}>{props.occupation.title}</Text>
          <Text style={styles.subtitle}>
            Prepared by {props.agencyName} · {props.siteUrl}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Daily time reclaimed</Text>
            <Text style={styles.statValue}>
              {props.stats.minutesPerDay}
              <Text style={styles.statUnit}>min</Text>
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Annual value per person</Text>
            <Text style={styles.statValue}>
              ${Math.round(props.stats.annualValueDollars).toLocaleString()}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tasks automatable</Text>
            <Text style={styles.statValue}>{props.stats.taskCount}</Text>
          </View>
        </View>

        {props.variant === "builder" && props.tier ? (
          <View style={styles.calloutCard}>
            <Text style={styles.calloutTitle}>
              Recommended engagement: {props.tier.label} · starting at $
              {props.tier.basePrice.toLocaleString()}
            </Text>
            <Text style={styles.calloutBody}>
              Custom AI assistant implementation including modules, tools,
              integrations, and human checkpoints.
            </Text>
            {props.teamSize ? (
              <Text style={[styles.calloutBody, { marginTop: 4 }]}>
                Team size selected: {props.teamSize}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {props.variant === "builder"
              ? "Tasks your assistant will handle"
              : "Top automation opportunities"}
          </Text>
          {props.selectedTasks.slice(0, 12).map((task, i) => (
            <View key={`${i}-${task.name}`} style={styles.bullet}>
              <Text style={styles.bulletDot}>·</Text>
              <Text style={styles.bulletBody}>
                {task.name}{" "}
                <Text style={{ color: COLORS.muted }}>
                  — {task.minutesPerDay} min/day
                </Text>
              </Text>
            </View>
          ))}
        </View>

        {props.recommendedModules.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended modules</Text>
            {props.recommendedModules.slice(0, 6).map((mod) => (
              <View key={mod.name} style={styles.moduleCard}>
                <Text style={styles.moduleName}>{mod.name}</Text>
                <Text style={styles.moduleBlurb}>{mod.blurb}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {props.variant === "builder" &&
        props.customRequests &&
        props.customRequests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your custom requests</Text>
            {props.customRequests.map((req, i) => (
              <View key={`${i}-${req.slice(0, 10)}`} style={styles.bullet}>
                <Text style={styles.bulletDot}>·</Text>
                <Text style={styles.bulletBody}>{req}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next steps</Text>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>1.</Text>
            <Text style={styles.bulletBody}>
              Review this blueprint with your team — it&apos;s meant to be
              shared, annotated, and pushed back on.
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>2.</Text>
            <Text style={styles.bulletBody}>
              {props.variant === "builder"
                ? "We'll follow up within one business day to schedule a scoping call."
                : "When you're ready to talk about a real build, book a scoping call at " +
                  props.siteUrl +
                  "/contact."}
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>3.</Text>
            <Text style={styles.bulletBody}>
              If this looks wrong for your role — tell us. The numbers are
              derived from public data; your lived reality is better.
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            {props.agencyName} · {props.siteUrl}
          </Text>
          <Text>Generated {props.generatedAt}</Text>
        </View>
      </Page>
    </Document>
  )
}
