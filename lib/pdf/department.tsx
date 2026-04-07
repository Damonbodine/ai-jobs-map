import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import { PDF_COLORS as COLORS } from "./styles"

// Same Helvetica fallback rationale as blueprint.tsx — see that
// file's header for the full explanation. TODO in a future plan to
// vendor real Newsreader + Manrope TTFs.

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    padding: 48,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flexBasis: "48%",
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
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.fg,
  },
  statUnit: {
    fontSize: 11,
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
  tableHeader: {
    flexDirection: "row",
    borderBottom: `1 solid ${COLORS.border}`,
    paddingBottom: 6,
    marginBottom: 6,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: COLORS.muted,
    fontWeight: 600,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: `1 solid ${COLORS.border}`,
  },
  colRole: { flex: 3 },
  colCount: { flex: 1, textAlign: "center" },
  colMinutes: { flex: 1.5, textAlign: "right" },
  colValue: { flex: 1.5, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderTop: `2 solid ${COLORS.fg}`,
    marginTop: 4,
    fontWeight: 700,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 12,
    color: COLORS.accent,
    fontWeight: 600,
  },
  bulletBody: {
    flex: 1,
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

export type DepartmentPdfRow = {
  slug: string
  title: string
  count: number
  minutesPerPerson: number
  totalMinutesPerDay: number
  totalAnnualValue: number
}

export type DepartmentPdfProps = {
  teamLabel: string
  totals: {
    totalPeople: number
    totalMinutesPerDay: number
    totalAnnualValue: number
    fteEquivalents: number
  }
  rows: DepartmentPdfRow[]
  contactEmail: string
  siteUrl: string
  agencyName: string
  generatedAt: string
}

export function DepartmentPdf(props: DepartmentPdfProps) {
  return (
    <Document
      title={`AI Department Blueprint — ${props.teamLabel || "Custom team"}`}
      author={props.agencyName}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>AI DEPARTMENT BLUEPRINT</Text>
          <Text style={styles.title}>
            {props.teamLabel || "Your AI-augmented team"}
          </Text>
          <Text style={styles.subtitle}>
            Prepared by {props.agencyName} · {props.siteUrl}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>People in scope</Text>
            <Text style={styles.statValue}>{props.totals.totalPeople}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Daily time reclaimed</Text>
            <Text style={styles.statValue}>
              {Math.round(props.totals.totalMinutesPerDay)}
              <Text style={styles.statUnit}>min</Text>
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Annual value</Text>
            <Text style={styles.statValue}>
              ${Math.round(props.totals.totalAnnualValue).toLocaleString()}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Equivalent FTEs reclaimed</Text>
            <Text style={styles.statValue}>
              {props.totals.fteEquivalents}
              <Text style={styles.statUnit}>FTE</Text>
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per-role breakdown</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colRole}>Role</Text>
            <Text style={styles.colCount}>People</Text>
            <Text style={styles.colMinutes}>Min/day each</Text>
            <Text style={styles.colValue}>Annual value</Text>
          </View>
          {props.rows.map((row) => (
            <View key={row.slug} style={styles.row}>
              <Text style={styles.colRole}>{row.title}</Text>
              <Text style={styles.colCount}>{row.count}</Text>
              <Text style={styles.colMinutes}>{row.minutesPerPerson}</Text>
              <Text style={styles.colValue}>
                ${Math.round(row.totalAnnualValue).toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.colRole}>Department total</Text>
            <Text style={styles.colCount}>{props.totals.totalPeople}</Text>
            <Text style={styles.colMinutes}>
              {Math.round(props.totals.totalMinutesPerDay)}
            </Text>
            <Text style={styles.colValue}>
              ${Math.round(props.totals.totalAnnualValue).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next steps</Text>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>1.</Text>
            <Text style={styles.bulletBody}>
              Review this with your team. The numbers come from public BLS
              data — your lived reality will refine them in either direction.
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>2.</Text>
            <Text style={styles.bulletBody}>
              Identify which roles in this mix have the highest leverage. The
              FTE-equivalent column is usually a better signal than total
              minutes.
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>3.</Text>
            <Text style={styles.bulletBody}>
              Book a 30-minute scoping call at {props.siteUrl}/contact when
              you&apos;re ready to talk about a real implementation.
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
