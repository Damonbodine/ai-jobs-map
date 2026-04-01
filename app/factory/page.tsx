import { Suspense } from "react"
import { FactoryWizard } from "./factory-wizard"
import { Skeleton } from "@/components/ui/skeleton"

export default function FactoryPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <FactoryWizard />
    </Suspense>
  )
}
