// app/demo/[slug]/loading.tsx
export default function DemoSlugLoading() {
  return (
    <main className="min-h-screen bg-[#fafaf7]">
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
        <div className="mb-8">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
          <div className="h-5 w-96 bg-gray-100 rounded" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 h-[500px]" />
      </div>
    </main>
  )
}
