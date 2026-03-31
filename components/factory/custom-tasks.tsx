'use client';

import { Plus } from 'lucide-react';

const quickAddChips = [
  { id: 'data-entry', label: 'Data entry' },
  { id: 'compliance', label: 'Compliance tracking' },
  { id: 'client-comm', label: 'Client communication' },
  { id: 'vendor-mgmt', label: 'Vendor management' },
  { id: 'billing', label: 'Billing & invoicing' },
  { id: 'training', label: 'Training & onboarding' },
  { id: 'inventory', label: 'Inventory tracking' },
  { id: 'quality', label: 'Quality checks' },
  { id: 'travel', label: 'Travel & logistics' },
  { id: 'hiring', label: 'Hiring & recruiting' },
  { id: 'expense', label: 'Expense reports' },
  { id: 'filing', label: 'Filing & records' },
];

export function CustomTasks({
  selectedChips,
  onToggleChip,
  freeform,
  onFreeformChange,
}: {
  selectedChips: string[];
  onToggleChip: (chipId: string) => void;
  freeform: string;
  onFreeformChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-[0.78rem] text-ink-secondary mb-5">
        Tap anything that takes up too much time — even if we didn&apos;t include it above.
      </p>

      <div className="flex flex-wrap gap-2">
        {quickAddChips.map((chip) => {
          const isSelected = selectedChips.includes(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onToggleChip(chip.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-[0.85rem] font-medium transition-all duration-150 ${
                isSelected
                  ? 'border-ink bg-ink text-white'
                  : 'border-edge bg-surface-raised text-ink-secondary hover:border-edge-strong hover:shadow-sm'
              }`}
            >
              {!isSelected && <Plus className="h-3 w-3" />}
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="text-[0.7rem] text-ink-muted mb-2">
          Anything else eating your time?
        </p>
        <textarea
          value={freeform}
          onChange={(e) => onFreeformChange(e.target.value)}
          placeholder="e.g. I spend 30 min every morning just sorting through vendor emails..."
          rows={3}
          className="w-full rounded-xl border border-edge-strong bg-surface-raised px-4 py-3 text-[0.85rem] leading-[1.6] text-ink placeholder:text-ink-tertiary/40 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ink/5 focus:shadow-md resize-none"
        />
      </div>
    </div>
  );
}
