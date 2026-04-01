import type { OccupationCategory } from "@/types"

export const CATEGORIES: OccupationCategory[] = [
  { slug: "management", label: "Management", dbValue: "Management" },
  { slug: "business-finance", label: "Business & Finance", dbValue: "Business and Financial Operations" },
  { slug: "computer-math", label: "Computer & Math", dbValue: "Computer and Mathematical" },
  { slug: "architecture-engineering", label: "Architecture & Engineering", dbValue: "Architecture and Engineering" },
  { slug: "life-physical-social-science", label: "Life & Physical Science", dbValue: "Life, Physical, and Social Science" },
  { slug: "community-social-service", label: "Community & Social Service", dbValue: "Community and Social Service" },
  { slug: "legal", label: "Legal", dbValue: "Legal" },
  { slug: "education", label: "Education & Training", dbValue: "Education, Training, and Library" },
  { slug: "arts-media", label: "Arts & Media", dbValue: "Arts, Design, Entertainment, Sports, and Media" },
  { slug: "healthcare-practitioners", label: "Healthcare", dbValue: "Healthcare Practitioners and Technical" },
  { slug: "healthcare-support", label: "Healthcare Support", dbValue: "Healthcare Support" },
  { slug: "food-service", label: "Food Service", dbValue: "Food Preparation and Serving Related" },
  { slug: "building-grounds", label: "Building & Grounds", dbValue: "Building and Grounds Cleaning and Maintenance" },
  { slug: "sales", label: "Sales", dbValue: "Sales and Related" },
  { slug: "office-admin", label: "Office & Admin", dbValue: "Office and Administrative Support" },
  { slug: "construction", label: "Construction", dbValue: "Construction and Extraction" },
  { slug: "installation-repair", label: "Installation & Repair", dbValue: "Installation, Maintenance, and Repair" },
  { slug: "production", label: "Production", dbValue: "Production" },
  { slug: "transportation", label: "Transportation", dbValue: "Transportation and Material Moving" },
]

export function getCategoryBySlug(slug: string): OccupationCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}

export function getCategoryByDbValue(dbValue: string): OccupationCategory | undefined {
  return CATEGORIES.find((c) => c.dbValue === dbValue)
}

export function getCategorySlug(dbValue: string): string {
  const cat = getCategoryByDbValue(dbValue)
  return cat?.slug ?? dbValue.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}
