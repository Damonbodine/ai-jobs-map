'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/ai-jobs" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-white font-semibold text-lg">AI Jobs Map</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/ai-jobs" className="text-slate-300 hover:text-white transition-colors">Search</Link>
            <Link href="/ai-jobs/browse" className="text-slate-300 hover:text-white transition-colors">Browse</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <Link href="/ai-jobs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Search
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <span className="text-5xl">{icon}</span>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{categoryName}</h1>
            <p className="text-slate-400 mt-1">{loading ? 'Loading...' : `${occupations.length} occupations`}</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg h-16 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
            {occupations.map((occupation) => (
              <Link
                key={occupation.id}
                href={`/ai-jobs/${occupation.slug}`}
                className="group bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white group-hover:text-emerald-400 transition-colors">{occupation.title}</span>
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && occupations.length === 0 && (
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No occupations found</h3>
            <p className="text-slate-400">We couldn't find any occupations in this category.</p>
          </div>
        )}
      </main>
    </div>
  );
}
