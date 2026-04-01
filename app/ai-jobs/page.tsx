'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/ui/footer';
import { trackEvent } from '@/lib/analytics/client';
import { TrackPageView } from '@/components/analytics/track-page-view';
import { TrackedLink } from '@/components/analytics/tracked-link';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
}

const quickStarts = [
  { label: 'Accountants', slug: 'accountants-and-auditors' },
  { label: 'Software Developers', slug: 'software-developers' },
  { label: 'Registered Nurses', slug: 'registered-nurses' },
  { label: 'Project Managers', slug: 'project-management-specialists' },
  { label: 'Paralegals', slug: 'paralegals-and-legal-assistants' },
  { label: 'Electricians', slug: 'electricians' },
];

const coverageCategories = [
  'Management',
  'Healthcare',
  'Construction',
  'Education',
  'Finance',
  'Operations',
];

export default function AIJobsLanding() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Occupation[]>([]);
  const [total, setTotal] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

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
    <div className="app-shell flex min-h-[calc(100vh-65px)] flex-col">
      <TrackPageView eventName="landing_viewed" />
      <section className="relative overflow-hidden bg-panel px-5 py-18 text-center md:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-accent-blue/12 blur-3xl" />
          <div className="absolute bottom-0 right-[12%] h-56 w-56 rounded-full bg-white/6 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-3xl text-center"
        >
          <div className="eyebrow dark-panel-muted">Find your time-back wedge</div>
          <h1 className="mt-4 font-editorial text-[clamp(2.5rem,6vw,5rem)] leading-[0.98] tracking-[-0.055em] text-white font-normal">
            How many minutes{' '}
            <em className="font-editorial italic">could you</em>
            {' '}get&nbsp;back?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[1rem] leading-8 text-[#d8d1c8]">
            Search your role to see where routine work is stealing time, then move straight into the product package that best fits the job.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-[0.82rem] uppercase tracking-[0.18em] text-[#b9b0a5]">
            Search across 800+ occupations
          </p>

          <div className="relative mx-auto mt-9 max-w-2xl">
            <div
              className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/96 px-5 py-4 shadow-2xl transition-all duration-200 focus-within:ring-2 focus-within:ring-white/30"
            >
              <Search className="h-4 w-4 shrink-0 text-ink-tertiary" />
              <input
                type="text"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your job title..."
                className="w-full bg-transparent text-[0.95rem] text-ink placeholder:text-ink-tertiary/40 focus:outline-none"
                autoComplete="off"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
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
                          onClick={() => trackEvent('landing_role_selected', { query, occupationSlug: o.slug, occupationTitle: o.title, source: 'search_results' })}
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
                        <TrackedLink
                          href={`/ai-jobs/browse?q=${encodeURIComponent(query)}`}
                          eventName="landing_browse_results_clicked"
                          eventProps={{ query, totalResults: total }}
                          className="mt-1 flex items-center justify-center rounded-lg px-4 py-2.5 text-[0.8rem] font-medium text-accent-blue transition-colors hover:bg-accent-blue-subtle"
                        >
                          See all {total} results
                        </TrackedLink>
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

          <div className="mt-6">
            <p className="text-[0.75rem] font-medium uppercase tracking-[0.18em] text-[#b9b0a5]">
              Popular examples
            </p>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2.5">
            {quickStarts.map((start, index) => (
              <motion.div
                key={start.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (index * 0.05), duration: 0.4 }}
              >
                <TrackedLink
                  href={`/ai-jobs/${start.slug}`}
                  eventName="landing_role_selected"
                  eventProps={{ occupationSlug: start.slug, occupationTitle: start.label, source: 'quick_start' }}
                  className="pill-dark rounded-full border px-4 py-2 text-[0.82rem] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors"
                >
                  {start.label}
                </TrackedLink>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {coverageCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.14em] text-[#cfc5b8]"
              >
                {category}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <TrackedLink
              href="/products"
              eventName="landing_products_clicked"
              className="group inline-flex items-center gap-2 rounded-xl border border-white/14 bg-white px-5 py-3 text-[0.85rem] font-medium text-ink transition-all hover:bg-[#f2ede7]"
            >
              See the products
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </TrackedLink>
            <TrackedLink
              href="/ai-jobs/browse"
              eventName="landing_browse_clicked"
              className="btn-dark-secondary inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-[0.85rem] font-medium transition-colors"
            >
              Browse 800+ roles
            </TrackedLink>
          </div>

          <p className="mt-9 text-[0.8rem] text-[#b9b0a5]">
            Built from public occupation data and our own task-level analysis across 800+ roles.
          </p>
        </motion.div>
      </section>

      <section className="page-container -mt-7 pb-16 md:-mt-8">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            { title: 'Search your role', desc: 'Start with the work someone actually does every day.' },
            { title: 'See the time-back', desc: 'Focus on routines with the clearest recovery potential.' },
            { title: 'Choose a package', desc: 'Move into the product that fits the job and team.' },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.6rem] border border-edge bg-surface-raised p-5 shadow-md"
            >
              <p className="eyebrow">How it works</p>
              <h2 className="mt-3 text-[1rem] font-semibold text-ink">{item.title}</h2>
              <p className="mt-1.5 text-[0.8rem] leading-[1.6] text-ink-tertiary">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
