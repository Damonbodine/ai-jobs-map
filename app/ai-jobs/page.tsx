'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Code,
  FlaskConical,
  HardHat,
  HeartHandshake,
  Loader2,
  Palette,
  Scale,
  Search,
  Sparkles,
  Stethoscope,
  TrendingUp,
  X,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
}

interface SearchResponse {
  results: Occupation[];
  total: number;
}

const majorCategories = [
  { name: 'Management', slug: 'management', icon: Building2 },
  { name: 'Business & Finance', slug: 'business-and-financial-operations', icon: TrendingUp },
  { name: 'Computer & Tech', slug: 'computer-and-mathematical', icon: Code },
  { name: 'Healthcare', slug: 'healthcare-practitioners-and-technical', icon: Stethoscope },
  { name: 'Education', slug: 'educational-instruction-and-library', icon: BookOpen },
  { name: 'Legal', slug: 'legal', icon: Scale },
  { name: 'Engineering', slug: 'architecture-and-engineering', icon: HardHat },
  { name: 'Sales & Marketing', slug: 'sales-and-related', icon: TrendingUp },
  { name: 'Science', slug: 'life-physical-and-social-science', icon: FlaskConical },
  { name: 'Arts & Media', slug: 'arts-design-entertainment-sports-and-media', icon: Palette },
  { name: 'Social Service', slug: 'community-and-social-service', icon: HeartHandshake },
  { name: 'Construction', slug: 'construction-and-extraction', icon: HardHat },
];

export default function AIJobsLanding() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Occupation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setTotalResults(0);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/ai-jobs/search?q=${encodeURIComponent(query)}&limit=6`);
      const data: SearchResponse = await response.json();
      setSearchResults(data.results || []);
      setTotalResults(data.total || 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [performSearch, searchQuery]);

  const categoryVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35 },
    },
  };

  return (
    <div className="app-shell text-slate-50">
      <div className="pointer-events-none absolute left-[-10%] top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-500/12 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-6%] top-28 h-[22rem] w-[22rem] rounded-full bg-cyan-500/12 blur-[120px]" />

      <main className="page-container relative z-10 pb-20 pt-12 md:pt-16">
        <section className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
          <div className="max-w-3xl pt-4">
            <div className="eyebrow mb-6">
              <Sparkles className="h-4 w-4" />
              Reclaim one focused hour a day
            </div>

            <h1 className="mb-6 max-w-4xl text-[clamp(2.8rem,6vw,5.5rem)] font-black leading-[0.94] tracking-[-0.05em] text-white">
              See where routine work quietly steals time from your day.
            </h1>

            <p className="mb-8 max-w-2xl text-[clamp(1.05rem,1.8vw,1.3rem)] leading-[1.8] text-slate-400">
              Search 800+ occupations to understand the routines behind each role, spot the support opportunities most likely to lighten the load, and connect them to products designed to give people at least one hour back.
            </p>

            <form action="/ai-jobs/browse" className="relative">
              <div className="panel relative overflow-hidden rounded-[1.75rem] border border-white/8 p-2.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3 rounded-[1.15rem] bg-slate-950/78 px-4 py-3.5">
                    <Search className="h-5 w-5 shrink-0 text-cyan-300" />
                    <input
                      type="text"
                      name="q"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search job titles, fields, or roles"
                      className="w-full bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    {searchQuery ? (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center rounded-[1.15rem] bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-emerald-400 hover:to-cyan-400"
                  >
                    Browse Results
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {searchQuery.trim() ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="panel custom-scrollbar absolute left-0 right-0 top-full z-20 mt-3 max-h-[24rem] overflow-y-auto rounded-[1.5rem] border border-slate-700/80"
                  >
                    {isSearching ? (
                      <div className="space-y-3 p-4">
                        <Skeleton className="h-14 w-full rounded-2xl" />
                        <Skeleton className="h-14 w-full rounded-2xl" />
                        <Skeleton className="h-14 w-2/3 rounded-2xl" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        <div className="border-b border-slate-800 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Top matches
                        </div>
                        {searchResults.map((occupation) => (
                          <Link
                            key={occupation.id}
                            href={`/ai-jobs/${occupation.slug}`}
                            className="flex items-center justify-between gap-4 border-b border-slate-800/80 px-5 py-4 transition-colors hover:bg-slate-800/60 last:border-b-0"
                          >
                            <div>
                              <div className="font-semibold text-white">{occupation.title}</div>
                              <div className="mt-1 text-sm text-slate-400">{occupation.major_category}</div>
                            </div>
                            <ArrowRight className="h-5 w-5 shrink-0 text-slate-500" />
                          </Link>
                        ))}
                        <div className="border-t border-slate-800/80 p-3">
                          <Link
                            href={`/ai-jobs/browse?q=${encodeURIComponent(searchQuery)}`}
                            className="flex items-center justify-center rounded-xl bg-slate-950/70 px-4 py-3 text-sm font-semibold text-cyan-300 transition-colors hover:bg-slate-800 hover:text-white"
                          >
                            View all {totalResults} result{totalResults === 1 ? '' : 's'}
                          </Link>
                        </div>
                      </div>
                    ) : hasSearched ? (
                      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                        <Search className="h-8 w-8 text-slate-600" />
                        <div className="text-lg font-semibold text-white">No matches found</div>
                        <p className="max-w-sm text-sm text-slate-400">
                          Try a broader title like “engineer”, “analyst”, or “manager”.
                        </p>
                      </div>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </form>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="panel overflow-hidden rounded-[2.25rem] lg:ml-4"
          >
            <div className="relative aspect-[4/5] min-h-[24rem] sm:aspect-[16/11] lg:aspect-[4/5]">
              <Image
                src="https://images.unsplash.com/photo-1542626991-cbc4e32524cc?q=80&w=1400&auto=format&fit=crop"
                alt="Planning board with notes representing workflow transformation"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/10" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="rounded-[1.6rem] border border-white/8 bg-slate-950/68 p-5 backdrop-blur-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    What you get
                  </p>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {[
                      'Map the routines behind the role',
                      'Prioritize time-back opportunities',
                      'Bundle tasks into support systems',
                      'Show a credible one-hour-back path',
                    ].map((item) => (
                      <div key={item} className="rounded-[1.1rem] border border-slate-800/70 bg-slate-900/40 px-4 py-3 text-sm leading-6 text-slate-200">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard value="826+" title="Occupations" description="Mapped across the labor market" colorClass="text-emerald-400" delay={0.1} />
          <StatCard value="22" title="Market Sectors" description="From finance to engineering" colorClass="text-cyan-400" delay={0.2} />
          <StatCard value="7" title="Support Themes" description="Ways AI can lighten daily work" colorClass="text-purple-400" delay={0.3} />
          <StatCard value="10k+" title="Workflow Clues" description="Signals from tasks and routines" colorClass="text-orange-400" delay={0.4} />
        </section>

        <section className="mt-18">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="section-title text-white">Explore by industry sector</h2>
              <p className="section-copy mt-3">
                Start broad, then narrow into specific occupations with task data, support themes,
                and practical upskilling direction.
              </p>
            </div>

            <Link
              href="/ai-jobs/browse"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition-colors hover:text-white"
            >
              Browse every occupation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {majorCategories.map((category, index) => {
              const Icon = category.icon;

              return (
                <motion.div
                  key={category.slug}
                  variants={categoryVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link href={`/ai-jobs/category/${category.slug}`} className="block h-full">
                    <Card className="h-full rounded-[1.75rem] border-slate-800/90 bg-slate-900/55 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-slate-900/75">
                      <CardContent className="flex h-full flex-col gap-5 p-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                          <Icon className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            Browse roles, compare tasks, and see where AI can support this sector.
                          </p>
                        </div>
                        <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
                          Explore sector
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/70 py-8">
        <div className="page-container flex flex-col gap-3 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            AI Jobs Map
          </div>
          <p>Data sourced from the U.S. Bureau of Labor Statistics and internal workflow research.</p>
        </div>
      </footer>
    </div>
  );
}
