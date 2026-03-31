'use client';

import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface CategoryImageProps {
  category: string;
  color: string;
  className?: string;
}

export function CategoryImage({ category, color, className }: CategoryImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '200px' });
  const attempted = useRef(false);

  useEffect(() => {
    if (!inView || attempted.current) return;
    attempted.current = true;
    setLoading(true);

    const img = new Image();
    const url = `/api/images/generate?category=${encodeURIComponent(category)}`;
    img.onload = () => {
      setSrc(url);
      setLoading(false);
    };
    img.onerror = () => {
      setFailed(true);
      setLoading(false);
    };
    img.src = url;
  }, [inView, category]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className || ''}`}
      style={{
        background: failed || !src
          ? `linear-gradient(135deg, ${color}18, ${color}08), linear-gradient(to bottom right, #ECE8E1, #DDD8D0)`
          : undefined,
      }}
    >
      {src && (
        <img
          src={src}
          alt={`${category} workspace`}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ filter: 'saturate(0.7) brightness(0.95)' }}
        />
      )}

      {/* Overlay for text readability */}
      {src && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      )}

      {/* Loading shimmer */}
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-surface-sunken" />
      )}

      {/* Decorative shapes (shown when no image) */}
      {!src && (
        <>
          <div
            className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.12] transition-all duration-500 group-hover:scale-125 group-hover:opacity-[0.2]"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full opacity-[0.08] transition-all duration-500 group-hover:scale-110"
            style={{ backgroundColor: color }}
          />
          <span
            className="absolute bottom-3 right-4 font-editorial text-[4rem] leading-none opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.1]"
            style={{ color: color }}
          >
            {category.charAt(0)}
          </span>
        </>
      )}
    </div>
  );
}
