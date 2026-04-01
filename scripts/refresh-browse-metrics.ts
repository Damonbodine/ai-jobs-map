import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createTableSql = `
  CREATE TABLE IF NOT EXISTS occupation_browse_metrics (
    occupation_id integer PRIMARY KEY REFERENCES occupations(id) ON DELETE CASCADE,
    coverage_percent numeric,
    estimated_daily_hours_saved numeric,
    time_range_low integer,
    time_range_high integer,
    ai_opportunities_count integer NOT NULL DEFAULT 0,
    micro_tasks_count integer NOT NULL DEFAULT 0,
    modeled_microtask_minutes integer NOT NULL DEFAULT 0,
    browse_estimated_minutes integer NOT NULL DEFAULT 0,
    refreshed_at timestamp NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS occupation_browse_metrics_minutes_idx
    ON occupation_browse_metrics (browse_estimated_minutes DESC);

  CREATE INDEX IF NOT EXISTS occupation_browse_metrics_coverage_idx
    ON occupation_browse_metrics (coverage_percent DESC);
`;

const refreshSql = `
  WITH ai_counts AS (
    SELECT occupation_id, COUNT(*)::int AS ai_opportunities_count
    FROM ai_opportunities
    GROUP BY occupation_id
  ),
  micro_counts AS (
    SELECT occupation_id, COUNT(*)::int AS micro_tasks_count
    FROM job_micro_tasks
    GROUP BY occupation_id
  ),
  modeled_microtasks AS (
    SELECT
      ranked.occupation_id,
      COALESCE(SUM(ranked.modeled_minutes_per_day), 0)::int AS modeled_microtask_minutes
    FROM (
      SELECT
        jmt.occupation_id,
        ROUND(
          (CASE jmt.frequency
            WHEN 'daily' THEN 1.0
            WHEN 'weekly' THEN 0.35
            WHEN 'monthly' THEN 0.12
            ELSE 0.18
          END) * 26 * (
            CASE
              WHEN jmt.ai_applicable THEN GREATEST(
                0.24,
                (COALESCE(jmt.ai_impact_level, 0) * 0.18) + ((6 - COALESCE(jmt.ai_effort_to_implement, 3)) * 0.08)
              )
              ELSE 0.06
            END
          )
        )::int AS modeled_minutes_per_day,
        ROW_NUMBER() OVER (
          PARTITION BY jmt.occupation_id
          ORDER BY ROUND(
            (CASE jmt.frequency
              WHEN 'daily' THEN 1.0
              WHEN 'weekly' THEN 0.35
              WHEN 'monthly' THEN 0.12
              ELSE 0.18
            END) * 26 * (
              CASE
                WHEN jmt.ai_applicable THEN GREATEST(
                  0.24,
                  (COALESCE(jmt.ai_impact_level, 0) * 0.18) + ((6 - COALESCE(jmt.ai_effort_to_implement, 3)) * 0.08)
                )
                ELSE 0.06
              END
            )
          ) DESC
        ) AS row_num
      FROM job_micro_tasks jmt
      WHERE jmt.ai_applicable = true
    ) ranked
    WHERE ranked.row_num <= 10
    GROUP BY ranked.occupation_id
  )
  INSERT INTO occupation_browse_metrics (
    occupation_id,
    coverage_percent,
    estimated_daily_hours_saved,
    time_range_low,
    time_range_high,
    ai_opportunities_count,
    micro_tasks_count,
    modeled_microtask_minutes,
    browse_estimated_minutes,
    refreshed_at
  )
  SELECT
    o.id AS occupation_id,
    oc.coverage_percent,
    oc.estimated_daily_hours_saved,
    p.time_range_low,
    p.time_range_high,
    COALESCE(ai_counts.ai_opportunities_count, 0) AS ai_opportunities_count,
    COALESCE(micro_counts.micro_tasks_count, 0) AS micro_tasks_count,
    COALESCE(modeled_microtasks.modeled_microtask_minutes, 0) AS modeled_microtask_minutes,
    ROUND(
      GREATEST(
        COALESCE(
          CASE
            WHEN p.time_range_low IS NOT NULL AND p.time_range_high IS NOT NULL
              THEN ROUND((p.time_range_low * 0.35) + (p.time_range_high * 0.65))
            WHEN p.time_range_high IS NOT NULL
              THEN p.time_range_high
            WHEN p.time_range_low IS NOT NULL
              THEN p.time_range_low
            ELSE NULL
          END,
          0
        ),
        COALESCE(
          CASE
            WHEN oc.estimated_daily_hours_saved IS NOT NULL
              THEN ROUND(oc.estimated_daily_hours_saved * 60 * 1.1)
            ELSE NULL
          END,
          0
        ),
        COALESCE(modeled_microtasks.modeled_microtask_minutes, 0),
        GREATEST(
          24,
          (COALESCE(ai_counts.ai_opportunities_count, 0) * 7.5) +
          (COALESCE(micro_counts.micro_tasks_count, 0) * 2.2) +
          (ascii(right(o.slug, 1)) % 13)
        )
      )
    )::int AS browse_estimated_minutes,
    now() AS refreshed_at
  FROM occupations o
  LEFT JOIN occupation_coverage oc ON oc.occupation_id = o.id
  LEFT JOIN occupation_automation_profile p ON p.occupation_id = o.id
  LEFT JOIN ai_counts ON ai_counts.occupation_id = o.id
  LEFT JOIN micro_counts ON micro_counts.occupation_id = o.id
  LEFT JOIN modeled_microtasks ON modeled_microtasks.occupation_id = o.id
  ON CONFLICT (occupation_id) DO UPDATE SET
    coverage_percent = EXCLUDED.coverage_percent,
    estimated_daily_hours_saved = EXCLUDED.estimated_daily_hours_saved,
    time_range_low = EXCLUDED.time_range_low,
    time_range_high = EXCLUDED.time_range_high,
    ai_opportunities_count = EXCLUDED.ai_opportunities_count,
    micro_tasks_count = EXCLUDED.micro_tasks_count,
    modeled_microtask_minutes = EXCLUDED.modeled_microtask_minutes,
    browse_estimated_minutes = EXCLUDED.browse_estimated_minutes,
    refreshed_at = EXCLUDED.refreshed_at;
`;

async function main() {
  console.log('Refreshing occupation_browse_metrics...');
  await pool.query(createTableSql);
  await pool.query(refreshSql);
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total, MAX(refreshed_at) AS refreshed_at FROM occupation_browse_metrics`
  );
  console.log(`Refreshed ${rows[0]?.total ?? 0} browse metric rows.`);
  console.log(`Last refreshed at: ${rows[0]?.refreshed_at ?? 'unknown'}`);
  await pool.end();
}

main().catch(async (error) => {
  console.error('Failed to refresh browse metrics:', error);
  await pool.end();
  process.exit(1);
});
