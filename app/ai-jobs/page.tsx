'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
}

interface SearchResponse {
  results: Occupation[];
  total: number;
  query: string | null;
  category: string | null;
}

const majorCategories = [
  { name: 'Management', slug: 'management', icon: '👔' },
  { name: 'Business & Finance', slug: 'business-and-financial-operations', icon: '💼' },
  { name: 'Computer & Tech', slug: 'computer-and-mathematical', icon: '💻' },
  { name: 'Healthcare', slug: 'healthcare-practitioners-and-technical', icon: '🏥' },
  { name: 'Education', slug: 'educational-instruction-and-library', icon: '📚' },
  { name: 'Legal', slug: 'legal', icon: '⚖️' },
  { name: 'Engineering', slug: 'architecture-and-engineering', icon: '🏗️' },
  { name: 'Sales & Marketing', slug: 'sales-and-related', icon: '📈' },
  { name: 'Science', slug: 'life-physical-and-social-science', icon: '🔬' },
  { name: 'Arts & Media', slug: 'arts-design-entertainment-sports-and-media', icon: '🎨' },
  { name: 'Social Service', slug: 'community-and-social-service', icon: '🤝' },
  { name: 'Construction', slug: 'construction-and-extraction', icon: '🏗️' },
];

export default function AIJobsLanding() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Occupation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setTotalResults(0);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/ai-jobs/search?q=${encodeURIComponent(query)}&limit=10`);
      const data: SearchResponse = await response.json();
      setSearchResults(data.results);
      setTotalResults(data.total);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, performSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-white font-semibold text-lg">AI Jobs Map</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/ai-jobs/browse" className="text-slate-300 hover:text-white transition-colors">
              Browse
            </Link>
            <Link href="/ai-jobs/about" className="text-slate-300 hover:text-white transition-colors">
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            Map AI Opportunities
          </span>
          <br />
          to Your Career
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
          Discover how AI can transform your job. Search any occupation to find AI-powered 
          opportunities, skill recommendations, and actionable insights.
        </p>
        <div className="flex justify-center">
          <Image src="https://images.unsplash.com/photo-1503264116251-35a269479413?q=80&w=1400&auto=format&fit=crop" alt="Hero" width={1400} height={600} className="w-full max-w-4xl rounded-md" />
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any job title... (e.g., 'Software Developer', 'Nurse')"
              className="w-full px-6 py-5 pr-12 bg-slate-800/80 border border-slate-700 rounded-2xl text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-10">
              {searchResults.length > 0 ? (
                <>
                  <div className="px-4 py-2 text-sm text-slate-400 border-b border-slate-700">
                    Found {totalResults} results
                  </div>
                  {searchResults.map((occupation) => (
                    <Link
                      key={occupation.id}
                      href={`/ai-jobs/${occupation.slug}`}
                      className="block px-4 py-3 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="font-medium text-white">{occupation.title}</div>
                      <div className="text-sm text-slate-400">{occupation.major_category}</div>
                    </Link>
                  ))}
                  {totalResults > searchResults.length && (
                    <Link
                      href={`/ai-jobs/search?q=${encodeURIComponent(searchQuery)}`}
                      className="block px-4 py-3 text-center text-emerald-400 hover:bg-slate-700/50 border-t border-slate-700 transition-colors"
                    >
                      View all {totalResults} results →
                    </Link>
                  )}
                </>
              ) : !isSearching ? (
                <div className="px-4 py-8 text-center text-slate-400">
                  No occupations found for "{searchQuery}"
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-2">826+</div>
            <div className="text-slate-400">Occupations</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">22</div>
            <div className="text-slate-400">Career Categories</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">7</div>
            <div className="text-slate-400">AI Categories</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-orange-400 mb-2">AI+</div>
            <div className="text-slate-400">Skill Paths</div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {majorCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/ai-jobs/${category.slug}`}
              className="group bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <div className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                {category.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Search Your Job</h3>
            <p className="text-slate-400">
              Find your occupation from 800+ career paths across all major industries.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💡</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Discover AI Opportunities</h3>
            <p className="text-slate-400">
              See specific ways AI can add value to your daily tasks and responsibilities.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📈</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Build AI Skills</h3>
            <p className="text-slate-400">
              Get learning paths and resources to leverage AI in your career.
            </p>
          </div>
        </div>
      </section>

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
