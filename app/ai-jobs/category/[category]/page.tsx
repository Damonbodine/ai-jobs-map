'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Footer } from '@/components/ui/footer';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
}

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

  const categoryName = slugToCategory[categorySlug] || categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

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

  const filteredOccupations = search
    ? occupations.filter(o => o.title.toLowerCase().includes(search.toLowerCase()))
    : occupations;

  return (
    <div className="app-shell">
      <main className="page-container py-10 md:py-14">
        <Link href="/ai-jobs" className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-tertiary transition-colors hover:text-ink">
          <ChevronLeft className="h-4 w-4" />
          Back to Search
        </Link>

        <div className="mb-8">
          <span className="eyebrow">Industry sector</span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink md:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
            {categoryName}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-secondary">
            {loading ? 'Loading occupations...' : `Browse ${occupations.length} roles in this sector. Open any to see where routine work is most ready for support.`}
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-lg border border-edge bg-surface-raised p-3 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Filter ${categoryName} occupations...`}
              className="h-10 w-full rounded-md border border-edge bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-tertiary focus:border-edge-strong focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          {search && (
            <p className="mt-2 text-sm text-ink-tertiary">
              Found <span className="font-medium text-ink">{filteredOccupations.length}</span> results for &ldquo;{search}&rdquo;
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-md bg-surface-sunken" />
            ))}
          </div>
        ) : filteredOccupations.length === 0 ? (
          <div className="rounded-lg border border-edge bg-surface-raised p-10 text-center shadow-sm">
            <Search className="mx-auto mb-3 h-8 w-8 text-ink-tertiary" />
            <h3 className="text-lg font-semibold text-ink">No occupations found</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              {search ? `No results for "${search}". Try a broader term.` : "No occupations found in this category."}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-sm font-medium text-accent-blue hover:text-accent-blue-hover">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {filteredOccupations.map((occupation) => (
              <Link
                key={occupation.id}
                href={`/ai-jobs/${occupation.slug}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-edge bg-surface-raised px-4 py-3.5 shadow-sm transition-all hover:shadow-md hover:border-edge-strong"
              >
                <span className="text-sm font-medium text-ink group-hover:text-accent-blue transition-colors">
                  {occupation.title}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-tertiary" />
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
