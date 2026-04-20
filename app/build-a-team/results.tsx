import type { DepartmentTotals } from "@/lib/build-a-team/compute"
import { computeAnnualHours } from "@/lib/pricing"

export function Results({ totals }: { totals: DepartmentTotals }) {
  const totalHoursPerYear = computeAnnualHours(totals.totalMinutesPerDay)
  return (
    <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8">
      <h2 className="font-heading text-xl font-semibold mb-5">
        What AI gives this team back
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat label="People in scope" value={totals.totalPeople.toString()} />
        <Stat
          label="Daily time reclaimed"
          value={Math.round(totals.totalMinutesPerDay).toLocaleString()}
          unit="min"
        />
        <Stat
          label="Hours reclaimed / yr"
          value={totalHoursPerYear.toLocaleString()}
        />
        <Stat
          label="Equivalent FTEs"
          value={totals.fteEquivalents.toString()}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-semibold py-2">Role</th>
              <th className="text-center font-semibold py-2">People</th>
              <th className="text-right font-semibold py-2">Min/day each</th>
              <th className="text-right font-semibold py-2">Hrs/yr reclaimed</th>
            </tr>
          </thead>
          <tbody>
            {totals.rows.map((row) => (
              <tr key={row.slug} className="border-t border-border">
                <td className="py-2 text-foreground">{row.title}</td>
                <td className="py-2 text-center">{row.count}</td>
                <td className="py-2 text-right">{row.minutesPerPerson}</td>
                <td className="py-2 text-right">
                  {computeAnnualHours(row.totalMinutesPerDay).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-foreground font-semibold">
              <td className="py-2">Department total</td>
              <td className="py-2 text-center">{totals.totalPeople}</td>
              <td className="py-2 text-right">
                {Math.round(totals.totalMinutesPerDay).toLocaleString()}
              </td>
              <td className="py-2 text-right">
                {totalHoursPerYear.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit?: string
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <p className="font-heading text-2xl font-semibold text-foreground">
        {value}
        {unit ? (
          <span className="text-base text-muted-foreground ml-1">{unit}</span>
        ) : null}
      </p>
    </div>
  )
}
