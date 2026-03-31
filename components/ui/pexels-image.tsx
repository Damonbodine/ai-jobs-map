'use client';

import { useState, useRef } from 'react';
import { useInView } from 'framer-motion';

const SUPABASE_REF = process.env.NEXT_PUBLIC_SUPABASE_REF || 'nhjwpmfcpbfbzcaookkw';
const STORAGE_URL = `https://${SUPABASE_REF}.supabase.co/storage/v1/object/public/occupation-images`;

interface PexelsImageProps {
  query: string;
  slug?: string;
  fallbackColor: string;
  className?: string;
  fallbackLetter?: string;
}

export function PexelsImage({ query, slug, fallbackColor, className, fallbackLetter }: PexelsImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '300px' });

  // Derive slug from query if not provided
  const imageSlug = slug || query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const src = `${STORAGE_URL}/${imageSlug}.jpg`;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className || ''}`}
      style={{
        background: !loaded
          ? `linear-gradient(135deg, ${fallbackColor}20, ${fallbackColor}08), linear-gradient(to bottom right, #ECE8E1, #DDD8D0)`
          : undefined,
      }}
    >
      {inView && !errored && (
        <img
          src={src}
          alt={query}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ filter: 'saturate(0.7) brightness(0.88)' }}
        />
      )}

      {loaded && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />}

      {/* Fallback decorations */}
      {!loaded && (
        <>
          <div
            className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.12] transition-all duration-500 group-hover:scale-125 group-hover:opacity-[0.22]"
            style={{ backgroundColor: fallbackColor }}
          />
          {fallbackLetter && (
            <span
              className="absolute bottom-2 right-3 font-editorial text-[2.5rem] leading-none opacity-[0.06]"
              style={{ color: fallbackColor }}
            >
              {fallbackLetter}
            </span>
          )}
        </>
      )}
    </div>
  );
}
