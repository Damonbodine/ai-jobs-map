import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { BlueprintView } from "./blueprint-view"
import { getAllCapabilities } from "@/lib/capabilities"
import {
  getOccupationBySlug,
  getOccupationProfile,
  getOccupationTasks,
} from "@/lib/occupation-data"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Custom AI Blueprint",
  robots: { index: false, follow: true },
}

export default async function BlueprintPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params

  const occupation = await getOccupationBySlug(slug)
  if (!occupation) notFound()

  const [profile, tasks, capabilitiesByModule] = await Promise.all([
    getOccupationProfile(occupation.id),
    getOccupationTasks(occupation.id),
    getAllCapabilities(),
  ])

  return (
    <BlueprintView
      occupation={occupation as any}
      profile={profile as any}
      tasks={tasks as any[]}
      slug={slug}
      capabilitiesByModule={capabilitiesByModule}
    />
  )
}
