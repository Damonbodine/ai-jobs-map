import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, className, children }: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="section-title">{title}</h1>
      {description && <p className="section-copy max-w-2xl">{description}</p>}
      {children}
    </div>
  );
}
