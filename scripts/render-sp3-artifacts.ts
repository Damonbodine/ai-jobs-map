import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { renderBlueprintPdf, renderTeamDeckPdf } from "@/lib/pdf/render"
import { PDF_MODULE_ACCENTS } from "@/lib/pdf/styles"
import { EMAIL_STYLES } from "@/lib/email/brand"
import { AGENCY, SITE } from "@/lib/site"
import { BRAND } from "@/lib/brand"
import type { TaskWithTimes } from "@/lib/pdf/team-deck-data"

const generatedAt = "July 9, 2026"
const pdfDir = join(process.cwd(), "output/pdf")
const emailDir = join(process.cwd(), "output/email")

const documentationTask: TaskWithTimes = {
  name: "Draft shift summaries from notes and system events",
  howItHelps: "AI assembles a structured first draft for manager review.",
  tools: "Document AI, EHR export",
  frequency: "daily",
  impactLevel: 5,
  effortLevel: 2,
  beforeMinutes: 32,
  afterMinutes: 6,
  moduleKey: "documentation",
}

const coordinationTask: TaskWithTimes = {
  name: "Reconcile schedule changes and notify affected staff",
  howItHelps: "AI identifies conflicts, drafts updates, and queues approvals.",
  tools: "Calendar, Messaging",
  frequency: "daily",
  impactLevel: 4,
  effortLevel: 3,
  beforeMinutes: 24,
  afterMinutes: 7,
  moduleKey: "coordination",
}

const complianceTask: TaskWithTimes = {
  name: "Collect evidence for recurring compliance reviews",
  howItHelps: "AI keeps source documents organized and flags missing evidence.",
  tools: "Policy library, File storage",
  frequency: "weekly",
  impactLevel: 4,
  effortLevel: 4,
  beforeMinutes: 18,
  afterMinutes: 6,
  moduleKey: "compliance",
}

async function renderPdfs() {
  const blueprint = await renderBlueprintPdf({
    variant: "one-pager",
    occupation: { title: "Registered Nurses", slug: "registered-nurses" },
    stats: { minutesPerDay: 78, annualValueDollars: 33208, taskCount: 14 },
    selectedTasks: [
      { name: documentationTask.name, minutesPerDay: 32 },
      { name: coordinationTask.name, minutesPerDay: 24 },
      { name: complianceTask.name, minutesPerDay: 18 },
    ],
    recommendedModules: [],
    contact: { email: "review@example.com" },
    siteUrl: SITE.url,
    agencyName: AGENCY.name,
    generatedAt,
    moduleBreakdown: [
      {
        moduleKey: "documentation",
        label: "Documentation",
        accentColor: PDF_MODULE_ACCENTS.documentation,
        minutesPerDay: 32,
        topTaskNames: [documentationTask.name],
      },
      {
        moduleKey: "coordination",
        label: "Coordination & Scheduling",
        accentColor: PDF_MODULE_ACCENTS.coordination,
        minutesPerDay: 24,
        topTaskNames: [coordinationTask.name],
      },
      {
        moduleKey: "compliance",
        label: "Compliance & Policy",
        accentColor: PDF_MODULE_ACCENTS.compliance,
        minutesPerDay: 18,
        topTaskNames: [complianceTask.name],
      },
    ],
  })

  const documentationModule = {
    moduleKey: "documentation",
    label: "Documentation",
    accentColor: PDF_MODULE_ACCENTS.documentation,
    minutesPerDay: 52,
    topTasks: [documentationTask],
  }
  const coordinationModule = {
    moduleKey: "coordination",
    label: "Coordination & Scheduling",
    accentColor: PDF_MODULE_ACCENTS.coordination,
    minutesPerDay: 35,
    topTasks: [coordinationTask],
  }
  const complianceModule = {
    moduleKey: "compliance",
    label: "Compliance & Policy",
    accentColor: PDF_MODULE_ACCENTS.compliance,
    minutesPerDay: 22,
    topTasks: [complianceTask],
  }

  const teamDeck = await renderTeamDeckPdf({
    teamLabel: "Clinic Operations Team",
    contactEmail: "review@example.com",
    contactName: "Jordan Lee",
    customRequests: ["Keep clinical approvals human-owned", "Integrate with the existing scheduling system"],
    totals: {
      totalPeople: 8,
      totalMinutesPerDay: 416,
      totalAnnualValue: 176800,
      fteEquivalents: 0.9,
      rows: [],
    },
    roles: [
      {
        title: "Registered Nurses",
        slug: "registered-nurses",
        count: 5,
        minutesPerPerson: 78,
        annualValuePerPerson: 33208,
        modules: [documentationModule, coordinationModule],
        topTasks: [documentationTask, coordinationTask],
      },
      {
        title: "Medical and Health Services Managers",
        slug: "medical-and-health-services-managers",
        count: 3,
        minutesPerPerson: 91,
        annualValuePerPerson: 40400,
        modules: [complianceModule, coordinationModule],
        topTasks: [complianceTask, coordinationTask],
      },
    ],
    topModules: [documentationModule, coordinationModule, complianceModule],
    phases: {
      phase1: [documentationTask],
      phase2: [coordinationTask],
      phase3: [complianceTask],
    },
    siteUrl: SITE.url,
    agencyName: AGENCY.name,
    generatedAt,
  })

  await writeFile(join(pdfDir, "registered-nurses-blueprint.pdf"), blueprint)
  await writeFile(join(pdfDir, "clinic-operations-team-deck.pdf"), teamDeck)
}

function emailPreview(title: string, intro: string, panel: string, route: string) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:32px;background:${BRAND.background};">
  <div data-route="${route}" style="${EMAIL_STYLES.shell}">
    <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;${EMAIL_STYLES.muted}">${SITE.name} · ${route}</p>
    <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px;">${title}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${intro}</p>
    <div style="${EMAIL_STYLES.panel}margin:0 0 16px;">${panel}</div>
    <p style="margin:0 0 18px;"><a href="${AGENCY.enquireUrl}" style="${EMAIL_STYLES.link}">Start with an audit →</a></p>
    <p style="margin:24px 0 0;font-size:12px;${EMAIL_STYLES.muted}">${SITE.name} - a project by ${AGENCY.name}</p>
  </div>
</body>
</html>`
}

async function renderEmails() {
  const previews = {
    "contact.html": emailPreview("We received your note", "Thanks for reaching out. We reply within one business day.", "Your message is saved and ready for review.", "/api/contact"),
    "inquiries.html": emailPreview("Your AI Blueprint is attached", "Share the blueprint with your team and push back on any number that does not fit reality.", "Registered Nurses · 78 minutes reclaimed daily", "/api/inquiries"),
    "one-pager.html": emailPreview("Your one-pager is attached", "The PDF summarizes the highest-leverage opportunities for this role.", "3 modules · 14 tasks · $33,208 annual value", "/api/one-pager"),
    "build-a-team-inquiry.html": emailPreview("Your team blueprint is attached", "This deck shows the compounded time-back across the team you configured.", "8 people · 0.9 FTE reclaimed · $176,800 annual value", "/api/build-a-team/inquiry"),
    "build-a-team-pdf.html": emailPreview("Your department blueprint is attached", "Use this document to review the role mix with your team or CFO.", "Clinic Operations Team · 416 minutes reclaimed daily", "/api/build-a-team/pdf"),
    "demo-lead.html": emailPreview("Here is the agent we sketched", "The custom demo turns the task you described into a concrete agent workflow.", "Documentation agent · 32 min → 6 min", "/api/demo/lead"),
  }

  await Promise.all(
    Object.entries(previews).map(([filename, html]) =>
      writeFile(join(emailDir, filename), html)
    )
  )
}

async function main() {
  await mkdir(pdfDir, { recursive: true })
  await mkdir(emailDir, { recursive: true })
  await renderPdfs()
  await renderEmails()
  console.log(`Rendered SP3 artifacts to ${join(process.cwd(), "output")}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
