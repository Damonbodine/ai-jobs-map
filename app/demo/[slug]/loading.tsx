// app/demo/[slug]/loading.tsx
export default function DemoSlugLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
        <div className="mb-8">
          <div className="h-4 w-32 bg-muted rounded mb-2" />
          <div className="h-8 w-64 bg-muted rounded mb-2" />
          <div className="h-5 w-96 bg-muted rounded" />
        </div>
        <div className="bg-white rounded-xl border border-border h-[500px]" />
      </div>
    </main>
  )
}
