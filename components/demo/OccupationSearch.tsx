"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

type Result = { slug: string; title: string }

export function OccupationSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/demo/search?q=${encodeURIComponent(query)}`)
        const data: Result[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [query])

  function handleSelect(slug: string) {
    setOpen(false)
    setQuery("")
    router.push(`/demo/${slug}`)
  }

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-cyan-400 focus-within:border-cyan-400 transition-all">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any job title — Nurse, Engineer, Teacher..."
          className="flex-1 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-400"
          aria-label="Search occupations"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {open && (
        <ul
          role="listbox"
          className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
        >
          {results.map((r) => (
            <li key={r.slug}>
              <button
                role="option"
                aria-selected={false}
                onClick={() => handleSelect(r.slug)}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                {r.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
