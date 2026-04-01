'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/ui/footer';
import { PexelsImage } from '@/components/ui/pexels-image';
import { getOccupationCategoryLabel, normalizeOccupationCategory, occupationCategoryOptions } from '@/lib/ai-jobs/categories';
import { trackEvent } from '@/lib/analytics/client';
import { TrackPageView } from '@/components/analytics/track-page-view';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
  sub_category: string | null;
  coverage_percent?: number | string | null;
  estimated_daily_hours_saved?: number | string | null;
  time_range_low?: number | string | null;
  time_range_high?: number | string | null;
  browse_estimated_minutes?: number | string | null;
  ai_opportunities_count: number;
  micro_tasks_count: number;
}

interface BrowseResponse {
  occupations: Occupation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function getEstimatedMinutes(occupation: Occupation) {
  const browseMinutes = Number(occupation.browse_estimated_minutes || 0);
  const lowRange = Number(occupation.time_range_low || 0);
  const highRange = Number(occupation.time_range_high || 0);
  const coverageHours = Number(occupation.estimated_daily_hours_saved || 0);
  if (browseMinutes > 0) {
    return Math.round(browseMinutes);
  }
  if (lowRange > 0 || highRange > 0) {
    if (lowRange > 0 && highRange > 0) {
      return Math.round((lowRange * 0.35) + (highRange * 0.65));
    }
    return Math.round(Math.max(lowRange, highRange));
  }
  if (coverageHours > 0) {
    return Math.round(coverageHours * 60 * 1.1);
  }
  return Math.max(24, Math.round((occupation.ai_opportunities_count * 7.5) + (occupation.micro_tasks_count * 2.2)));
}

function getColor(title: string) {
  const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = (hash * 37) % 360;
  return `hsl(${hue}, 25%, 45%)`;
}

export default function BrowsePage() {
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time_back' | 'title' | 'ai_opportunities' | 'coverage'>('time_back');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const requestIdRef = useRef(0);
  const pageSize = 24;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchInput(params.get('q') ?? '');
    setSearchQuery((params.get('q') ?? '').trim());
    setSelectedCategory(normalizeOccupationCategory(params.get('category')));
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setSearchQuery(searchInput.trim()), 180);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    async function fetchOccupations() {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString(), sort: sortBy });
        if (selectedCategory) params.set('category', selectedCategory);
        if (searchQuery) params.set('q', searchQuery);

        const response = await fetch(`/api/ai-jobs/browse?${params}`, { signal: controller.signal });
        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(payload?.error || `Browse request failed with status ${response.status}`);
        }
        const data: BrowseResponse = await response.json();
        if (requestId !== requestIdRef.current) return;
        setOccupations(data.occupations || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setOccupations([]); setTotal(0); setTotalPages(1);
        setErrorMessage((error as Error).message || 'Unable to load occupations right now.');
      } finally {
        if (!controller.signal.aborted && requestId === requestIdRef.current) setIsLoading(false);
      }
    }
    fetchOccupations();
    return () => controller.abort();
  }, [page, searchQuery, selectedCategory, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); setSearchQuery(searchInput.trim()); setPage(1); };

  const pageNumbers = Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="app-shell">
      <TrackPageView eventName="browse_viewed" properties={{ category: selectedCategory || null, searchQuery: searchQuery || null }} />
      {/* Hero */}
      <section className="bg-panel">
        <div className="page-container pt-8 pb-10 md:pt-10 md:pb-12">
          <div className="dark-panel-muted eyebrow">Occupation explorer</div>
          <h1
            className="dark-panel-text mt-3 font-editorial font-normal"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1, letterSpacing: '-0.035em' }}
          >
            Browse all roles
          </h1>
          <p className="dark-panel-muted mt-3 max-w-lg text-[0.85rem] leading-[1.6]">
            {isLoading ? 'Loading...' : `${total.toLocaleString()} occupations mapped. Find yours.`}
          </p>
        </div>
      </section>

      <main className="page-container py-8 md:py-10">
        {/* Filters */}
        <form
          onSubmit={handleSearchSubmit}
          className="mb-8 rounded-xl border border-edge-strong bg-surface-raised p-4 shadow-sm"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_160px]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search job title..."
                className="h-11 w-full rounded-lg border border-edge-strong bg-surface-raised pl-11 pr-10 text-[0.85rem] text-ink placeholder:text-ink-tertiary/40 focus:outline-none focus:ring-2 focus:ring-ink/5"
              />
              {searchInput && (
                <button type="button" onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-tertiary hover:text-ink" aria-label="Clear">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="styled-select h-11 rounded-lg border border-edge-strong bg-surface-raised px-3 text-[0.8rem] text-ink focus:outline-none focus:ring-2 focus:ring-ink/5"
            >
              <option value="">All categories</option>
              {occupationCategoryOptions.map((c) => (
                <option key={c.slug} value={c.dbValue}>{c.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="styled-select h-11 rounded-lg border border-edge-strong bg-surface-raised px-3 text-[0.8rem] text-ink focus:outline-none focus:ring-2 focus:ring-ink/5"
            >
              <option value="time_back">Biggest Time Back</option>
              <option value="title">Sort A-Z</option>
              <option value="ai_opportunities">Most Opportunities</option>
              <option value="coverage">Best Coverage</option>
            </select>
          </div>
          {(selectedCategory || searchInput.trim()) && (
            <div className="mt-3 flex items-center justify-between border-t border-edge pt-3">
              <span className="text-[0.78rem] text-ink-tertiary">Filtered results</span>
              <button
                type="button"
                onClick={() => { setSelectedCategory(''); setSearchInput(''); setSearchQuery(''); setPage(1); }}
                className="text-[0.78rem] font-medium text-ink-secondary hover:text-ink"
              >
                Clear filters
              </button>
            </div>
          )}
        </form>

        {/* Results */}
        {errorMessage ? (
          <div className="rounded-xl border border-signal-subtle bg-signal-subtle p-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-signal" />
              <div>
                <h2 className="text-base font-medium text-ink">Data temporarily unavailable</h2>
                <p className="mt-1 text-[0.8rem] text-ink-secondary">We hit a data issue loading the role directory. Refresh once, and if it persists we need to fix the browse API rather than your setup.</p>
              </div>
            </div>
          </div>
        ) : isLoading && occupations.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-edge bg-surface-raised">
                <Skeleton className="h-28 w-full" />
                <div className="p-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-2 h-5 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : occupations.length === 0 ? (
          <div className="rounded-xl border border-edge bg-surface-raised p-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-ink-tertiary" />
            <h3 className="text-lg font-medium text-ink">No occupations found</h3>
            <p className="mt-1 text-[0.8rem] text-ink-secondary">Try a different title or remove a filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {occupations.map((occupation, i) => {
              const minutes = getEstimatedMinutes(occupation);
              const color = getColor(occupation.title);

              return (
                <motion.div
                  key={occupation.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={`/ai-jobs/${occupation.slug}`}
                    onClick={() => trackEvent('browse_role_selected', { occupationSlug: occupation.slug, occupationTitle: occupation.title, category: occupation.major_category, searchQuery: searchQuery || null })}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-edge-strong bg-surface-raised shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <PexelsImage
                      query={occupation.title}
                      slug={occupation.slug}
                      fallbackColor={color}
                      fallbackLetter={occupation.title.charAt(0)}
                      className="h-28"
                    />

                    <div className="flex flex-1 flex-col p-4">
                      <p className="eyebrow">{getOccupationCategoryLabel(occupation.major_category)}</p>
                      <h2 className="mt-1.5 text-[0.85rem] font-medium leading-snug text-ink">
                        {occupation.title}
                      </h2>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-baseline gap-1">
                          <span className="font-editorial text-[1.1rem] tabular-nums text-ink">{minutes}</span>
                          <span className="text-[0.6rem] text-ink-tertiary">min/day</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-ink-tertiary/30 transition-all duration-300 group-hover:text-ink-tertiary group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-1.5">
            <button
              onClick={() => { setPage(Math.max(1, page - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-edge-strong text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`btn-primary inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-[0.85rem] font-medium transition-colors ${
                  page === n
                    ? 'border border-primary bg-primary'
                    : 'border border-edge-strong text-ink-secondary hover:bg-surface-sunken hover:text-ink !text-ink-secondary'
                }`}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => { setPage(Math.min(totalPages, page + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-edge-strong text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
