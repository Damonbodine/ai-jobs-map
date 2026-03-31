'use client';

import { useState } from 'react';

interface RoiCalculatorProps {
  weeklyHoursSaved: number;
  defaultHourlyRate: number;
  salaryLabel: string | null; // e.g. "$77K median salary" or null if no BLS data
  minutesPerDay: number;
}

export function RoiCalculator({ weeklyHoursSaved, defaultHourlyRate, salaryLabel, minutesPerDay }: RoiCalculatorProps) {
  const [hourlyRate, setHourlyRate] = useState(defaultHourlyRate);
  const [hasEdited, setHasEdited] = useState(false);

  const annualValue = Math.round(weeklyHoursSaved * 50 * hourlyRate);
  const monthlyValue = Math.round(annualValue / 12);

  function handleRateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setHourlyRate(val);
      setHasEdited(true);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-border/60 bg-surface p-6 md:p-8">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Rate input — first so the user engages */}
        <div>
          <label htmlFor="hourly-rate" className="text-[0.7rem] text-ink-muted">
            Your hourly rate
          </label>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-editorial text-2xl font-normal text-ink">$</span>
            <input
              id="hourly-rate"
              type="number"
              min={0}
              step={5}
              value={hourlyRate}
              onChange={handleRateChange}
              className="w-20 border-b-2 border-border/60 bg-transparent font-editorial text-2xl font-normal text-ink outline-none transition-colors focus:border-accent"
            />
            <span className="text-sm text-ink-muted">/hr</span>
          </div>
          <p className="mt-1 text-[0.6rem] text-ink-muted">
            {hasEdited
              ? 'Using your rate'
              : salaryLabel
                ? `Based on ${salaryLabel}`
                : 'Estimated — enter yours for a precise number'}
          </p>
        </div>

        {/* Time */}
        <div>
          <p className="text-[0.7rem] text-ink-muted">Time recovered per week</p>
          <p className="mt-1 font-editorial text-2xl font-normal text-ink">
            {weeklyHoursSaved}
            <span className="text-sm text-ink-muted"> hrs</span>
          </p>
          <p className="mt-0.5 text-[0.6rem] text-ink-muted">
            {minutesPerDay} min/day &times; 5 days
          </p>
        </div>

        {/* Annual value — reactive, the payoff */}
        <div>
          <p className="text-[0.7rem] text-ink-muted">Estimated annual value</p>
          <p className="mt-1 font-editorial text-2xl font-normal text-ink">
            ${annualValue.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[0.6rem] text-ink-muted">
            ${monthlyValue.toLocaleString()}/mo in recovered capacity
          </p>
        </div>
      </div>
    </div>
  );
}
