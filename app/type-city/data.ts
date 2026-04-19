export type Occupation = {
  title: string
  slug: string
  minutes: number
  category: string
  color: string
}

export const OCCUPATIONS: Occupation[] = [
  { title: "Software Developer",   slug: "software-developers",            minutes: 180, category: "Computer & Math",    color: "#00E5FF" },
  { title: "Registered Nurse",     slug: "registered-nurses",              minutes: 78,  category: "Healthcare",         color: "#FF3EA5" },
  { title: "Financial Manager",    slug: "financial-managers",             minutes: 90,  category: "Business & Finance", color: "#FFD400" },
  { title: "Marketing Manager",    slug: "marketing-managers",             minutes: 112, category: "Business & Finance", color: "#FF6B00" },
  { title: "Graphic Designer",     slug: "graphic-designers",              minutes: 95,  category: "Arts & Media",       color: "#B56CFF" },
  { title: "Accountant & Auditor", slug: "accountants-and-auditors",       minutes: 141, category: "Business & Finance", color: "#00FF88" },
  { title: "Project Manager",      slug: "project-management-specialists", minutes: 120, category: "Management",         color: "#FF3EA5" },
  { title: "HR Manager",           slug: "human-resources-managers",       minutes: 85,  category: "Management",         color: "#00E5FF" },
  { title: "Civil Engineer",       slug: "civil-engineers",                minutes: 67,  category: "Engineering",        color: "#FFD400" },
  { title: "Dental Hygienist",     slug: "dental-hygienists",              minutes: 32,  category: "Healthcare",         color: "#FF6B00" },
  { title: "Lawyer",               slug: "lawyers",                        minutes: 155, category: "Legal",              color: "#B56CFF" },
  { title: "Elementary Teacher",   slug: "elementary-teachers",            minutes: 74,  category: "Education",          color: "#00FF88" },
]
