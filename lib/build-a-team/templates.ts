import type { CartRow } from "./url-state"

export type Template = {
  key: string
  name: string
  blurb: string
  // Used as the URL `?template=<key>` shortcut and to label the chip.
  // Cart contents are real BLS occupation slugs (verified to exist
  // in the live database).
  cart: CartRow[]
}

export const TEMPLATES: Template[] = [
  {
    key: "clinic",
    name: "Small medical clinic",
    blurb:
      "A typical 3-physician practice. Mix of clinical and front-office work.",
    cart: [
      { slug: "registered-nurses", count: 3 },
      { slug: "medical-secretaries-and-administrative-assistants", count: 2 },
      { slug: "bookkeeping-accounting-and-auditing-clerks", count: 1 },
    ],
  },
  {
    key: "saas-startup",
    name: "Early-stage SaaS startup",
    blurb:
      "Seed-to-Series-A team building a B2B product. Heavy on engineering and customer-facing roles.",
    cart: [
      { slug: "software-developers", count: 4 },
      { slug: "marketing-managers", count: 1 },
      { slug: "customer-service-representatives", count: 1 },
      { slug: "project-management-specialists", count: 1 },
    ],
  },
  {
    key: "marketing-agency",
    name: "Marketing agency",
    blurb:
      "Mid-sized creative shop. Mix of strategy, design, and account management.",
    cart: [
      { slug: "marketing-managers", count: 2 },
      { slug: "graphic-designers", count: 3 },
      { slug: "project-management-specialists", count: 1 },
      { slug: "accountants-and-auditors", count: 1 },
    ],
  },
  {
    key: "law-firm",
    name: "Boutique law firm",
    blurb:
      "Small partnership focused on transactional work. Heavy document and intake load.",
    cart: [
      { slug: "lawyers", count: 3 },
      { slug: "paralegals-and-legal-assistants", count: 2 },
      { slug: "medical-secretaries-and-administrative-assistants", count: 1 },
      { slug: "bookkeeping-accounting-and-auditing-clerks", count: 1 },
    ],
  },
  {
    key: "construction",
    name: "Construction company",
    blurb:
      "Field-and-office hybrid. Construction managers coordinating crews + back-office admin.",
    cart: [
      { slug: "construction-managers", count: 2 },
      { slug: "project-management-specialists", count: 1 },
      { slug: "bookkeeping-accounting-and-auditing-clerks", count: 1 },
      { slug: "customer-service-representatives", count: 1 },
    ],
  },
]

export function findTemplate(key: string | null | undefined): Template | null {
  if (!key) return null
  return TEMPLATES.find((t) => t.key === key) ?? null
}
