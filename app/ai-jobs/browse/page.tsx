'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, Target, X, Zap } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
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
  Management: { routine: 'status updates, approvals, and planning loops', payoff: 'Create a clearer one-hour-back plan for leaders.' },
  'Business and Financial Operations': { routine: 'reporting, reconciliations, and document review', payoff: 'Target repetitive back-office work first.' },
  'Computer and Mathematical': { routine: 'handoffs, triage, research, and code-adjacent admin', payoff: 'Automate the drag around technical work.' },
  'Healthcare Practitioners and Technical': { routine: 'documentation, intake, and follow-up coordination', payoff: 'Return time to patient-facing work.' },
  'Educational Instruction and Library': { routine: 'prep, grading, communication, and scheduling', payoff: 'Reduce administrative load without losing quality.' },
  Legal: { routine: 'document prep, research, and deadline tracking', payoff: 'Free up more time for judgment-heavy work.' },
  'Architecture and Engineering': { routine: 'documentation, reporting, and evaluation tasks', payoff: 'Bundle recurring analysis into automation.' },
  'Sales and Related': { routine: 'follow-up, content, and CRM maintenance', payoff: 'Push low-leverage coordination off the calendar.' },
  'Life Physical and Social Science': { routine: 'research synthesis, data prep, and reporting', payoff: 'Protect deep work by automating prep steps.' },
  'Arts Design Entertainment Sports and Media': { routine: 'drafting, revisions, and publishing workflows', payoff: 'Automate production overhead around creative work.' },
  'Community and Social Service': { routine: 'notes, scheduling, and case coordination', payoff: 'Give more time back to direct service.' },
  'Construction and Extraction': { routine: 'estimating, reporting, and coordination', payoff: 'Remove routine admin from field-heavy roles.' },
};

function getOccupationStory(occupation: Occupation) {
  const fallback = { routine: 'the routine work surrounding the role', payoff: 'See where structured automation can give time back.' };
  const story = categoryStory[occupation.major_category] ?? fallback;
  const coverageHours = Number(occupation.estimated_daily_hours_saved || 0);
  const countBasedMinutes = Math.max(18, Math.round((occupation.ai_opportunities_count * 5) + (occupation.micro_tasks_count * 1.1)));
  const estimatedMinutes = coverageHours > 0 ? Math.round(coverageHours * 60) : countBasedMinutes;
  const coveragePercent = Number(occupation.coverage_percent || 0);

  return {
    ...story,
    estimatedMinutes,
    coveragePercent,
  };
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
    const initialQuery = params.get('q') ?? '';
    const initialCategory = normalizeOccupationCategory(params.get('category'));

    setSearchInput(initialQuery);
    setSearchQuery(initialQuery.trim());
    setSelectedCategory(initialCategory);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    async function fetchOccupations() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          sort: sortBy,
        });

        if (selectedCategory) params.set('category', selectedCategory);
        if (searchQuery) params.set('q', searchQuery);

        const response = await fetch(`/api/ai-jobs/browse?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { error?: string; code?: string } | null;
          throw new Error(payload?.error || `Browse request failed with status ${response.status}`);
        }

        const data: BrowseResponse = await response.json();

        if (requestId !== requestIdRef.current) {
          return;
        }

        setOccupations(data.occupations || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        console.error('Error fetching occupations:', error);
        setOccupations([]);
        setTotal(0);
        setTotalPages(1);
        setErrorMessage((error as Error).message || 'Unable to load occupations right now.');
      } finally {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    fetchOccupations();

    return () => controller.abort();
  }, [page, searchQuery, selectedCategory, sortBy]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const pageNumbers = Array.from({ length: Math.min(7, totalPages) }, (_, index) => {
    if (totalPages <= 7) return index + 1;
    if (page <= 4) return index + 1;
    if (page >= totalPages - 3) return totalPages - 6 + index;
    return page - 3 + index;
  });

  return (
    <div className="app-shell text-slate-50">
      <div className="pointer-events-none absolute left-[-8%] top-8 h-[24rem] w-[24rem] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-8%] top-28 h-[22rem] w-[22rem] rounded-full bg-cyan-500/12 blur-[120px]" />

      <main className="page-container relative z-10 pb-20 pt-12 md:pt-16">
        <section className="mb-10 max-w-4xl">
          <p className="eyebrow mb-5">Occupation explorer</p>
          <h1 className="section-title text-white">Find the roles where routine work is easiest to win back.</h1>
          <p className="section-copy mt-4 max-w-3xl">
            Filter by occupation family, scan the day-to-day work behind each role, and move into pages that connect micro-tasks to automation packages.
          </p>
        </section>

        <section className="panel mb-8 rounded-[2rem] p-5 md:p-6">
          <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_200px]" onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search job title, family, or specialty"
                className="h-14 rounded-2xl border-slate-700/80 bg-slate-950/65 px-5 pr-12 text-[1.02rem] placeholder:text-slate-500"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-4 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <Select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                setPage(1);
              }}
              className="h-14 rounded-2xl border-slate-700/80 bg-slate-950/65"
            >
              <option value="" className="bg-slate-950">
                All categories
              </option>
              {occupationCategoryOptions.map((category) => (
                <option key={category.slug} value={category.dbValue} className="bg-slate-950">
                  {category.label}
                </option>
              ))}
            </Select>

            <Select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'time_back' | 'title' | 'ai_opportunities' | 'coverage')}
              className="h-14 rounded-2xl border-slate-700/80 bg-slate-950/65"
            >
              <option value="time_back" className="bg-slate-950">
                Biggest Time Back
              </option>
              <option value="title" className="bg-slate-950">
                Sort A-Z
              </option>
              <option value="ai_opportunities" className="bg-slate-950">
                Most Opportunity Themes
              </option>
              <option value="coverage" className="bg-slate-950">
                Best Coverage Match
              </option>
            </Select>
          </form>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-800/80 pt-4">
            <div className="flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {isLoading && occupations.length === 0 ? (
                  'Loading occupations...'
                ) : (
                  <>
                    Showing <span className="font-semibold text-white">{occupations.length}</span> of{' '}
                    <span className="font-semibold text-white">{total.toLocaleString()}</span> occupations
                  </>
                )}
              </div>
              {(selectedCategory || searchInput.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    setSearchInput('');
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="font-semibold text-cyan-300 transition-colors hover:text-white"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-slate-300">
                Search updates automatically as you type
              </span>
              <span className="rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-slate-300">
                {selectedCategory ? getOccupationCategoryLabel(selectedCategory) : 'All occupation families'}
              </span>
              <span className="rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-slate-300">
                {sortBy === 'time_back'
                  ? 'Sorted by biggest time-back potential'
                  : sortBy === 'ai_opportunities'
                    ? 'Sorted by opportunity depth'
                    : sortBy === 'coverage'
                      ? 'Sorted by workflow coverage'
                      : 'Sorted alphabetically'}
              </span>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="panel rounded-[2rem] border border-amber-500/20 px-8 py-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-300">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Occupation data is temporarily unavailable</h2>
                  <p className="mt-2 max-w-2xl text-slate-300">
                    The explorer could not reach the local Postgres database. Start your local Supabase stack or point `DATABASE_URL`
                    at a running database, then refresh this page.
                  </p>
                  <p className="mt-3 text-sm text-slate-400">{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
        ) : isLoading && occupations.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <Card key={index} className="rounded-[1.5rem] bg-slate-900/55">
                <CardContent className="p-6">
                  <Skeleton className="mb-4 h-6 w-3/4 rounded-xl" />
                  <Skeleton className="mb-8 h-4 w-1/2 rounded-xl" />
                  <div className="flex gap-3">
                    <Skeleton className="h-6 w-28 rounded-xl" />
                    <Skeleton className="h-6 w-24 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : occupations.length === 0 ? (
          <div className="panel rounded-[2rem] px-8 py-16 text-center">
            <h2 className="text-2xl font-semibold text-white">No occupations found</h2>
            <p className="mt-3 text-slate-400">Try a different title, a broader keyword, or remove a category filter.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {occupations.map((occupation) => {
              const story = getOccupationStory(occupation);

              return (
                <Link key={occupation.id} href={`/ai-jobs/${occupation.slug}`} className="block h-full">
                  <Card className="h-full border-slate-800/90 bg-slate-900/55 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-slate-900/78">
                    <CardContent className="flex h-full flex-col gap-5 p-6">
                      <div>
                        <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {getOccupationCategoryLabel(occupation.major_category)}
                        </div>
                        <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">{occupation.title}</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-400">
                          {story.routine}
                        </p>
                      </div>

                      <div className="rounded-[0.95rem] border border-slate-800 bg-slate-950/55 px-4 py-3">
                        <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Modeled daily time back</div>
                        <div className="mt-2 text-3xl font-semibold text-cyan-300">
                          {story.estimatedMinutes}m
                        </div>
                      <div className="mt-1 text-sm text-slate-400">
                          {story.coveragePercent > 0
                            ? `${Math.round(story.coveragePercent)}% of modeled routine work is already mapped to workflows.`
                            : story.payoff}
                        </div>
                      </div>

                      {(occupation.recommended_packages?.[0]?.package_name || occupation.top_actions?.[0]?.action_name) && (
                        <div className="rounded-[0.95rem] border border-slate-800 bg-slate-950/35 px-4 py-3">
                          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Best next step</div>
                          {occupation.recommended_packages?.[0]?.package_name ? (
                            <div className="mt-2 text-sm font-semibold text-white">
                              {occupation.recommended_packages[0].package_name}
                            </div>
                          ) : null}
                          {occupation.top_actions?.[0]?.action_name ? (
                            <div className="mt-1 text-sm text-slate-400">
                              Starts with {occupation.top_actions[0].action_name?.toLowerCase()}.
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div className="mt-auto flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
                          <Zap className="h-4 w-4" />
                          {occupation.ai_opportunities_count || 0} opportunity themes
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300">
                          <Target className="h-4 w-4" />
                          {occupation.micro_tasks_count || 0} mapped routines
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </motion.div>
        )}

        {!isLoading && totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setPage(Math.max(1, page - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page === 1}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 text-slate-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => {
                  setPage(pageNumber);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-all ${
                  page === pageNumber
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'border border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              onClick={() => {
                setPage(Math.min(totalPages, page + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={page === totalPages}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-slate-900/70 text-slate-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/70 py-8">
        <div className="page-container flex flex-col gap-2 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Built with Next.js, PostgreSQL, and Tailwind CSS.</p>
          <p>Occupation data from the U.S. Bureau of Labor Statistics.</p>
        </div>
      </footer>
    </div>
  );
}
