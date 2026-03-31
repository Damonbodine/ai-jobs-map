'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
import { AgentSelector } from '@/components/factory/agent-selector';
import { ToolPicker } from '@/components/factory/tool-picker';
import { CustomTasks } from '@/components/factory/custom-tasks';
import type { AgentBlueprint, BlockAgent } from '@/lib/ai-blueprints/types';

// ── Generic wizard (no occupation context) ─────────────────────

const painOptions = [
  { id: 'coordination', label: 'Coordination & follow-ups', desc: 'Chasing people, reminders, status updates' },
  { id: 'reporting', label: 'Reporting & documentation', desc: 'Writing the same reports, filling templates' },
  { id: 'email', label: 'Email & messaging', desc: 'Sorting, responding, forwarding, searching' },
  { id: 'data-entry', label: 'Data entry & admin', desc: 'Moving data between systems, manual input' },
  { id: 'research', label: 'Research & analysis', desc: 'Gathering info, comparing, summarizing' },
  { id: 'meetings', label: 'Meetings & scheduling', desc: 'Calendar management, prep, follow-up notes' },
];

const genericSteps = ['role', 'pain', 'freeform', 'contact'] as const;
type GenericStep = typeof genericSteps[number];

function GenericWizard() {
  const [step, setStep] = useState<GenericStep>('role');
  const [role, setRole] = useState('');
  const [selectedPains, setSelectedPains] = useState<string[]>([]);
  const [freeform, setFreeform] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const currentIndex = genericSteps.indexOf(step);
  const canGoNext = () => {
    if (step === 'role') return role.trim().length > 0;
    if (step === 'pain') return selectedPains.length > 0;
    if (step === 'freeform') return true;
    if (step === 'contact') return email.trim().length > 0;
    return false;
  };
  const goNext = () => {
    if (step === 'contact') { handleSubmit(); return; }
    const next = genericSteps[currentIndex + 1];
    if (next) setStep(next);
  };
  const goBack = () => {
    const prev = genericSteps[currentIndex - 1];
    if (prev) setStep(prev);
  };
  const togglePain = (id: string) => {
    setSelectedPains((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };
  const handleSubmit = () => {
    console.log('Generic intake:', { role, selectedPains, freeform, name, email });
    setSubmitted(true);
  };

  if (submitted) return <SuccessScreen />;

  return (
    <WizardShell steps={genericSteps as unknown as string[]} currentIndex={currentIndex} goBack={goBack} goNext={goNext} canGoNext={canGoNext()} isLast={step === 'contact'}>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          {step === 'role' && (
            <div>
              <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                What&apos;s your role?
              </h1>
              <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">
                This helps us understand the kind of work you do every day.
              </p>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Financial Examiner, Project Manager..." className="mt-8 w-full rounded-xl border border-edge-strong bg-surface-raised px-4 py-3.5 text-[0.9rem] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md" autoFocus />
            </div>
          )}
          {step === 'pain' && (
            <div>
              <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                What takes up too much of your day?
              </h1>
              <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">Pick everything that feels like it eats more time than it should.</p>
              <div className="mt-8 space-y-2">
                {painOptions.map((option) => {
                  const selected = selectedPains.includes(option.id);
                  return (
                    <button key={option.id} type="button" onClick={() => togglePain(option.id)} className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-150 ${selected ? 'border-ink bg-surface-sunken shadow-sm' : 'border-edge bg-surface-raised hover:border-edge-strong hover:shadow-sm'}`}>
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${selected ? 'border-ink bg-ink' : 'border-edge-strong'}`}>
                        {selected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[0.875rem] font-medium text-ink">{option.label}</p>
                        <p className="mt-0.5 text-[0.75rem] text-ink-tertiary">{option.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {step === 'freeform' && (
            <div>
              <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                What would getting time back mean for you?
              </h1>
              <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">Tell us anything — the more detail, the better we can help.</p>
              <textarea value={freeform} onChange={(e) => setFreeform(e.target.value)} placeholder="I spend too much time on..." rows={5} className="mt-8 w-full rounded-xl border border-edge-strong bg-surface-raised px-4 py-3.5 text-[0.9rem] leading-[1.6] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md resize-none" autoFocus />
              <p className="mt-2 text-[0.72rem] text-ink-tertiary">Optional — but the best recommendations come from honest answers.</p>
            </div>
          )}
          {step === 'contact' && (
            <div>
              <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                Where should we send your recommendation?
              </h1>
              <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">We&apos;ll review your answers and come back with a tailored plan.</p>
              <div className="mt-8 space-y-4">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="w-full rounded-xl border border-edge-strong bg-surface-raised px-4 py-3.5 text-[0.9rem] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="w-full rounded-xl border border-edge-strong bg-surface-raised px-4 py-3.5 text-[0.9rem] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md" autoFocus />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </WizardShell>
  );
}

// ── Product configurator (with occupation + blueprint) ─────────

const configSteps = ['package', 'tools', 'customize', 'contact'] as const;
type ConfigStep = typeof configSteps[number];

function ProductConfigurator({ blueprint, occupationTitle, occupationSlug }: {
  blueprint: AgentBlueprint;
  occupationTitle: string;
  occupationSlug: string;
}) {
  const [step, setStep] = useState<ConfigStep>('package');
  const [selectedAgentKeys, setSelectedAgentKeys] = useState<string[]>(blueprint.agents.map(a => a.blockKey));
  const [toolSelections, setToolSelections] = useState<Record<string, string[]>>({});
  const [customChips, setCustomChips] = useState<string[]>([]);
  const [freeform, setFreeform] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const currentIndex = configSteps.indexOf(step);
  const selectedAgents = blueprint.agents.filter(a => selectedAgentKeys.includes(a.blockKey));
  const totalMinutes = selectedAgents.reduce((s, a) => s + a.minutesSaved, 0);
  const totalTasks = selectedAgents.reduce((s, a) => s + a.automatedTasks.length + a.assistedTasks.length, 0);

  const toggleAgent = (key: string) => {
    setSelectedAgentKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const toggleTool = (blockKey: string, toolId: string) => {
    setToolSelections(prev => {
      const current = prev[blockKey] || [];
      return { ...prev, [blockKey]: current.includes(toolId) ? current.filter(t => t !== toolId) : [...current, toolId] };
    });
  };
  const toggleChip = (chipId: string) => {
    setCustomChips(prev => prev.includes(chipId) ? prev.filter(c => c !== chipId) : [...prev, chipId]);
  };

  const canGoNext = () => {
    if (step === 'package') return selectedAgentKeys.length > 0;
    if (step === 'tools') return true;
    if (step === 'customize') return true;
    if (step === 'contact') return email.trim().length > 0;
    return false;
  };
  const goNext = () => {
    if (step === 'contact') { handleSubmit(); return; }
    const next = configSteps[currentIndex + 1];
    if (next) setStep(next);
  };
  const goBack = () => {
    const prev = configSteps[currentIndex - 1];
    if (prev) setStep(prev);
  };
  const handleSubmit = () => {
    console.log('Configurator submission:', {
      occupation: occupationSlug,
      occupationTitle,
      selectedAgents: selectedAgents.map(a => ({ name: a.agentName, block: a.blockKey, minutes: a.minutesSaved })),
      toolSelections,
      customChips,
      freeform,
      name,
      email,
      totalMinutesSaved: totalMinutes,
      totalTasks,
    });
    setSubmitted(true);
  };

  if (submitted) return <SuccessScreen />;

  return (
    <WizardShell steps={configSteps as unknown as string[]} currentIndex={currentIndex} goBack={goBack} goNext={goNext} canGoNext={canGoNext()} isLast={step === 'contact'}>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

          {/* Step 1: Package selection */}
          {step === 'package' && (
            <div>
              <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                Here&apos;s what we&apos;d build for you
              </h1>
              <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">
                Based on your role as <span className="font-medium text-ink">{occupationTitle.toLowerCase()}</span>, we recommend these automation agents. Deselect any you don&apos;t need.
              </p>
              <div className="mt-8 space-y-2">
                {blueprint.agents.map((agent) => (
                  <AgentSelector
                    key={agent.blockKey}
                    agent={agent}
                    selected={selectedAgentKeys.includes(agent.blockKey)}
                    onToggle={() => toggleAgent(agent.blockKey)}
                  />
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-surface-sunken px-4 py-3 flex items-center justify-between">
                <span className="text-[0.75rem] text-ink-muted">
                  {selectedAgentKeys.length} agent{selectedAgentKeys.length !== 1 ? 's' : ''} selected
                </span>
                <span className="font-editorial text-[1rem] font-normal text-ink">
                  {totalMinutes} <span className="text-[0.7rem] text-ink-muted">min/day saved</span>
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Tool selection */}
          {step === 'tools' && (
            <div>
              <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                What tools do you use?
              </h1>
              <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">
                This helps us connect your automation to the tools you already have.
              </p>
              <div className="mt-8 space-y-8">
                {selectedAgents.map((agent) => (
                  <ToolPicker
                    key={agent.blockKey}
                    blockKey={agent.blockKey}
                    blockLabel={agent.blockLabel}
                    selectedTools={toolSelections[agent.blockKey] || []}
                    onToggle={(toolId) => toggleTool(agent.blockKey, toolId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Custom tasks */}
          {step === 'customize' && (
            <div>
              <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                Anything we missed?
              </h1>
              <CustomTasks
                selectedChips={customChips}
                onToggleChip={toggleChip}
                freeform={freeform}
                onFreeformChange={setFreeform}
              />
            </div>
          )}

          {/* Step 4: Contact + summary */}
          {step === 'contact' && (
            <div>
              <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                Get your build
              </h1>
              <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">
                Review your package below. Remove anything you don&apos;t need, then submit.
              </p>

              {/* Summary card with removable agents */}
              <div className="mt-6 rounded-xl border border-border/60 bg-surface-raised p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">Your package</p>
                  <span className="font-editorial text-xl font-normal text-ink">
                    {totalMinutes} <span className="text-[0.7rem] text-ink-muted">min/day</span>
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedAgents.map((agent) => (
                    <div key={agent.blockKey} className="flex items-center justify-between rounded-lg border border-border/40 bg-surface px-4 py-3">
                      <div>
                        <span className="text-[0.82rem] font-medium text-ink">{agent.agentName}</span>
                        <span className="ml-2 text-[0.72rem] text-ink-muted">{agent.minutesSaved}m/day</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAgent(agent.blockKey)}
                        className="text-[0.72rem] text-ink-muted hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                {Object.values(toolSelections).flat().length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2">Integrations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...new Set(Object.values(toolSelections).flat())].map(t => (
                        <span key={t} className="rounded-full bg-surface-sunken px-2.5 py-1 text-[0.7rem] text-ink-muted">{t.replace('custom:', '')}</span>
                      ))}
                    </div>
                  </div>
                )}
                {customChips.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2">Additional areas</p>
                    <p className="text-[0.78rem] text-ink-secondary">{customChips.join(' · ')}</p>
                  </div>
                )}
              </div>

              {/* Contact fields — bigger */}
              <div className="mt-8 space-y-4">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="w-full rounded-xl border border-edge-strong bg-surface-raised px-5 py-4 text-[1rem] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="w-full rounded-xl border border-edge-strong bg-surface-raised px-5 py-4 text-[1rem] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md" autoFocus />
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </WizardShell>
  );
}

// ── Shared components ──────────────────────────────────────────

function WizardShell({ steps, currentIndex, goBack, goNext, canGoNext, isLast, children }: {
  steps: string[];
  currentIndex: number;
  goBack: () => void;
  goNext: () => void;
  canGoNext: boolean;
  isLast: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col">
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="mx-auto w-full max-w-lg">
          {/* Progress bar */}
          <div className="mb-12 flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= currentIndex ? 'bg-ink' : 'bg-edge'}`} />
            ))}
          </div>

          {children}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            {currentIndex > 0 ? (
              <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 text-[0.8rem] text-ink-tertiary transition-colors hover:text-ink">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            ) : <div />}
            <button type="button" onClick={goNext} disabled={!canGoNext} className="btn-primary inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-2.5 text-[0.85rem] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-transparent hover:text-ink">
              {isLast ? 'Submit request' : 'Continue'} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function SuccessScreen() {
  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col">
      <div className="flex flex-1 items-center justify-center px-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken">
            <Check className="h-6 w-6 text-ink" />
          </div>
          <h1 className="font-editorial text-[1.75rem] font-normal tracking-[-0.03em] text-ink">We&apos;ve got it.</h1>
          <p className="mt-3 text-[0.875rem] leading-[1.6] text-ink-secondary">
            We&apos;ll review your selections and come back with a build plan tailored to your role. Expect to hear from us within 48 hours.
          </p>
          <a href="/ai-jobs" className="btn-primary mt-8 inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-2.5 text-sm font-medium transition-colors hover:bg-transparent hover:text-ink">
            Back to search
          </a>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

// ── Page wrapper ───────────────────────────────────────────────

function FactoryPage() {
  const searchParams = useSearchParams();
  const occupationSlug = searchParams.get('occupation');
  const [blueprint, setBlueprint] = useState<AgentBlueprint | null>(null);
  const [occupationTitle, setOccupationTitle] = useState('');
  const [loading, setLoading] = useState(!!occupationSlug);

  useEffect(() => {
    if (!occupationSlug) return;
    setLoading(true);
    fetch(`/api/blueprint/${encodeURIComponent(occupationSlug)}`)
      .then(res => res.json())
      .then(data => {
        if (data.blueprint) {
          setBlueprint(data.blueprint);
          setOccupationTitle(data.occupation?.title || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [occupationSlug]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
      </div>
    );
  }

  if (occupationSlug && blueprint) {
    return <ProductConfigurator blueprint={blueprint} occupationTitle={occupationTitle} occupationSlug={occupationSlug} />;
  }

  return <GenericWizard />;
}

export default function FactoryPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-ink-tertiary">Loading...</div>}>
      <FactoryPage />
    </Suspense>
  );
}
