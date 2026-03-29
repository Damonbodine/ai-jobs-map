'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, Target, Zap } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
  minor_category: string;
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
  'Business & Finance': { routine: 'reporting, reconciliations, and document review', payoff: 'Target repetitive back-office work first.' },
  'Computer & Tech': { routine: 'handoffs, triage, research, and code-adjacent admin', payoff: 'Automate the drag around technical work.' },
  Healthcare: { routine: 'documentation, intake, and follow-up coordination', payoff: 'Return time to patient-facing work.' },
  Education: { routine: 'prep, grading, communication, and scheduling', payoff: 'Reduce administrative load without losing quality.' },
  Legal: { routine: 'document prep, research, and deadline tracking', payoff: 'Free up more time for judgment-heavy work.' },
  Engineering: { routine: 'documentation, reporting, and evaluation tasks', payoff: 'Bundle recurring analysis into automation.' },
  'Sales & Marketing': { routine: 'follow-up, content, and CRM maintenance', payoff: 'Push low-leverage coordination off the calendar.' },
  Science: { routine: 'research synthesis, data prep, and reporting', payoff: 'Protect deep work by automating prep steps.' },
  'Arts & Media': { routine: 'drafting, revisions, and publishing workflows', payoff: 'Automate production overhead around creative work.' },
  'Social Service': { routine: 'notes, scheduling, and case coordination', payoff: 'Give more time back to direct service.' },
  Construction: { routine: 'estimating, reporting, and coordination', payoff: 'Remove routine admin from field-heavy roles.' },
};

function getOccupationStory(occupation: Occupation) {
  const fallback = { routine: 'the routine work surrounding the role', payoff: 'See where structured automation can give time back.' };
  const story = categoryStory[occupation.major_category] ?? fallback;
  const estimatedMinutes = Math.max(18, Math.round((occupation.ai_opportunities_count * 5) + (occupation.micro_tasks_count * 1.1)));

  return {
    ...story,
    estimatedMinutes,
  };
}

const allCategories = [
  { name: 'All Categories', slug: '' },
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
  { name: 'Installation & Maintenance', slug: 'installation-maintenance-and-repair' },
  { name: 'Production', slug: 'production' },
  { name: 'Transportation', slug: 'transportation-and-material-moving' },
  { name: 'Protective Service', slug: 'protective-service' },
  { name: 'Food & Hospitality', slug: 'food-preparation-and-serving-related' },
  { name: 'Building & Grounds', slug: 'building-and-grounds-cleaning-and-maintenance' },
  { name: 'Personal Care', slug: 'personal-care-and-service' },
];

export default function BrowsePage() {
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return new URLSearchParams(window.location.search).get('q') ?? '';
  });
  const [sortBy, setSortBy] = useState<'title' | 'ai_opportunities'>('title');
  const [isLoading, setIsLoading] = useState(true);

  const pageSize = 24;
  const requestQuery = useMemo(() => searchQuery.trim(), [searchQuery]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOccupations() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          sort: sortBy,
        });

        if (selectedCategory) params.set('category', selectedCategory);
        if (requestQuery) params.set('q', requestQuery);

        const response = await fetch(`/api/ai-jobs/browse?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Browse request failed with status ${response.status}`);
        }

        const data: BrowseResponse = await response.json();

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
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchOccupations();

    return () => controller.abort();
  }, [page, requestQuery, selectedCategory, sortBy]);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
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
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-300" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search occupations"
                className="h-14 rounded-2xl border-slate-700/80 bg-slate-950/65 pl-12"
              />
            </div>

            <Select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                setPage(1);
              }}
              className="h-14 rounded-2xl border-slate-700/80 bg-slate-950/65"
            >
              {allCategories.map((category) => (
                <option key={category.slug} value={category.slug} className="bg-slate-950">
                  {category.name}
                </option>
              ))}
            </Select>

            <Select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'title' | 'ai_opportunities')}
              className="h-14 rounded-2xl border-slate-700/80 bg-slate-950/65"
            >
              <option value="title" className="bg-slate-950">
                Sort A-Z
              </option>
              <option value="ai_opportunities" className="bg-slate-950">
                Most AI Opportunities
              </option>
            </Select>
          </form>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-800/80 pt-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing <span className="font-semibold text-white">{occupations.length}</span> of{' '}
              <span className="font-semibold text-white">{total.toLocaleString()}</span> occupations
            </div>
            {(selectedCategory || searchQuery.trim()) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSearchQuery('');
                  setPage(1);
                }}
                className="font-semibold text-cyan-300 transition-colors hover:text-white"
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {isLoading ? (
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
            <Search className="mx-auto h-12 w-12 text-slate-600" />
            <h2 className="mt-5 text-2xl font-semibold text-white">No occupations found</h2>
            <p className="mt-3 text-slate-400">Try a different title, a broader keyword, or remove a category filter.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {occupations.map((occupation) => (
              <Link key={occupation.id} href={`/ai-jobs/${occupation.slug}`} className="block h-full">
                <Card className="h-full border-slate-800/90 bg-slate-900/55 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/30 hover:bg-slate-900/78">
                  <CardContent className="flex h-full flex-col gap-5 p-6">
                    <div>
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {occupation.major_category}
                      </div>
                      <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">{occupation.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-slate-400">
                        {getOccupationStory(occupation).routine}
                      </p>
                    </div>

                    <div className="rounded-[0.95rem] border border-slate-800 bg-slate-950/55 px-4 py-3">
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Modeled upside</div>
                      <div className="mt-2 text-3xl font-semibold text-cyan-300">
                        {getOccupationStory(occupation).estimatedMinutes}m
                      </div>
                      <div className="mt-1 text-sm text-slate-400">{getOccupationStory(occupation).payoff}</div>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
                        <Zap className="h-4 w-4" />
                        {occupation.ai_opportunities_count || 0} automation angles
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-300">
                        <Target className="h-4 w-4" />
                        {occupation.micro_tasks_count || 0} mapped micro-tasks
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
