import Link from 'next/link';
import { cn } from '@/lib/utils';

interface OccupationCardProps {
  title: string;
  slug: string;
  category: string;
  description?: string;
  metric?: { label: string; value: string };
  tags?: string[];
  className?: string;
}

export function OccupationCard({
  title,
  slug,
  category,
  description,
  metric,
  tags,
  className,
}: OccupationCardProps) {
  return (
    <Link
      href={`/ai-jobs/${slug}`}
      className={cn(
        'group block rounded-lg border border-edge bg-surface-raised p-5 shadow-sm transition-shadow hover:shadow-md hover:border-edge-strong',
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-tertiary">
        {category}
      </p>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-ink group-hover:text-accent-blue transition-colors">
        {title}
      </h3>
      {description && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-secondary">
          {description}
        </p>
      )}
      {metric && (
        <div className="mt-4 inline-flex items-baseline gap-1.5 rounded-md bg-surface-sunken px-3 py-1.5">
          <span className="text-sm font-semibold text-ink">{metric.value}</span>
          <span className="text-xs text-ink-tertiary">{metric.label}</span>
        </div>
      )}
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-sm bg-surface-sunken px-2 py-0.5 text-xs text-ink-tertiary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
