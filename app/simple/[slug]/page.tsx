import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { occupations, onetTasks, aiOpportunities } from '@/lib/db/schema';
import { eq, avg, sql } from 'drizzle-orm';
import ZeroBaseClient from './ZeroBaseClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ZeroBasePage({ params }: PageProps) {
  const { slug } = await params;
  console.log('[ZeroBase] Fetching data for slug:', slug);

  // 1. Fetch Occupation Core Data
  const occupation = await db.query.occupations.findFirst({
    where: eq(occupations.slug, slug),
  });

  if (!occupation) {
    notFound();
  }

  // 2. Fetch O*NET Tasks for Automation Score Calculation
  const tasks = await db.query.onetTasks.findMany({
    where: eq(onetTasks.occupationId, occupation.id),
    orderBy: (onetTasks, { desc }) => [desc(onetTasks.aiAutomationScore)],
  });

  // Calculate The "Three Truths"
  
  // A. The Synthetic Displacement (Average Automation Score)
  const validScores = tasks.filter(t => t.aiAutomationScore !== null);
  const avgExposure = validScores.length > 0 
    ? Math.round(validScores.reduce((acc, t) => acc + (t.aiAutomationScore || 0), 0) / validScores.length)
    : 0;

  // B. The Bedtime ROI (Average Time Saved)
  const validTimes = tasks.filter(t => t.estimatedTimeSavedPercent !== null);
  const avgTimeSavedPercent = validTimes.length > 0
    ? validTimes.reduce((acc, t) => acc + (t.estimatedTimeSavedPercent || 0), 0) / validTimes.length
    : 0;
  
  // Assuming 8 hour day (480 mins)
  const minutesReclaimed = Math.round((avgTimeSavedPercent / 100) * 480);

  // 3. Fetch AI Opportunities (The "Audit" Data)
  const opportunities = await db.query.aiOpportunities.findMany({
    where: eq(aiOpportunities.occupationId, occupation.id),
    orderBy: (aiOpportunities, { desc }) => [desc(aiOpportunities.impactLevel)],
  });

  return (
    <ZeroBaseClient 
      occupation={occupation}
      exposure={avgExposure}
      minutesReclaimed={minutesReclaimed}
      tasks={tasks}
      opportunities={opportunities}
    />
  );
}
