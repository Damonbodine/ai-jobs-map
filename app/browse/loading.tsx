export default function BrowseLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="h-9 w-64 bg-muted animate-pulse rounded-lg mb-2" />
      <div className="h-5 w-96 bg-muted animate-pulse rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  )
}
