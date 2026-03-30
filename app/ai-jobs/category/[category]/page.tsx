'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Search, Zap, Users } from 'lucide-react';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
}

const categoryIcons: Record<string, string> = {
  'Management': '👔',
  'Business and Financial Operations': '💼',
  'Computer and Mathematical': '💻',
  'Architecture and Engineering': '🏗️',
  'Life Physical and Social Science': '🔬',
  'Community and Social Service': '🤝',
  'Legal': '⚖️',
  'Educational Instruction and Library': '📚',
  'Arts Design Entertainment Sports and Media': '🎨',
  'Healthcare Practitioners and Technical': '🏥',
  'Healthcare Support': '🩺',
  'Protective Service': '🛡️',
  'Food Preparation and Serving': '🍳',
  'Building and Grounds Cleaning and Maintenance': '🧹',
  'Personal Care and Service': '💇',
  'Sales and Related': '📈',
  'Office and Administrative Support': '📋',
  'Farming Fishing and Forestry': '🌾',
  'Construction and Extraction': '🔨',
  'Installation Maintenance and Repair': '🔧',
  'Production': '🏭',
  'Transportation and Material Moving': '🚚',
};

const slugToCategory: Record<string, string> = {
  'management': 'Management',
  'business-and-financial-operations': 'Business and Financial Operations',
  'computer-and-mathematical': 'Computer and Mathematical',
  'architecture-and-engineering': 'Architecture and Engineering',
  'life-physical-and-social-science': 'Life Physical and Social Science',
  'community-and-social-service': 'Community and Social Service',
  'legal': 'Legal',
  'educational-instruction-and-library': 'Educational Instruction and Library',
  'arts-design-entertainment-sports-and-media': 'Arts Design Entertainment Sports and Media',
  'healthcare-practitioners-and-technical': 'Healthcare Practitioners and Technical',
  'healthcare-support': 'Healthcare Support',
  'protective-service': 'Protective Service',
  'food-preparation-and-serving': 'Food Preparation and Serving',
  'building-and-grounds-cleaning-and-maintenance': 'Building and Grounds Cleaning and Maintenance',
  'personal-care-and-service': 'Personal Care and Service',
  'sales-and-related': 'Sales and Related',
  'office-and-administrative-support': 'Office and Administrative Support',
  'farming-fishing-and-forestry': 'Farming Fishing and Forestry',
  'construction-and-extraction': 'Construction and Extraction',
  'installation-maintenance-and-repair': 'Installation Maintenance and Repair',
  'production': 'Production',
  'transportation-and-material-moving': 'Transportation and Material Moving',
};

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const categoryName = slugToCategory[categorySlug] || categorySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    async function fetchOccupations() {
      try {
        const response = await fetch(`/api/ai-jobs/search?category=${encodeURIComponent(categoryName)}&limit=100`);
        const data = await response.json();
        setOccupations(data.results || []);
      } catch (error) {
        console.error('Error fetching occupations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOccupations();
  }, [categoryName]);

  const icon = categoryIcons[categoryName] || '📁';
  const filteredOccupations = search
    ? occupations.filter(o => o.title.toLowerCase().includes(search.toLowerCase()))
    : occupations;

  return (
    <div className="app-shell text-slate-50">
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-600/10 blur-[140px] pointer-events-none animate-pulse-glow" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] h-[30%] w-[30%] rounded-full bg-cyan-600/10 blur-[140px] pointer-events-none animate-pulse-glow" style={{ animationDuration: '9s' }} />

      <main className="page-container relative z-10 py-12 md:py-16">
        <Link href="/ai-jobs" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300 group">
          <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
          Back to Search
        </Link>

        <div className="panel mb-8 rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
            <div className="flex items-start gap-4 md:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] border border-slate-800 bg-slate-950/70 text-4xl shadow-[0_18px_50px_rgba(2,6,23,0.22)]">
                {icon}
              </div>
              <div className="max-w-3xl">
                <div className="eyebrow mb-4">Industry sector</div>
                <h1 className="section-title text-white">{categoryName}</h1>
                <p className="mt-3 max-w-2xl text-slate-400 leading-8">
                  {loading ? 'Loading occupations…' : `Browse ${occupations.length} roles in this sector and open the ones where routine work looks most ready for practical support and time back.`}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/55 px-5 py-4 text-left">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Roles in sector</div>
              <div className="mt-2 flex items-center gap-2 text-3xl font-black text-cyan-300">
                <Users className="h-5 w-5" />
                {loading ? '...' : occupations.length}
              </div>
            </div>
          </div>
        </div>

        <div className="panel mb-8 rounded-[1.8rem] p-4 md:p-5">
          <div className="relative group">
            <div className="absolute -inset-px rounded-[1.4rem] bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 opacity-0 blur-sm transition-all duration-300 group-focus-within:opacity-100" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 z-10 h-5 w-5 text-slate-500 transition-colors duration-300 group-focus-within:text-cyan-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Filter ${categoryName} occupations...`}
                className="h-14 w-full rounded-[1.4rem] border border-slate-800 bg-slate-950/70 pl-12 pr-4 text-white placeholder-slate-500 transition-all focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
          </div>
          {search && (
            <div className="mt-3 text-sm text-slate-500">
              Found <span className="font-medium text-slate-200">{filteredOccupations.length}</span> results for &quot;{search}&quot;
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 rounded-[1.25rem] border border-slate-800 bg-slate-900/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOccupations.map((occupation) => (
              <Link
                key={occupation.id}
                href={`/ai-jobs/${occupation.slug}`}
                className="group flex min-h-[112px] rounded-[1.5rem] border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-cyan-500/35 hover:bg-slate-900/80 hover:shadow-[0_22px_55px_rgba(2,6,23,0.28)]"
              >
                <div className="flex w-full items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950/75 text-slate-400 transition-all group-hover:bg-cyan-500/10 group-hover:text-cyan-300">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <span className="block text-lg font-semibold leading-snug text-white transition-colors group-hover:text-cyan-300">
                        {occupation.title}
                      </span>
                      <span className="mt-2 block text-sm text-slate-500">{occupation.major_category}</span>
                    </div>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-800 bg-slate-950/65">
                    <ChevronRight className="h-4 w-4 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredOccupations.length === 0 && (
          <div className="panel rounded-[2rem] p-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-slate-600" />
            <h3 className="mb-2 text-xl font-semibold text-white">No occupations found</h3>
            <p className="text-slate-400">
              {search ? `No results for "${search}". Try a broader term.` : "We couldn't find any occupations in this category."}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
