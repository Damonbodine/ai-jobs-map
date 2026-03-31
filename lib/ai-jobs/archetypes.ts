/**
 * Occupation Archetype System
 *
 * Classifies occupations into archetypes based on their automation profile,
 * then drives the hero claim, narrative frame, time-back multiplier, and CTA.
 *
 * The physical ability average from O*NET is the primary discriminator:
 *   - Desk/Digital (≤2.0): routine cognitive work, highly automatable
 *   - Mixed (2.0–2.5): blend of hands-on and admin
 *   - Physical (>2.5): core work is physical, only admin fringe is automatable
 *   - Unknown (null): no O*NET dimensional data yet
 */

export type Archetype = 'desk_digital' | 'mixed' | 'physical' | 'unknown';

export interface ArchetypeProfile {
  archetype: Archetype;
  label: string;
  /** Scales the raw LLM time-back number by credibility */
  timeBackMultiplier: number;
  /** Hero subhead — what we promise */
  heroFrame: (minutes: number) => string;
  /** One-liner explanation of why this archetype */
  rationale: string;
  /** Badge color token */
  badgeTone: string;
  /** What we're actually helping with */
  valueProposition: string;
}

const ARCHETYPES: Record<Archetype, Omit<ArchetypeProfile, 'archetype'>> = {
  desk_digital: {
    label: 'Desk & Digital',
    timeBackMultiplier: 1.0,
    heroFrame: (min) => `We believe you can save`,
    rationale: 'This role is primarily cognitive and digital — routine tasks are highly automatable.',
    badgeTone: 'bg-cyan-500/12 text-cyan-600 border-cyan-500/25',
    valueProposition: 'Automate repetitive workflows, reduce context-switching, and reclaim deep work time.',
  },
  mixed: {
    label: 'Mixed',
    timeBackMultiplier: 0.6,
    heroFrame: (min) => `The admin side of this role could give back`,
    rationale: 'This role blends hands-on work with administrative tasks. We focus on the admin portion.',
    badgeTone: 'bg-indigo-500/12 text-indigo-600 border-indigo-500/25',
    valueProposition: 'Lighten the documentation, scheduling, and coordination that surrounds your core work.',
  },
  physical: {
    label: 'Hands-on',
    timeBackMultiplier: 0.3,
    heroFrame: (min) => `Your work is hands-on. The paperwork around it?`,
    rationale: 'The core of this role is physical. Automation targets the administrative fringe — scheduling, documentation, compliance tracking.',
    badgeTone: 'bg-amber-500/12 text-amber-700 border-amber-500/25',
    valueProposition: 'Streamline the paperwork, safety logs, and scheduling that pull you away from the actual work.',
  },
  unknown: {
    label: 'Early profile',
    timeBackMultiplier: 0.5,
    heroFrame: (min) => `Based on early analysis, routine work identified:`,
    rationale: 'We\'re still building a detailed profile for this role. These estimates will improve as we add more data.',
    badgeTone: 'bg-slate-500/12 text-slate-600 border-slate-500/25',
    valueProposition: 'We\'ve identified initial automation opportunities and are deepening the analysis.',
  },
};

export function classifyOccupation(profile: {
  physical_ability_avg: number | null;
  composite_score: number;
  cognitive_routine_avg?: number | null;
  cognitive_creative_avg?: number | null;
} | null): ArchetypeProfile {
  if (!profile || profile.physical_ability_avg == null) {
    return { archetype: 'unknown', ...ARCHETYPES.unknown };
  }

  const phys = profile.physical_ability_avg;

  if (phys > 2.5) {
    return { archetype: 'physical', ...ARCHETYPES.physical };
  }

  if (phys > 2.0) {
    return { archetype: 'mixed', ...ARCHETYPES.mixed };
  }

  return { archetype: 'desk_digital', ...ARCHETYPES.desk_digital };
}

/**
 * Apply the archetype multiplier to the raw time-back minutes.
 * Ensures we never claim less than 5 minutes (floor) or show 0.
 */
export function modulateTimeBack(rawMinutes: number, archetype: ArchetypeProfile): number {
  const modulated = Math.round(rawMinutes * archetype.timeBackMultiplier);
  return Math.max(5, modulated);
}
