export default function DemoLoading() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
      <div className="mb-8 text-center">
        <div className="h-8 w-72 bg-muted animate-pulse rounded-lg mx-auto mb-3" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded mx-auto" />
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        {/* Header bar skeleton */}
        <div className="h-11 bg-muted/30 border-b border-border" />

        <div className="flex min-h-[560px]">
          {/* Timeline skeleton */}
          <div className="w-52 shrink-0 border-r border-border p-4 flex flex-col gap-2">
            <div className="flex gap-1.5 mb-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-6 w-16 bg-muted animate-pulse rounded-full" />
              ))}
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>

          {/* Expanded view skeleton */}
          <div className="flex-1 p-5 flex flex-col gap-4">
            <div className="h-5 w-48 bg-muted animate-pulse rounded" />
            <div className="h-6 w-36 bg-muted animate-pulse rounded" />
            <div className="h-48 bg-muted animate-pulse rounded-xl" />
            <div className="h-48 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
