'use client';

import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface PexelsImageProps {
  query: string;
  fallbackColor: string;
  className?: string;
  fallbackLetter?: string;
}

export function PexelsImage({ query, fallbackColor, className, fallbackLetter }: PexelsImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '300px' });
  const attempted = useRef(false);

  useEffect(() => {
    if (!inView || attempted.current) return;
    attempted.current = true;

    fetch(`/api/images/pexels?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (data.url) setSrc(data.url);
      })
      .catch(() => {});
  }, [inView, query]);

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
      {src && (
        <img
          src={src}
          alt={query}
          onLoad={() => setLoaded(true)}
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
