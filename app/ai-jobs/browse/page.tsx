'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/ui/footer';
import { PageHeader } from '@/components/ui/page-header';
import { getOccupationCategoryLabel, normalizeOccupationCategory, occupationCategoryOptions } from '@/lib/ai-jobs/categories';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
  sub_category: string | null;
  coverage_percent?: number | string | null;
  estimated_daily_hours_saved?: number | string | null;
  top_actions?: Array<{ action_name?: string; action_code?: string; task_count?: number }>;
  recommended_packages?: Array<{ package_name?: string; tier?: string }>;
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

const categoryStory: Record<string, { routine: string; payoff: string }> = {
  Management: { routine: 'Status updates, approvals, and planning loops', payoff: 'Create a clearer one-hour-back plan for leaders.' },
  'Business and Financial Operations': { routine: 'Reporting, reconciliations, and document review', payoff: 'Target repetitive back-office work first.' },
  'Computer and Mathematical': { routine: 'Handoffs, triage, research, and code-adjacent admin', payoff: 'Automate the drag around technical work.' },
  'Healthcare Practitioners and Technical': { routine: 'Documentation, intake, and follow-up coordination', payoff: 'Return time to patient-facing work.' },
  'Educational Instruction and Library': { routine: 'Prep, grading, communication, and scheduling', payoff: 'Reduce administrative load without losing quality.' },
  Legal: { routine: 'Document prep, research, and deadline tracking', payoff: 'Free up more time for judgment-heavy work.' },
  'Architecture and Engineering': { routine: 'Documentation, reporting, and evaluation tasks', payoff: 'Bundle recurring analysis into automation.' },
  'Sales and Related': { routine: 'Follow-up, content, and CRM maintenance', payoff: 'Push low-leverage coordination off the calendar.' },
  'Life Physical and Social Science': { routine: 'Research synthesis, data prep, and reporting', payoff: 'Protect deep work by automating prep steps.' },
  'Arts Design Entertainment Sports and Media': { routine: 'Drafting, revisions, and publishing workflows', payoff: 'Automate production overhead around creative work.' },
  'Community and Social Service': { routine: 'Notes, scheduling, and case coordination', payoff: 'Give more time back to direct service.' },
  'Construction and Extraction': { routine: 'Estimating, reporting, and coordination', payoff: 'Remove routine admin from field-heavy roles.' },
};

function getOccupationStory(occupation: Occupation) {
  const fallback = { routine: 'The routine work surrounding the role', payoff: 'See where structured automation can give time back.' };
  const story = categoryStory[occupation.major_category] ?? fallback;
  const coverageHours = Number(occupation.estimated_daily_hours_saved || 0);
  const countBasedMinutes = Math.max(18, Math.round((occupation.ai_opportunities_count * 5) + (occupation.micro_tasks_count * 1.1)));
  const estimatedMinutes = coverageHours > 0 ? Math.round(coverageHours * 60) : countBasedMinutes;
  const coveragePercent = Number(occupation.coverage_percent || 0);
  return { ...story, estimatedMinutes, coveragePercent };
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
      <main className="page-container pb-20 pt-10 md:pt-14">
        <PageHeader
          eyebrow="Occupation explorer"
          title="Find where routine work is easiest to recover."
          description="Filter by occupation family, scan daily routines, and connect tasks to automation."
          className="mb-10 max-w-3xl"
        />

        {/* ── Filters ── */}
        <form
          onSubmit={handleSearchSubmit}
          className="mb-6 rounded-xl border border-edge-strong bg-surface-raised p-5 shadow-md"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_200px_180px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search job title, family, or specialty..."
                className="h-11 w-full rounded-lg border border-edge-strong bg-surface-raised pl-10 pr-10 text-[0.85rem] text-ink placeholder:text-ink-tertiary/50 focus:border-edge-strong focus:outline-none focus:ring-2 focus:ring-ink/5"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-tertiary hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="styled-select h-11 rounded-lg border border-edge-strong bg-surface-raised px-3 text-[0.8rem] text-ink focus:border-edge-strong focus:outline-none focus:ring-2 focus:ring-ink/5"
            >
              <option value="">All categories</option>
              {occupationCategoryOptions.map((c) => (
                <option key={c.slug} value={c.dbValue}>{c.label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="styled-select h-11 rounded-lg border border-edge-strong bg-surface-raised px-3 text-[0.8rem] text-ink focus:border-edge-strong focus:outline-none focus:ring-2 focus:ring-ink/5"
            >
              <option value="time_back">Biggest Time Back</option>
              <option value="title">Sort A-Z</option>
              <option value="ai_opportunities">Most Opportunities</option>
              <option value="coverage">Best Coverage</option>
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-edge pt-3 text-sm text-ink-secondary">
            <div>
              {isLoading && occupations.length === 0 ? (
                'Loading occupations...'
              ) : (
                <>
                  Showing <span className="font-medium text-ink">{occupations.length}</span> of{' '}
                  <span className="font-medium text-ink">{total.toLocaleString()}</span> occupations
                </>
              )}
            </div>
            {(selectedCategory || searchInput.trim()) && (
              <button
                type="button"
                onClick={() => { setSelectedCategory(''); setSearchInput(''); setSearchQuery(''); setPage(1); }}
                className="text-sm font-medium text-accent-blue hover:text-accent-blue-hover"
              >
                Clear filters
              </button>
            )}
          </div>
        </form>

        {/* ── Results ── */}
        {errorMessage ? (
          <div className="rounded-lg border border-signal-subtle bg-signal-subtle p-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-signal" />
              <div>
                <h2 className="text-lg font-semibold text-ink">Data temporarily unavailable</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  Could not reach the database. Ensure your local Supabase stack is running, then refresh.
                </p>
                <p className="mt-2 text-xs text-ink-tertiary">{errorMessage}</p>
              </div>
            </div>
          </div>
        ) : isLoading && occupations.length === 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-edge bg-surface-raised p-5">
                <Skeleton className="mb-3 h-4 w-24" />
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : occupations.length === 0 ? (
          <div className="rounded-lg border border-edge bg-surface-raised px-8 py-14 text-center">
            <h2 className="text-xl font-semibold text-ink">No occupations found</h2>
            <p className="mt-2 text-sm text-ink-secondary">Try a different title, a broader keyword, or remove a category filter.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          >
            {occupations.map((occupation) => {
              const story = getOccupationStory(occupation);
              return (
                <Link
                  key={occupation.id}
                  href={`/ai-jobs/${occupation.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-edge bg-surface-raised px-5 py-4 transition-all duration-200 hover:bg-surface-hover hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="eyebrow">
                      {getOccupationCategoryLabel(occupation.major_category)}
                    </p>
                    <h2 className="mt-1.5 text-[0.9rem] font-medium text-ink transition-colors group-hover:text-ink/70">
                      {occupation.title}
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-0.5">
                    <span className="text-[1.25rem] font-medium tracking-[-0.02em] text-ink" style={{ fontFamily: 'var(--font-heading)' }}>{story.estimatedMinutes}</span>
                    <span className="text-[0.65rem] text-ink-tertiary">m</span>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}

        {/* ── Pagination ── */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1.5">
            <button
              onClick={() => { setPage(Math.max(1, page - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-edge text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2.5 text-sm font-medium transition-colors ${
                  page === n
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-edge text-ink-secondary hover:bg-surface-sunken hover:text-ink'
                }`}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => { setPage(Math.min(totalPages, page + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-edge text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed"
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
