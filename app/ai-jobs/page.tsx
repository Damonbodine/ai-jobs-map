'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/ui/footer';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
}

const categories = [
  { name: 'Management', slug: 'management' },
  { name: 'Business & Finance', slug: 'business-and-financial-operations' },
  { name: 'Computer & Tech', slug: 'computer-and-mathematical' },
  { name: 'Healthcare', slug: 'healthcare-practitioners-and-technical' },
  { name: 'Education', slug: 'educational-instruction-and-library' },
  { name: 'Legal', slug: 'legal' },
  { name: 'Engineering', slug: 'architecture-and-engineering' },
  { name: 'Sales & Marketing', slug: 'sales-and-related' },
  { name: 'Science', slug: 'life-physical-and-social-science' },
  { name: 'Arts & Media', slug: 'arts-design-entertainment-sports-and-media' },
  { name: 'Social Service', slug: 'community-and-social-service' },
  { name: 'Construction', slug: 'construction-and-extraction' },
  { name: 'Office & Admin', slug: 'office-and-administrative-support' },
  { name: 'Healthcare Support', slug: 'healthcare-support' },
  { name: 'Production', slug: 'production' },
  { name: 'Transportation', slug: 'transportation-and-material-moving' },
];

export default function AIJobsLanding() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Occupation[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setTotal(0); setSearched(false); return; }
    setSearching(true); setSearched(true);
    try {
      const res = await fetch(`/api/ai-jobs/search?q=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setResults(data.results || []); setTotal(data.total || 0);
    } catch { setResults([]); setTotal(0); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => performSearch(query), 220);
    return () => clearTimeout(t);
  }, [performSearch, query]);

  return (
    <div className="app-shell">
      {/* ── Hero + Search ── */}
      <section className="flex min-h-[55vh] flex-col items-center justify-center px-5 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[28rem] text-center"
        >
          <h1 className="font-editorial text-[clamp(2.2rem,5.5vw,3.4rem)] leading-[1.06] tracking-[-0.04em] text-ink font-normal">
            How many minutes{' '}
            <em className="font-editorial italic">could you</em>
            {' '}get&nbsp;back?
          </h1>

          {/* Search */}
          <div className="relative mx-auto mt-8">
            <div
              className="flex items-center gap-3 rounded-xl border border-edge-strong bg-surface-raised px-4 py-3 shadow-md transition-all duration-200 focus-within:shadow-lg focus-within:ring-2 focus-within:ring-ink/5"
              onClick={() => inputRef.current?.focus()}
            >
              <Search className="h-4 w-4 shrink-0 text-ink-tertiary" />
              <input
                ref={inputRef}
                type="text"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your job title..."
                className="w-full bg-transparent text-[0.9rem] text-ink placeholder:text-ink-tertiary/40 focus:outline-none"
                autoComplete="off"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  className="shrink-0 rounded-full p-1 text-ink-tertiary transition-colors hover:text-ink hover:bg-surface-sunken"
                  aria-label="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {query.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[22rem] overflow-y-auto rounded-xl border border-edge-strong bg-surface-raised shadow-lg"
                >
                  {searching ? (
                    <div className="p-2 space-y-px">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-lg p-3">
                          <Skeleton className="h-4 w-3/4 rounded" />
                          <Skeleton className="mt-2 h-3 w-1/3 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : results.length > 0 ? (
                    <div className="p-1.5">
                      {results.map((o) => (
                        <Link
                          key={o.id}
                          href={`/ai-jobs/${o.slug}`}
                          className="flex items-center justify-between gap-3 rounded-lg px-3.5 py-3 text-left transition-colors hover:bg-surface-sunken"
                        >
                          <div className="min-w-0">
                            <p className="text-[0.85rem] font-medium text-ink">{o.title}</p>
                            <p className="mt-0.5 text-[0.72rem] text-ink-tertiary">{o.major_category}</p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-tertiary/40" />
                        </Link>
                      ))}
                      {total > 6 && (
                        <Link
                          href={`/ai-jobs/browse?q=${encodeURIComponent(query)}`}
                          className="mt-1 flex items-center justify-center rounded-lg px-4 py-2.5 text-[0.8rem] font-medium text-accent-blue transition-colors hover:bg-accent-blue-subtle"
                        >
                          See all {total} results
                        </Link>
                      )}
                    </div>
                  ) : searched ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-[0.85rem] font-medium text-ink">No matches</p>
                      <p className="mt-1.5 text-[0.75rem] text-ink-tertiary">
                        Try &ldquo;engineer&rdquo;, &ldquo;analyst&rdquo;, or &ldquo;manager&rdquo;
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-3 text-[0.78rem] text-ink-tertiary">
            800+ occupations mapped from the U.S. Bureau of Labor Statistics
          </p>
        </motion.div>
      </section>

      {/* ── Category Directory ── */}
      <section className="page-container py-16 md:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-editorial text-[clamp(1.3rem,2.5vw,1.75rem)] font-normal tracking-[-0.02em] text-ink">
              Browse by category
            </h2>
            <p className="mt-1 text-[0.8rem] text-ink-tertiary">
              Or explore an entire occupation family.
            </p>
          </div>
          <Link
            href="/ai-jobs/browse"
            className="shrink-0 text-[0.8rem] font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            View all →
          </Link>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-edge-strong bg-edge-strong sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/ai-jobs/category/${cat.slug}`}
              className="group flex items-center justify-between bg-surface-raised px-5 py-4 transition-colors hover:bg-surface-hover"
            >
              <span className="text-[0.85rem] font-medium text-ink group-hover:text-ink/70 transition-colors">
                {cat.name}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-ink-tertiary/30 transition-all group-hover:text-ink-tertiary group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
