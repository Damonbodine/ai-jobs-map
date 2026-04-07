"use client"

import { useEffect, useRef, useState } from "react"
import { Search, Loader2 } from "lucide-react"

type SearchResult = {
  id: number
  title: string
  slug: string
  major_category: string | null
}

export function RoleSearch({
  onPick,
}: {
  onPick: (slug: string, title: string) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Debounced search against the existing /api/occupations/search.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const id = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/occupations/search?q=${encodeURIComponent(query.trim())}`
        )
        const body = await res.json().catch(() => ({ results: [] }))
        setResults(Array.isArray(body.results) ? body.results : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => window.clearTimeout(id)
  }, [query])

  // Click-outside to close.
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    window.addEventListener("mousedown", handle)
    return () => window.removeEventListener("mousedown", handle)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          id="role-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder='Try "Software Developer" or "Nurse"'
          className="w-full rounded-lg border border-border bg-background pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
        />
        {loading ? (
          <Loader2 className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
        ) : null}
      </div>

      {open && results.length > 0 ? (
        <ul className="absolute left-0 right-0 mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-card shadow-lg z-10">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(r.slug, r.title)
                  setQuery("")
                  setResults([])
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <span className="text-foreground">{r.title}</span>
                {r.major_category ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {r.major_category}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
