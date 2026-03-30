'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
}

const quickStarts = [
  { label: 'Administrative Services Managers', slug: 'administrative-services-managers' },
  { label: 'Financial Examiners', slug: 'financial-examiners' },
  { label: 'Medical Records Specialists', slug: 'medical-records-specialists' },
  { label: 'Paralegals', slug: 'paralegals-and-legal-assistants' },
  { label: 'Credit Analysts', slug: 'credit-analysts' },
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
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl text-center"
      >
        <h1 className="font-editorial text-[clamp(2.2rem,5.5vw,3.4rem)] leading-[1.06] tracking-[-0.04em] text-ink font-normal">
          How many minutes{' '}
          <em className="font-editorial italic">could you</em>
          {' '}get&nbsp;back?
        </h1>

        <p className="mx-auto mt-6 max-w-[24rem] text-[0.9rem] leading-[1.7] text-ink-secondary">
          Search your role. See where routine work quietly takes your time — and what you could do about it.
        </p>

        {/* Search */}
        <div className="relative mx-auto mt-10 max-w-md">
          <div
            className="flex items-center gap-3 rounded-xl border border-edge-strong bg-surface-raised px-4 py-3 shadow-md transition-all duration-200 focus-within:shadow-lg focus-within:ring-2 focus-within:ring-ink/5"
            onClick={() => inputRef.current?.focus()}
          >
            <Search className="h-[18px] w-[18px] shrink-0 text-ink-tertiary" />
            <input
              ref={inputRef}
              type="text"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your job title..."
              className="w-full bg-transparent text-[0.9rem] text-ink placeholder:text-ink-tertiary/50 focus:outline-none"
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

        {/* Quick starts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {quickStarts.map((qs) => (
            <Link
              key={qs.slug}
              href={`/ai-jobs/${qs.slug}`}
              className="rounded-full border border-edge-strong/50 bg-surface-raised px-3.5 py-1.5 text-[0.75rem] text-ink-secondary shadow-sm transition-all duration-200 hover:border-edge-strong hover:text-ink hover:shadow-md"
            >
              {qs.label}
            </Link>
          ))}
        </motion.div>

        {/* Proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-20 text-[0.7rem] tracking-[0.06em] uppercase text-ink-tertiary/50"
        >
          800+ occupations &middot; U.S. Bureau of Labor Statistics
        </motion.p>
      </motion.div>
    </div>
  );
}
