'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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
  categories: { name: string; count: number }[];
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'ai_opportunities'>('title');
  const [isLoading, setIsLoading] = useState(true);

  const pageSize = 24;

  const fetchOccupations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sort: sortBy,
      });
      if (selectedCategory) params.set('category', selectedCategory);
      if (searchQuery) params.set('q', searchQuery);

      const response = await fetch(`/api/ai-jobs/browse?${params}`);
      const data: BrowseResponse = await response.json();
      
      setOccupations(data.occupations || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching occupations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    fetchOccupations();
  }, [fetchOccupations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOccupations();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/ai-jobs" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-white font-semibold text-lg">AI Jobs Map</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/ai-jobs/browse" className="text-emerald-400 font-medium">
              Browse
            </Link>
            <Link href="/ai-jobs/about" className="text-slate-300 hover:text-white transition-colors">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Occupations</h1>
          <p className="text-slate-400">Explore {(total || 0).toLocaleString()} occupations and their AI opportunities</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search occupations..."
                  className="w-full px-4 py-2 pl-10 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {allCategories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'title' | 'ai_opportunities')}
              className="px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="title">Sort by Name</option>
              <option value="ai_opportunities">Sort by AI Opportunities</option>
            </select>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(occupations || []).map((occ) => (
              <Link
                key={occ.id}
                href={`/ai-jobs/${occ.slug}`}
                className="group bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors mb-2">
                  {occ.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{occ.major_category}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {occ.ai_opportunities_count || 0} AI opportunities
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {occ.micro_tasks_count || 0} tasks
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Page Info */}
        <div className="text-center text-slate-500 mt-4">
          Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total || 0)} of {(total || 0).toLocaleString()} occupations
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-12 mt-16">
        <div className="max-w-7xl mx-auto text-center text-slate-500">
          <p>Built with Next.js, Supabase & Vercel</p>
          <p className="mt-2 text-sm">Data sourced from U.S. Bureau of Labor Statistics</p>
        </div>
      </footer>
    </div>
  );
}
