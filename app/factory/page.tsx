import { redirect } from "next/navigation"

export default async function FactoryPage({
  searchParams,
}: {
  searchParams: Promise<{ occupation?: string; tier?: string }>
}) {
  // Factory has been unified into the blueprint flow.
  // Redirect users who have bookmarked or cached the old URL.
  const params = await searchParams
  if (params.occupation) {
    redirect(`/blueprint/${params.occupation}`)
  }
  redirect("/browse")
}
