import type { Metadata } from 'next';
import { Header } from '@/components/ui/Header';

export const metadata: Metadata = {
  title: 'AI Jobs Map - Find Time-Back Opportunities In Your Work',
  description: 'Search any occupation to find supportive workflow opportunities, practical skill recommendations, and actionable ways to get time back in your job.',
};

export default function AIJobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
