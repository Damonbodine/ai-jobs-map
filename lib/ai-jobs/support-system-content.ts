export interface SupportSystemContent {
  startWith: string;
  dayChanges: string;
  handles: string[];
  staysWithYou: string[];
  whyItFits: string;
  secondaryLabel?: string;
  secondaryBody?: string;
}

export const supportSystemContentBySlug: Record<string, SupportSystemContent> = {
  electricians: {
    startWith: 'Start with scheduling support.',
    dayChanges:
      'Instead of losing time to appointment changes, repeated customer follow-up, and the back-and-forth around open jobs, the support system keeps the schedule moving in the background. Requests get organized, reminders go out, and the next step is prepared before someone has to stop the day and handle it manually.',
    handles: [
      'inbound job requests',
      'appointment confirmations and reschedules',
      'missing customer details',
      'follow-up reminders',
      'daily schedule movement',
    ],
    staysWithYou: [
      'final schedule decisions',
      'customer conversations',
      'on-site judgment',
      'pricing and scope changes',
    ],
    whyItFits:
      'The biggest drag here usually is not the hands-on work itself. It is the scheduling, follow-up, and customer coordination wrapped around the work.',
    secondaryLabel: 'Estimate and proposal support',
    secondaryBody:
      'If quote turnaround is the bigger pain than calendar movement, the better first move is estimate support: organize job details, prepare draft scopes, and keep open quotes from going cold.',
  },
  'project-management-specialists': {
    startWith: 'Start with status and follow-through support.',
    dayChanges:
      'Instead of spending the day collecting updates, rewriting the same status information, and chasing action items after meetings, the support system gathers what changed, prepares the summary, and keeps the next step moving. You review and adjust instead of assembling everything from scratch.',
    handles: [
      'update collection',
      'status-summary prep',
      'meeting follow-up',
      'action-item tracking',
      'reminder and handoff prep',
    ],
    staysWithYou: [
      'stakeholder judgment',
      'priority calls',
      'exception handling',
      'final communication',
    ],
    whyItFits:
      'This role loses time to coordination overhead. The support system is not replacing management. It is reducing the repetitive work required to keep the project visible and moving.',
    secondaryLabel: 'Documentation support',
    secondaryBody:
      'If recurring decks, summaries, and reporting packets are heavier than follow-up, documentation support can be the better starting point.',
  },
  'accountants-and-auditors': {
    startWith: 'Start with documentation support.',
    dayChanges:
      'Instead of rebuilding recurring reports, gathering the same support details, and manually preparing first drafts, the support system prepares the first version of the work so you can spend more time reviewing, correcting, and deciding. The work starts closer to finished.',
    handles: [
      'recurring report prep',
      'documentation assembly',
      'record organization',
      'draft summaries',
      'routine data pull support',
    ],
    staysWithYou: [
      'final review',
      'accounting judgment',
      'exception handling',
      'sign-off',
    ],
    whyItFits:
      'The time drain here usually comes from recurring documentation and preparation work, not from the final professional judgment.',
    secondaryLabel: 'Exception review support',
    secondaryBody:
      'If the bigger problem is combing through records to find what needs attention, exception review support may be the better lead system.',
  },
  'registered-nurses': {
    startWith: 'Start with documentation and follow-through support.',
    dayChanges:
      'Instead of the day being split between care and documentation cleanup, the support system helps structure notes, organize the next follow-up step, and keep routine communication moving. More of the shift stays with care, and less of it gets pulled into repetitive record work.',
    handles: [
      'draft documentation structure',
      'follow-up prompts',
      'recurring communication prep',
      'routine record organization',
      'missing-information flags',
    ],
    staysWithYou: [
      'patient judgment',
      'care decisions',
      'sensitive communication',
      'final accountability',
    ],
    whyItFits:
      'The support opportunity is around the admin load that surrounds care, not the care itself. This is a documentation-and-follow-through story rather than a decision story.',
    secondaryLabel: 'Intake and triage support',
    secondaryBody:
      'In higher-volume settings, organizing inbound requests and routing routine items may be the better first step.',
  },
  'paralegals-and-legal-assistants': {
    startWith: 'Start with intake and documentation support.',
    dayChanges:
      'Instead of every new matter starting as a manual collection process, the support system organizes incoming details, prepares the next document step, and keeps follow-up from stalling. The work enters the day cleaner, and less time is spent rebuilding context by hand.',
    handles: [
      'matter intake organization',
      'document collection follow-up',
      'packet prep',
      'status updates',
      'routine drafting setup',
    ],
    staysWithYou: [
      'legal judgment',
      'attorney coordination',
      'sensitive communications',
      'final review',
    ],
    whyItFits:
      'This role often loses time at the front of the workflow: collecting, organizing, and preparing. That makes intake and documentation support the strongest fit.',
    secondaryLabel: 'Follow-through support',
    secondaryBody:
      'If the bigger pain is open loops rather than intake volume, follow-through support becomes the better first recommendation.',
  },
  'construction-managers': {
    startWith: 'Start with status and coordination support.',
    dayChanges:
      'Instead of spending time chasing updates, coordinating changes across crews and vendors, and preparing the same progress information over and over, the support system gathers status, prepares the next communication, and keeps follow-through moving. The manager steps into decisions instead of stitching together updates by hand.',
    handles: [
      'status collection',
      'schedule-related updates',
      'follow-up reminders',
      'documentation prep',
      'coordination packets',
    ],
    staysWithYou: [
      'site judgment',
      'sequencing decisions',
      'stakeholder management',
      'exceptions and escalations',
    ],
    whyItFits:
      'The time drain is usually in coordination and reporting around the job, not the leadership of the job itself.',
    secondaryLabel: 'Estimate and proposal support',
    secondaryBody:
      'Where pre-job scoping and proposal turnaround are heavier than status work, estimate support may be the better first package.',
  },
  'software-developers': {
    startWith: 'Start with documentation and follow-through support.',
    dayChanges:
      'Instead of losing time to ticket cleanup, status updates, handoff notes, and the repeat explanations that surround shipping work, the support system prepares the context, drafts the updates, and keeps routine follow-through moving so the developer can stay longer in the actual build work.',
    handles: [
      'ticket summaries',
      'handoff notes',
      'status update drafts',
      'routine documentation',
      'follow-up reminders',
    ],
    staysWithYou: [
      'technical decisions',
      'architecture judgment',
      'code review',
      'final implementation choices',
    ],
    whyItFits:
      'The opportunity is not replacing engineering judgment. It is reducing the reporting, documentation, and coordination work wrapped around delivery.',
    secondaryLabel: 'Research and decision prep support',
    secondaryBody:
      'If the bigger drag is gathering context, comparing options, and preparing technical decisions, research and decision prep support may be the stronger first move.',
  },
  'customer-service-representatives': {
    startWith: 'Start with intake and triage support.',
    dayChanges:
      'Instead of every request arriving as another manual sort-and-respond task, the support system organizes incoming issues, prepares the next reply, and routes what needs escalation. The queue becomes cleaner before the representative ever opens it.',
    handles: [
      'incoming customer requests',
      'issue categorization',
      'draft reply prep',
      'escalation routing',
      'follow-up reminders',
    ],
    staysWithYou: [
      'sensitive customer conversations',
      'exception handling',
      'judgment on unusual cases',
      'final accountability',
    ],
    whyItFits:
      'This role loses the most time at the front of the queue: sorting, drafting, and routing high volumes of repetitive requests.',
    secondaryLabel: 'Follow-through support',
    secondaryBody:
      'If the bigger issue is open-loop follow-up after the first response, follow-through support becomes the better lead recommendation.',
  },
  'sales-representatives-of-services-except-advertising-insurance-financial-services-and-travel': {
    startWith: 'Start with follow-through support.',
    dayChanges:
      'Instead of letting leads, open conversations, and next steps live across inboxes and memory, the support system keeps follow-up moving, prepares outreach drafts, and surfaces the conversations most likely to need attention today.',
    handles: [
      'lead follow-up',
      'outreach drafts',
      'next-step reminders',
      'meeting prep',
      'pipeline nudges',
    ],
    staysWithYou: [
      'relationship building',
      'deal judgment',
      'pricing conversations',
      'final communication',
    ],
    whyItFits:
      'The biggest time leak in many service sales roles is not persuasion itself. It is the repetitive follow-up and coordination needed to keep opportunities moving.',
    secondaryLabel: 'Intake and triage support',
    secondaryBody:
      'If the bigger problem is cleaning up inbound demand and qualifying new requests, intake and triage support may be the better first layer.',
  },
  'medical-and-health-services-managers': {
    startWith: 'Start with status and reporting support.',
    dayChanges:
      'Instead of spending large parts of the week gathering updates, preparing recurring reports, and coordinating the same operational follow-through, the support system assembles the latest information, drafts the next report, and keeps the work moving before review.',
    handles: [
      'operational status collection',
      'report drafting',
      'meeting follow-up',
      'routine documentation',
      'coordination reminders',
    ],
    staysWithYou: [
      'care and staffing decisions',
      'risk judgment',
      'sensitive communication',
      'final approvals',
    ],
    whyItFits:
      'The support opportunity sits in the admin and reporting layer around healthcare operations, not in the final decisions that require human accountability.',
    secondaryLabel: 'Documentation support',
    secondaryBody:
      'If the heavier burden is recurring documentation and packet preparation, documentation support may be the cleaner starting point.',
  },
  'human-resources-specialists': {
    startWith: 'Start with intake and follow-through support.',
    dayChanges:
      'Instead of every request, document chase, and process step becoming another manual follow-up chain, the support system organizes incoming work, prepares the next message, and keeps routine people-processes moving without so much hand-built coordination.',
    handles: [
      'incoming HR requests',
      'document collection follow-up',
      'candidate or employee updates',
      'status reminders',
      'handoff prep',
    ],
    staysWithYou: [
      'people judgment',
      'sensitive conversations',
      'policy interpretation',
      'final decisions',
    ],
    whyItFits:
      'This role often loses time to intake, document chasing, and follow-through across many small process steps.',
    secondaryLabel: 'Documentation support',
    secondaryBody:
      'If recurring letters, summaries, and policy-driven documentation are the bigger drag, documentation support becomes the better first recommendation.',
  },
  lawyers: {
    startWith: 'Start with intake and documentation support.',
    dayChanges:
      'Instead of every new matter requiring manual collection, packet assembly, and repeated context-building, the support system organizes incoming details, prepares the next document step, and keeps routine follow-through from stalling the work.',
    handles: [
      'matter intake organization',
      'document collection',
      'packet prep',
      'status update drafting',
      'routine drafting setup',
    ],
    staysWithYou: [
      'legal judgment',
      'strategy decisions',
      'sensitive communications',
      'final review',
    ],
    whyItFits:
      'The support opportunity is strongest in intake, preparation, and recurring documentation around legal work rather than in the legal judgment itself.',
    secondaryLabel: 'Follow-through support',
    secondaryBody:
      'If the larger pain is open loops and slow responses across active matters, follow-through support becomes the better lead system.',
  },
  'marketing-managers': {
    startWith: 'Start with status and documentation support.',
    dayChanges:
      'Instead of spending time assembling campaign updates, rewriting internal summaries, and keeping a dozen moving parts in sync, the support system prepares the recurring reporting, drafts the next update, and keeps follow-through moving across the team.',
    handles: [
      'campaign status summaries',
      'report drafting',
      'stakeholder updates',
      'follow-up reminders',
      'brief preparation',
    ],
    staysWithYou: [
      'strategy calls',
      'creative judgment',
      'stakeholder communication',
      'final approvals',
    ],
    whyItFits:
      'This role often loses time in reporting and coordination around the work rather than in the marketing judgment itself.',
    secondaryLabel: 'Research and decision prep support',
    secondaryBody:
      'If the bigger drag is synthesizing market inputs and preparing decisions, research and decision prep support may be the better first move.',
  },
  'operations-research-analysts': {
    startWith: 'Start with research and decision prep support.',
    dayChanges:
      'Instead of repeatedly gathering inputs, comparing scenarios, and restating the same context before each recommendation, the support system prepares the supporting analysis so the analyst can spend more time interpreting and deciding.',
    handles: [
      'comparison prep',
      'research pulls',
      'decision-ready summaries',
      'recommendation drafts',
      'supporting context',
    ],
    staysWithYou: [
      'analytical judgment',
      'tradeoff decisions',
      'risk interpretation',
      'final recommendations',
    ],
    whyItFits:
      'The opportunity here is reducing the repetitive prep around analysis, not replacing the analytical judgment that makes the work valuable.',
    secondaryLabel: 'Documentation support',
    secondaryBody:
      'If the heavier burden is packaging findings into recurring reports and presentations, documentation support may be the cleaner starting point.',
  },
  'elementary-school-teachers-except-special-education': {
    startWith: 'Start with documentation and follow-through support.',
    dayChanges:
      'Instead of letting planning notes, student updates, and repetitive follow-through eat into teaching time, the support system prepares routine documentation and keeps the next admin step moving so more of the day stays with instruction.',
    handles: [
      'routine classroom documentation',
      'student update drafts',
      'follow-up reminders',
      'planning support',
      'information gathering',
    ],
    staysWithYou: [
      'teaching judgment',
      'student relationships',
      'sensitive conversations',
      'final communication',
    ],
    whyItFits:
      'The support opportunity sits in the admin and communication layer around teaching, not in the teaching itself.',
    secondaryLabel: 'Intake and triage support',
    secondaryBody:
      'If the biggest friction is organizing inbound requests from parents, staff, and school systems, intake and triage support may be the better first step.',
  },
  'administrative-services-managers': {
    startWith: 'Start with coordination and documentation support.',
    dayChanges:
      'Instead of the day getting pulled into status chasing, internal follow-up, vendor coordination, and recurring admin packets, the support system keeps routine operating work moving in the background. Updates get prepared, reminders go out, and recurring documentation starts closer to finished.',
    handles: [
      'vendor and facility follow-up',
      'internal status coordination',
      'recurring admin documentation',
      'meeting and action-item prep',
      'open-loop reminders',
    ],
    staysWithYou: [
      'people management',
      'priority decisions',
      'sensitive internal communication',
      'final approvals',
    ],
    whyItFits:
      'This role usually loses time in the coordination layer around operations: keeping people aligned, keeping requests moving, and preparing the recurring admin work that supports the department.',
    secondaryLabel: 'Intake and triage support',
    secondaryBody:
      'If the bigger pain is messy incoming requests and incomplete information rather than follow-through, intake and triage support becomes the better first layer.',
  },
  'financial-managers': {
    startWith: 'Start with reporting and decision prep support.',
    dayChanges:
      'Instead of repeatedly gathering inputs, rebuilding financial summaries, and reworking the same recommendation context before every review, the support system prepares the recurring reporting and decision-ready first draft so more of the day stays with interpretation and judgment.',
    handles: [
      'financial summary prep',
      'forecast and variance context',
      'recurring report drafting',
      'decision-ready briefing notes',
      'review packet assembly',
    ],
    staysWithYou: [
      'financial judgment',
      'risk decisions',
      'stakeholder conversations',
      'final sign-off',
    ],
    whyItFits:
      'The support opportunity here is not around the financial judgment itself. It is around the recurring reporting, packet assembly, and recommendation prep that surround each decision cycle.',
    secondaryLabel: 'Exception review support',
    secondaryBody:
      'If the bigger burden is combing through records and flagged items to find what needs attention, exception review support may be the stronger first move.',
  },
  'general-and-operations-managers': {
    startWith: 'Start with status and follow-through support.',
    dayChanges:
      'Instead of spending the day collecting updates, pushing people for the next step, and rebuilding the same operational summary over and over, the support system keeps routine follow-through moving and prepares the status view before you step in.',
    handles: [
      'status collection',
      'follow-up reminders',
      'meeting and handoff prep',
      'routine operating summaries',
      'cross-team coordination',
    ],
    staysWithYou: [
      'operating decisions',
      'priority calls',
      'people judgment',
      'final accountability',
    ],
    whyItFits:
      'General management roles usually lose time to the coordination burden around the work, not the leadership work itself. That makes status and follow-through the clearest place to start.',
    secondaryLabel: 'Documentation support',
    secondaryBody:
      'If recurring reports, updates, and internal operating decks are the heavier drag than follow-through, documentation support may be the cleaner lead package.',
  },
  'computer-systems-analysts': {
    startWith: 'Start with research and decision prep support.',
    dayChanges:
      'Instead of repeatedly gathering requirements context, comparing options, and restating the same technical tradeoffs before every recommendation, the support system prepares the inputs, drafts the comparison, and keeps the next analysis step moving.',
    handles: [
      'requirements summaries',
      'option comparisons',
      'decision-ready briefs',
      'stakeholder update drafts',
      'handoff preparation',
    ],
    staysWithYou: [
      'systems judgment',
      'tradeoff decisions',
      'stakeholder alignment',
      'final recommendations',
    ],
    whyItFits:
      'The opportunity here is reducing the repetitive prep around systems analysis, not replacing the analytical judgment that makes the role valuable.',
    secondaryLabel: 'Documentation support',
    secondaryBody:
      'If the bigger burden is recurring documentation, requirements packets, and update summaries, documentation support may be the better first direction.',
  },
  'management-analysts': {
    startWith: 'Start with research and decision prep support.',
    dayChanges:
      'Instead of spending so much time assembling inputs, comparing scenarios, and repackaging the same operational findings into a recommendation, the support system prepares the analysis so more of the workday stays with interpretation and advising.',
    handles: [
      'comparison prep',
      'operational research pulls',
      'recommendation drafts',
      'decision-ready summaries',
      'supporting context assembly',
    ],
    staysWithYou: [
      'analytical judgment',
      'tradeoff decisions',
      'client or stakeholder conversations',
      'final recommendations',
    ],
    whyItFits:
      'Management analysis work tends to lose time in the prep around the recommendation. That makes research and decision prep the strongest starting point.',
    secondaryLabel: 'Documentation support',
    secondaryBody:
      'If the bigger burden is packaging the findings into recurring decks, reports, and client-ready documents, documentation support may be the cleaner first move.',
  },
  'social-and-community-service-managers': {
    startWith: 'Start with intake and follow-through support.',
    dayChanges:
      'Instead of letting requests, program updates, and recurring follow-up scatter across email, notes, and memory, the support system organizes incoming work, prepares the next communication, and keeps routine coordination moving before someone has to chase it down manually.',
    handles: [
      'incoming requests and referrals',
      'follow-up reminders',
      'program status coordination',
      'routine communication prep',
      'documentation handoff support',
    ],
    staysWithYou: [
      'people judgment',
      'sensitive conversations',
      'case or program decisions',
      'final accountability',
    ],
    whyItFits:
      'The support opportunity here is in the admin and coordination work around services, not in the human judgment and trust required to lead the work.',
    secondaryLabel: 'Documentation support',
    secondaryBody:
      'If the heavier drag is recurring paperwork, summaries, and reporting packets rather than inbound coordination, documentation support may be the better starting point.',
  },
  'dispatchers-except-police-fire-and-ambulance': {
    startWith: 'Start with scheduling and routing support.',
    dayChanges:
      'Instead of every schedule change, inbound request, and open follow-up becoming another manual coordination problem, the support system keeps the queue organized, prepares the next routing step, and helps the day stay in motion without so much hand-built back-and-forth.',
    handles: [
      'incoming dispatch requests',
      'schedule and route changes',
      'follow-up reminders',
      'status updates',
      'handoff prep',
    ],
    staysWithYou: [
      'priority judgment',
      'exception handling',
      'customer or crew communication',
      'final routing decisions',
    ],
    whyItFits:
      'This role loses time in the constant coordination around movement, timing, and open loops. That makes scheduling and routing support the clearest first fit.',
    secondaryLabel: 'Intake and triage support',
    secondaryBody:
      'If the bigger pain is cleaning up inbound requests and sorting what matters first, intake and triage support may be the better lead recommendation.',
  },
};
