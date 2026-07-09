export default function OccupationLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="h-4 w-64 bg-muted animate-pulse rounded mb-8" />
      <div className="h-10 w-80 bg-muted animate-pulse rounded-lg mb-3" />
      <div className="h-6 w-56 bg-muted animate-pulse rounded mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="h-64 bg-muted animate-pulse rounded-2xl" />
        <div className="h-64 bg-muted animate-pulse rounded-2xl" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  )
}
