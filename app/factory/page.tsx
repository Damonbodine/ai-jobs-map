'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Footer } from '@/components/ui/footer';

const painOptions = [
  { id: 'coordination', label: 'Coordination & follow-ups', desc: 'Chasing people, reminders, status updates' },
  { id: 'reporting', label: 'Reporting & documentation', desc: 'Writing the same reports, filling templates' },
  { id: 'email', label: 'Email & messaging', desc: 'Sorting, responding, forwarding, searching' },
  { id: 'data-entry', label: 'Data entry & admin', desc: 'Moving data between systems, manual input' },
  { id: 'research', label: 'Research & analysis', desc: 'Gathering info, comparing, summarizing' },
  { id: 'meetings', label: 'Meetings & scheduling', desc: 'Calendar management, prep, follow-up notes' },
];

const steps = ['role', 'pain', 'freeform', 'contact'] as const;
type Step = typeof steps[number];

export default function FactoryPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-ink-tertiary">Loading...</div>}>
      <FactoryPage />
    </Suspense>
  );
}

function FactoryPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState('');
  const [selectedPains, setSelectedPains] = useState<string[]>([]);
  const [freeform, setFreeform] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const occupation = searchParams.get('occupation');
    if (occupation) {
      setRole(occupation.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  }, [searchParams]);

  const currentIndex = steps.indexOf(step);
  const canGoNext = () => {
    if (step === 'role') return role.trim().length > 0;
    if (step === 'pain') return selectedPains.length > 0;
    if (step === 'freeform') return true; // optional
    if (step === 'contact') return email.trim().length > 0;
    return false;
  };

  const goNext = () => {
    if (step === 'contact') {
      handleSubmit();
      return;
    }
    const next = steps[currentIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = steps[currentIndex - 1];
    if (prev) setStep(prev);
  };

  const togglePain = (id: string) => {
    setSelectedPains((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    // In production, this would POST to an API endpoint
    console.log('Intake submission:', { role, selectedPains, freeform, name, email });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken">
            <Check className="h-6 w-6 text-ink" />
          </div>
          <h1 className="font-editorial text-[1.75rem] font-normal tracking-[-0.03em] text-ink">
            We&apos;ve got it.
          </h1>
          <p className="mt-3 text-[0.875rem] leading-[1.6] text-ink-secondary">
            We&apos;ll review your role and pain points, then come back with a recommendation
            tailored to how your day actually works. Expect to hear from us within 48 hours.
          </p>
          <a
            href="/ai-jobs"
            className="btn-primary mt-8 inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-2.5 text-sm font-medium transition-colors hover:bg-transparent hover:text-ink"
          >
            Back to search
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col">
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="mx-auto w-full max-w-lg">

          {/* Progress */}
          <div className="mb-12 flex items-center gap-1.5">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i <= currentIndex ? 'bg-ink' : 'bg-edge'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Step 1: Role */}
              {step === 'role' && (
                <div>
                  <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                    What&apos;s your role?
                  </h1>
                  <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">
                    This helps us understand the kind of work you do every day.
                  </p>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Financial Examiner, Project Manager..."
                    className="mt-8 w-full rounded-xl border border-edge-strong bg-surface-raised px-4 py-3.5 text-[0.9rem] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md"
                    autoFocus
                  />
                </div>
              )}

              {/* Step 2: Pain points */}
              {step === 'pain' && (
                <div>
                  <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                    What takes up too much of your day?
                  </h1>
                  <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">
                    Pick everything that feels like it eats more time than it should.
                  </p>
                  <div className="mt-8 space-y-2">
                    {painOptions.map((option) => {
                      const selected = selectedPains.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => togglePain(option.id)}
                          className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-150 ${
                            selected
                              ? 'border-ink bg-surface-sunken shadow-sm'
                              : 'border-edge bg-surface-raised hover:border-edge-strong hover:shadow-sm'
                          }`}
                        >
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            selected ? 'border-ink bg-ink' : 'border-edge-strong'
                          }`}>
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

              {/* Step 3: Freeform */}
              {step === 'freeform' && (
                <div>
                  <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                    What would getting time back mean for you?
                  </h1>
                  <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">
                    Tell us anything — what frustrates you, what you wish was easier, what you&apos;d do with an extra hour. The more detail, the better we can help.
                  </p>
                  <textarea
                    value={freeform}
                    onChange={(e) => setFreeform(e.target.value)}
                    placeholder="I spend too much time on..."
                    rows={5}
                    className="mt-8 w-full rounded-xl border border-edge-strong bg-surface-raised px-4 py-3.5 text-[0.9rem] leading-[1.6] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md resize-none"
                    autoFocus
                  />
                  <p className="mt-2 text-[0.72rem] text-ink-tertiary">
                    Optional — but the best recommendations come from honest answers.
                  </p>
                </div>
              )}

              {/* Step 4: Contact */}
              {step === 'contact' && (
                <div>
                  <h1 className="font-editorial text-[clamp(1.5rem,3.5vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.03em] text-ink">
                    Where should we send your recommendation?
                  </h1>
                  <p className="mt-3 text-[0.85rem] leading-[1.6] text-ink-secondary">
                    We&apos;ll review your answers and come back with a tailored plan for your role.
                  </p>
                  <div className="mt-8 space-y-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name (optional)"
                      className="w-full rounded-xl border border-edge-strong bg-surface-raised px-4 py-3.5 text-[0.9rem] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                      className="w-full rounded-xl border border-edge-strong bg-surface-raised px-4 py-3.5 text-[0.9rem] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between">
            {currentIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 text-[0.8rem] text-ink-tertiary transition-colors hover:text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext()}
              className="btn-primary inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-2.5 text-[0.85rem] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-transparent hover:text-ink"
            >
              {step === 'contact' ? 'Submit' : 'Continue'}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
