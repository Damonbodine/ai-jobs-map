import type { SupportSystemContent } from './support-system-content';

export interface SupportSystemCandidate {
  key: string;
  name: string;
  totalMinutes: number;
  watches: string;
  produces: string;
  review?: string;
  matchedBlocks?: string[];
  matchingTasks?: Array<{
    task_name?: string;
    task_description?: string;
    ai_how_it_helps?: string;
    blockLabel?: string;
  }>;
}

export interface SupportSystemEngineInput {
  occupationSlug: string;
  occupationTitle: string;
  occupationArchetypeLabel: string;
  candidates: SupportSystemCandidate[];
}

interface RoleProfile {
  key: string;
  match: RegExp;
  boosts: Partial<Record<string, number>>;
  handleBias?: Partial<Record<string, string[]>>;
  staysWithYou?: Partial<Record<string, string[]>>;
  dayChangeLead?: Partial<Record<string, string>>;
  whyFitLead?: Partial<Record<string, string>>;
}

const supportSystemLabelByKey: Record<string, string> = {
  intake: 'intake and triage support',
  analysis: 'research and decision prep support',
  documentation: 'documentation support',
  coordination: 'follow-through support',
  exceptions: 'exception review support',
};

const defaultStaysWithYouByKey: Record<string, string[]> = {
  intake: [
    'final prioritization',
    'sensitive requests',
    'exception handling',
    'escalation decisions',
  ],
  analysis: [
    'final decisions',
    'tradeoff judgment',
    'risk calls',
    'exception handling',
  ],
  documentation: [
    'final review',
    'accuracy checks',
    'sensitive edits',
    'sign-off',
  ],
  coordination: [
    'relationship moments',
    'priority changes',
    'sensitive communication',
    'exception handling',
  ],
  exceptions: [
    'approvals',
    'judgment calls',
    'edge cases',
    'final accountability',
  ],
};

const roleProfiles: RoleProfile[] = [
  {
    key: 'electrician',
    match: /\belectrician|installer|repairer|technician\b/i,
    boosts: { coordination: 12, intake: 8, documentation: 2 },
    handleBias: {
      coordination: [
        'appointment confirmations and reschedules',
        'crew or calendar changes',
        'follow-up reminders',
        'open-job movement',
      ],
      intake: [
        'inbound job requests',
        'missing customer details',
        'estimate follow-up',
      ],
    },
    staysWithYou: {
      coordination: [
        'final schedule decisions',
        'customer conversations',
        'on-site judgment',
        'scope changes',
      ],
    },
    dayChangeLead: {
      coordination:
        'Instead of losing time to appointment changes, repeated customer follow-up, and the back-and-forth around open jobs, the support system keeps the schedule moving in the background.',
    },
    whyFitLead: {
      coordination:
        'The biggest drag here usually is not the hands-on work itself. It is the scheduling, follow-up, and customer coordination wrapped around the work.',
    },
  },
  {
    key: 'nurse',
    match: /\bnurse|nursing|clinical|care\b/i,
    boosts: { documentation: 12, coordination: 7, intake: 3 },
    handleBias: {
      documentation: [
        'draft documentation structure',
        'routine record organization',
        'missing-information flags',
        'recurring communication prep',
      ],
      coordination: [
        'follow-up prompts',
        'handoff reminders',
        'routine communication prep',
      ],
    },
    staysWithYou: {
      documentation: [
        'patient judgment',
        'care decisions',
        'sensitive communication',
        'final accountability',
      ],
    },
    dayChangeLead: {
      documentation:
        'Instead of the day being split between care and documentation cleanup, the support system helps structure notes, organize the next follow-up step, and keep routine communication moving.',
    },
    whyFitLead: {
      documentation:
        'The support opportunity is around the admin load that surrounds care, not the care itself.',
    },
  },
  {
    key: 'accounting',
    match: /\baccountant|auditor|bookkeeper|controller|finance\b/i,
    boosts: { documentation: 10, exceptions: 8, analysis: 4 },
    handleBias: {
      documentation: [
        'recurring report prep',
        'documentation assembly',
        'record organization',
        'draft summaries',
      ],
      exceptions: [
        'review packets',
        'unusual cases',
        'quality checks',
      ],
    },
    staysWithYou: {
      documentation: [
        'final review',
        'accounting judgment',
        'exception handling',
        'sign-off',
      ],
    },
  },
  {
    key: 'project-management',
    match: /\bproject manager|project management|program manager|operations manager|construction manager\b/i,
    boosts: { coordination: 10, analysis: 6, documentation: 5 },
    handleBias: {
      coordination: [
        'update collection',
        'status movement',
        'meeting follow-up',
        'action-item tracking',
      ],
      documentation: [
        'status-summary prep',
        'report drafting',
      ],
    },
    staysWithYou: {
      coordination: [
        'stakeholder judgment',
        'priority calls',
        'exception handling',
        'final communication',
      ],
    },
  },
  {
    key: 'legal',
    match: /\bparalegal|legal assistant|legal|attorney\b/i,
    boosts: { intake: 10, documentation: 9, coordination: 3 },
    handleBias: {
      intake: [
        'matter intake organization',
        'document collection follow-up',
        'packet prep',
      ],
      documentation: [
        'routine drafting setup',
        'status updates',
      ],
    },
    staysWithYou: {
      intake: [
        'legal judgment',
        'attorney coordination',
        'sensitive communications',
        'final review',
      ],
    },
  },
  {
    key: 'education',
    match: /\bteacher|principal|school|education|counselor|administrator\b/i,
    boosts: { intake: 8, coordination: 8, documentation: 4 },
    handleBias: {
      intake: [
        'incoming requests',
        'calendar movement',
        'information gathering',
        'routine parent or staff follow-up',
      ],
    },
    staysWithYou: {
      intake: [
        'people decisions',
        'sensitive conversations',
        'exceptions',
        'final approvals',
      ],
    },
  },
  {
    key: 'software',
    match: /\bsoftware developer|developer|engineer|programmer|architect\b/i,
    boosts: { documentation: 8, coordination: 6, analysis: 5 },
    handleBias: {
      documentation: [
        'ticket summaries',
        'handoff notes',
        'routine documentation',
        'status update drafts',
      ],
      coordination: [
        'follow-up reminders',
        'handoff nudges',
        'open-loop tracking',
      ],
    },
    staysWithYou: {
      documentation: [
        'technical decisions',
        'architecture judgment',
        'code review',
        'final implementation choices',
      ],
    },
  },
  {
    key: 'sales',
    match: /\bsales|account executive|business development|customer success\b/i,
    boosts: { coordination: 11, intake: 6, documentation: 2 },
    handleBias: {
      coordination: [
        'lead follow-up',
        'outreach drafts',
        'next-step reminders',
        'meeting prep',
      ],
      intake: [
        'incoming leads',
        'qualification notes',
        'new-request routing',
      ],
    },
    staysWithYou: {
      coordination: [
        'relationship building',
        'deal judgment',
        'pricing conversations',
        'final communication',
      ],
    },
  },
  {
    key: 'customer-service',
    match: /\bcustomer service|support specialist|help desk|service representative\b/i,
    boosts: { intake: 12, coordination: 5, documentation: 3 },
    handleBias: {
      intake: [
        'incoming customer requests',
        'issue categorization',
        'draft reply prep',
        'escalation routing',
      ],
    },
    staysWithYou: {
      intake: [
        'sensitive customer conversations',
        'exception handling',
        'judgment on unusual cases',
        'final accountability',
      ],
    },
  },
  {
    key: 'healthcare-management',
    match: /\bmedical and health services manager|health services manager|clinic manager|practice manager\b/i,
    boosts: { coordination: 9, documentation: 8, intake: 3 },
    handleBias: {
      coordination: [
        'operational status collection',
        'meeting follow-up',
        'coordination reminders',
      ],
      documentation: [
        'report drafting',
        'routine documentation',
        'packet prep',
      ],
    },
    staysWithYou: {
      coordination: [
        'care and staffing decisions',
        'risk judgment',
        'sensitive communication',
        'final approvals',
      ],
    },
  },
  {
    key: 'marketing',
    match: /\bmarketing|communications manager|brand manager\b/i,
    boosts: { documentation: 8, coordination: 7, analysis: 4 },
    handleBias: {
      documentation: [
        'campaign status summaries',
        'report drafting',
        'stakeholder updates',
        'brief preparation',
      ],
      coordination: [
        'follow-up reminders',
        'handoff nudges',
      ],
    },
  },
  {
    key: 'hr',
    match: /\bhuman resources|recruiter|talent|people operations\b/i,
    boosts: { intake: 9, coordination: 8, documentation: 5 },
    handleBias: {
      intake: [
        'incoming HR requests',
        'document collection follow-up',
        'candidate or employee updates',
      ],
      coordination: [
        'status reminders',
        'handoff prep',
      ],
    },
    staysWithYou: {
      intake: [
        'people judgment',
        'sensitive conversations',
        'policy interpretation',
        'final decisions',
      ],
    },
  },
];

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function listToSentence(items: string[]) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function normalizeHandle(item: string) {
  return item
    .replace(/\.$/, '')
    .replace(/^draft /i, '')
    .replace(/^prepare /i, '')
    .trim();
}

function dedupe(items: string[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getRoleProfile(occupationTitle: string) {
  return roleProfiles.find((profile) => profile.match.test(occupationTitle));
}

function buildHandles(candidate: SupportSystemCandidate, roleProfile?: RoleProfile) {
  const taskHandles = (candidate.matchingTasks || [])
    .map((task) => task.task_name || task.task_description || task.ai_how_it_helps || '')
    .map((item) => normalizeHandle(item))
    .filter(Boolean)
    .slice(0, 5);

  if (taskHandles.length >= 4) {
    return taskHandles;
  }

  const defaults: Record<string, string[]> = {
    intake: [
      'incoming requests',
      'incomplete submissions',
      'early sorting',
      'handoff prep',
      'priority signals',
    ],
    analysis: [
      'comparison prep',
      'research pulls',
      'decision-ready summaries',
      'recommendation drafts',
      'supporting context',
    ],
    documentation: [
      'recurring reports',
      'document prep',
      'record updates',
      'summary drafting',
      'packet assembly',
    ],
    coordination: [
      'follow-up reminders',
      'status movement',
      'meeting prep',
      'handoff nudges',
      'open-loop tracking',
    ],
    exceptions: [
      'unusual cases',
      'quality checks',
      'review packets',
      'approval prep',
      'flagged issues',
    ],
  };

  const merged = dedupe([
    ...(roleProfile?.handleBias?.[candidate.key] || []),
    ...taskHandles,
    ...(defaults[candidate.key] || []),
  ]);
  return merged.slice(0, 5);
}

function buildDayChanges(
  occupationTitle: string,
  candidate: SupportSystemCandidate,
  handles: string[],
  roleProfile?: RoleProfile
) {
  const handleSentence = listToSentence(handles.slice(0, 3));
  const systemLabel = supportSystemLabelByKey[candidate.key] || 'support system';
  const roleLead = roleProfile?.dayChangeLead?.[candidate.key];

  const templates: Record<string, string> = {
    intake:
      `${roleLead || `Instead of new work arriving as scattered requests and manual sorting, the ${systemLabel} organizes ${handleSentence}, prepares the next step, and keeps the front of the workflow cleaner before someone has to stop and rebuild context by hand.`}`,
    analysis:
      `${roleLead || `Instead of spending time gathering inputs, comparing options, and rewriting the same recommendation context, the ${systemLabel} prepares ${handleSentence} so the person can review, adjust, and decide rather than start from zero.`}`,
    documentation:
      `${roleLead || `Instead of rebuilding the same paperwork and drafts from scratch, the ${systemLabel} prepares ${handleSentence} so the day starts closer to finished work and less time gets pulled into repetitive admin.`}`,
    coordination:
      `${roleLead || `Instead of losing time to chasing updates, reminders, and the next open loop, the ${systemLabel} keeps ${handleSentence} moving in the background so the person can step into the work that actually needs judgment.`}`,
    exceptions:
      `${roleLead || `Instead of manually scanning everything to find the few items that matter, the ${systemLabel} surfaces ${handleSentence} so the person spends more time on the decisions and less time on the checking.`}`,
  };

  return templates[candidate.key] || `This role benefits from ${systemLabel} that keeps repetitive work moving in the background and gives time back in the day.`;
}

function buildWhyItFits(candidate: SupportSystemCandidate, occupationArchetypeLabel: string, roleProfile?: RoleProfile) {
  const blockText = listToSentence((candidate.matchedBlocks || []).slice(0, 2).map((block) => block.toLowerCase()));
  const systemLabel = supportSystemLabelByKey[candidate.key] || 'support';
  const archetypeNote = occupationArchetypeLabel === 'Hands-on'
    ? 'The point is to remove the admin wrapped around the core work, not the core work itself.'
    : 'The point is to reduce the repetitive setup around the work so the human stays with judgment and final accountability.';
  const roleLead = roleProfile?.whyFitLead?.[candidate.key];

  if (roleLead) {
    return `${roleLead} ${archetypeNote}`;
  }

  if (blockText) {
    return `The strongest routine drag in this role sits in ${blockText}. That makes ${systemLabel} the cleanest place to start. ${archetypeNote}`;
  }

  return `This role shows the strongest routine drag in work that fits ${systemLabel}. ${archetypeNote}`;
}

export function deriveSupportSystemContent(
  input: SupportSystemEngineInput,
  overrides?: Partial<Record<string, SupportSystemContent>>
): SupportSystemContent | null {
  const roleProfile = getRoleProfile(input.occupationTitle);
  const sorted = [...input.candidates]
    .filter((candidate) => candidate.totalMinutes > 0)
    .map((candidate) => ({
      ...candidate,
      calibratedScore: candidate.totalMinutes + (roleProfile?.boosts?.[candidate.key] || 0),
    }))
    .sort((a, b) => b.calibratedScore - a.calibratedScore);

  const primary = sorted[0];
  if (!primary) {
    return overrides?.[input.occupationSlug] ?? null;
  }

  const secondary = sorted[1];
  const primaryLabel = supportSystemLabelByKey[primary.key] || `${primary.name.toLowerCase()} support`;
  const secondaryLabel = secondary ? supportSystemLabelByKey[secondary.key] || secondary.name : undefined;
  const handles = buildHandles(primary, roleProfile);

  const generated: SupportSystemContent = {
    startWith: `Start with ${primaryLabel}.`,
    dayChanges: buildDayChanges(input.occupationTitle, primary, handles, roleProfile),
    handles,
    staysWithYou: roleProfile?.staysWithYou?.[primary.key] || defaultStaysWithYouByKey[primary.key] || [
      'final decisions',
      'sensitive communication',
      'exception handling',
      'final accountability',
    ],
    whyItFits: buildWhyItFits(primary, input.occupationArchetypeLabel, roleProfile),
    secondaryLabel: secondaryLabel ? sentenceCase(secondaryLabel) : undefined,
    secondaryBody: secondary
      ? `If the bigger pain is ${listToSentence(buildHandles(secondary, roleProfile).slice(0, 2))} rather than the primary routine drag, ${secondaryLabel} becomes the better next direction.`
      : undefined,
  };

  const override = overrides?.[input.occupationSlug];
  return override ? { ...generated, ...override } : generated;
}
