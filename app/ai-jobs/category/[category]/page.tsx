'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, Search } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
import { PexelsImage } from '@/components/ui/pexels-image';

interface Occupation {
  id: number;
  title: string;
  slug: string;
  major_category: string;
}

const slugToCategory: Record<string, { name: string; img: string }> = {
  'management': { name: 'Management', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=500&fit=crop' },
  'business-and-financial-operations': { name: 'Business and Financial Operations', img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=500&fit=crop' },
  'computer-and-mathematical': { name: 'Computer and Mathematical', img: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=500&fit=crop' },
  'architecture-and-engineering': { name: 'Architecture and Engineering', img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&h=500&fit=crop' },
  'life-physical-and-social-science': { name: 'Life Physical and Social Science', img: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=500&fit=crop' },
  'community-and-social-service': { name: 'Community and Social Service', img: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&h=500&fit=crop' },
  'legal': { name: 'Legal', img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=500&fit=crop' },
  'educational-instruction-and-library': { name: 'Educational Instruction and Library', img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=500&fit=crop' },
  'arts-design-entertainment-sports-and-media': { name: 'Arts Design Entertainment Sports and Media', img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&h=500&fit=crop' },
  'healthcare-practitioners-and-technical': { name: 'Healthcare Practitioners and Technical', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=500&fit=crop' },
  'healthcare-support': { name: 'Healthcare Support', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&h=500&fit=crop' },
  'protective-service': { name: 'Protective Service', img: 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?w=1200&h=500&fit=crop' },
  'food-preparation-and-serving-related': { name: 'Food Preparation and Serving', img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&h=500&fit=crop' },
  'building-and-grounds-cleaning-and-maintenance': { name: 'Building and Grounds Cleaning and Maintenance', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=500&fit=crop' },
  'personal-care-and-service': { name: 'Personal Care and Service', img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=500&fit=crop' },
  'sales-and-related': { name: 'Sales and Related', img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=500&fit=crop' },
  'office-and-administrative-support': { name: 'Office and Administrative Support', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=500&fit=crop' },
  'farming-fishing-and-forestry': { name: 'Farming Fishing and Forestry', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&h=500&fit=crop' },
  'construction-and-extraction': { name: 'Construction and Extraction', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=500&fit=crop' },
  'installation-maintenance-and-repair': { name: 'Installation Maintenance and Repair', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&h=500&fit=crop' },
  'production': { name: 'Production', img: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=1200&h=500&fit=crop' },
  'transportation-and-material-moving': { name: 'Transportation and Material Moving', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=500&fit=crop' },
};

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const categoryInfo = slugToCategory[categorySlug];
  const categoryName = categoryInfo?.name || categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const categoryImg = categoryInfo?.img;

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
      {/* Hero with image */}
      <section className="relative overflow-hidden bg-panel">
        {categoryImg && (
          <>
            <img
              src={categoryImg}
              alt={categoryName}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: 'saturate(0.5) brightness(0.35)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/60 to-transparent" />
          </>
        )}
        <div className="page-container relative pt-8 pb-12 md:pt-10 md:pb-16">
          <Link href="/ai-jobs" className="dark-panel-muted mb-8 inline-flex items-center gap-1 text-[0.78rem] transition-opacity hover:opacity-70">
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </Link>

          <div className="dark-panel-muted eyebrow">Industry sector</div>
          <h1
            className="dark-panel-text mt-3 font-editorial font-normal"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: 1, letterSpacing: '-0.035em' }}
          >
            {categoryName}
          </h1>
          <p className="dark-panel-muted mt-3 text-[0.85rem]">
            {loading ? 'Loading occupations...' : `${occupations.length} roles in this sector`}
          </p>
        </div>
      </section>

      <main className="page-container py-10 md:py-14">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Filter occupations...`}
              className="h-12 w-full rounded-xl border border-edge-strong bg-surface-raised pl-11 pr-4 text-[0.85rem] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md"
            />
          </div>
          {search && (
            <p className="mt-2 text-[0.78rem] text-ink-tertiary">
              Found <span className="font-medium text-ink">{filteredOccupations.length}</span> results for &ldquo;{search}&rdquo;
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-sunken" />
            ))}
          </div>
        ) : filteredOccupations.length === 0 ? (
          <div className="rounded-xl border border-edge bg-surface-raised p-12 text-center shadow-sm">
            <Search className="mx-auto mb-3 h-8 w-8 text-ink-tertiary" />
            <h3 className="text-lg font-medium text-ink">No occupations found</h3>
            <p className="mt-1 text-[0.8rem] text-ink-secondary">
              {search ? `No results for "${search}". Try a broader term.` : 'No occupations found in this category.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-[0.8rem] font-medium text-accent-blue hover:text-accent-blue-hover">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredOccupations.map((occupation, i) => {
              // Generate a unique warm color from the occupation name
              const hash = occupation.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
              const hue = (hash * 37) % 360;
              const color = `hsl(${hue}, 25%, 45%)`;

              return (
                <motion.div
                  key={occupation.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={`/ai-jobs/${occupation.slug}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-edge-strong bg-surface-raised shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    {/* Visual header with Pexels image */}
                    <PexelsImage
                      query={occupation.title}
                      fallbackColor={color}
                      fallbackLetter={occupation.title.charAt(0)}
                      className="h-28"
                    />

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-[0.85rem] font-medium text-ink leading-snug">
                        {occupation.title}
                      </h3>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <span className="text-[0.68rem] text-ink-tertiary transition-colors group-hover:text-ink-secondary">
                          View time analysis
                        </span>
                        <ArrowRight className="h-3 w-3 text-ink-tertiary/30 transition-all duration-300 group-hover:text-ink-tertiary group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
