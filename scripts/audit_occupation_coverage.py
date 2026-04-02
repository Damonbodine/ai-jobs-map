#!/usr/bin/env python3
"""
Audit occupation coverage for recommendation/story readiness.

Outputs:
- docs/superpowers/reports/2026-04-01-occupation-coverage-audit.md
- docs/superpowers/reports/2026-04-01-occupation-coverage-audit.json
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from dataclasses import dataclass, asdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.pipeline.db import get_db


AUDIT_SQL = """
WITH task_counts AS (
  SELECT
    occupation_id,
    COUNT(*)::int AS micro_task_count,
    COUNT(*) FILTER (WHERE ai_applicable = true)::int AS ai_micro_task_count,
    COUNT(*) FILTER (WHERE ai_applicable = true AND ai_category IS NOT NULL)::int AS categorized_ai_micro_task_count,
    COUNT(*) FILTER (WHERE ai_applicable = true AND COALESCE(ai_impact_level, 0) >= 4)::int AS high_impact_ai_micro_task_count
  FROM job_micro_tasks
  GROUP BY occupation_id
),
opportunity_counts AS (
  SELECT
    occupation_id,
    COUNT(*) FILTER (WHERE is_approved = true)::int AS approved_opportunity_count,
    COUNT(*)::int AS total_opportunity_count
  FROM ai_opportunities
  GROUP BY occupation_id
)
SELECT
  o.id AS occupation_id,
  o.title,
  o.slug,
  o.major_category,
  p.composite_score,
  p.time_range_low,
  p.time_range_high,
  p.time_range_by_block,
  p.top_blocking_abilities,
  COALESCE(tc.micro_task_count, 0) AS micro_task_count,
  COALESCE(tc.ai_micro_task_count, 0) AS ai_micro_task_count,
  COALESCE(tc.categorized_ai_micro_task_count, 0) AS categorized_ai_micro_task_count,
  COALESCE(tc.high_impact_ai_micro_task_count, 0) AS high_impact_ai_micro_task_count,
  COALESCE(oc.approved_opportunity_count, 0) AS approved_opportunity_count,
  COALESCE(oc.total_opportunity_count, 0) AS total_opportunity_count
FROM occupations o
LEFT JOIN occupation_automation_profile p ON p.occupation_id = o.id
LEFT JOIN task_counts tc ON tc.occupation_id = o.id
LEFT JOIN opportunity_counts oc ON oc.occupation_id = o.id
ORDER BY o.title ASC
"""


@dataclass
class AuditRow:
    occupation_id: int
    title: str
    slug: str
    major_category: str
    composite_score: int | None
    time_range_low: int | None
    time_range_high: int | None
    time_range_by_block: str | None
    top_blocking_abilities: str | None
    micro_task_count: int
    ai_micro_task_count: int
    categorized_ai_micro_task_count: int
    high_impact_ai_micro_task_count: int
    approved_opportunity_count: int
    total_opportunity_count: int


def _has_non_empty_json_array(raw: str | None) -> bool:
    if not raw:
        return False
    try:
        parsed = json.loads(raw)
        return isinstance(parsed, list) and len(parsed) > 0
    except Exception:
        return False


def _has_non_empty_json_object(raw: str | None) -> bool:
    if not raw:
        return False
    try:
        parsed = json.loads(raw)
        return isinstance(parsed, dict) and len(parsed) > 0
    except Exception:
        return False


def get_thin_reasons(row: AuditRow) -> list[str]:
    reasons: list[str] = []
    if row.composite_score is None:
        reasons.append("missing_profile")
    if not row.time_range_low or not row.time_range_high:
        reasons.append("missing_time_range")
    if not _has_non_empty_json_object(row.time_range_by_block):
        reasons.append("missing_block_ranges")
    if not _has_non_empty_json_array(row.top_blocking_abilities):
        reasons.append("missing_blockers")
    if row.micro_task_count < 8:
        reasons.append("too_few_tasks")
    if row.ai_micro_task_count < 4:
        reasons.append("too_few_ai_tasks")
    if row.categorized_ai_micro_task_count < 3:
        reasons.append("too_few_categorized_ai_tasks")
    if row.total_opportunity_count == 0:
        reasons.append("no_generated_opportunities")
    if row.approved_opportunity_count == 0:
        reasons.append("no_approved_opportunities")
    return reasons


def is_blocking_reason(reason: str) -> bool:
    return reason not in {"no_generated_opportunities", "no_approved_opportunities"}


def reason_severity(reason: str) -> int:
    return {
        "missing_profile": 4,
        "missing_time_range": 3,
        "missing_block_ranges": 3,
        "missing_blockers": 2,
        "too_few_tasks": 4,
        "too_few_ai_tasks": 4,
        "too_few_categorized_ai_tasks": 5,
        "no_generated_opportunities": 2,
        "no_approved_opportunities": 1,
    }[reason]


def is_story_ready(row: AuditRow) -> bool:
    return (
        row.composite_score is not None
        and row.ai_micro_task_count >= 4
        and row.categorized_ai_micro_task_count >= 3
        and (_has_non_empty_json_object(row.time_range_by_block) or (row.time_range_low or 0) > 0)
        and (_has_non_empty_json_array(row.top_blocking_abilities) or row.high_impact_ai_micro_task_count >= 2)
    )


def build_report(rows: list[AuditRow]) -> tuple[dict, list[dict]]:
    summary_counter: Counter[str] = Counter()
    thin_occupations: list[dict] = []

    for row in rows:
        reasons = get_thin_reasons(row)
        blocking_reasons = [reason for reason in reasons if is_blocking_reason(reason)]
        if is_story_ready(row):
            summary_counter["story_ready_count"] += 1
        if blocking_reasons:
            summary_counter["thin_count"] += 1
            for reason in blocking_reasons:
                summary_counter[reason] += 1
        for reason in reasons:
            if reason in {"no_generated_opportunities", "no_approved_opportunities"}:
                summary_counter[reason] += 1
        if reasons:
            thin_occupations.append(
                {
                    "slug": row.slug,
                    "title": row.title,
                    "majorCategory": row.major_category,
                    "severity": sum(reason_severity(reason) for reason in blocking_reasons),
                    "reasons": reasons,
                    "blockingReasons": blocking_reasons,
                    "metrics": {
                        "microTaskCount": row.micro_task_count,
                        "aiMicroTaskCount": row.ai_micro_task_count,
                        "categorizedAiMicroTaskCount": row.categorized_ai_micro_task_count,
                        "approvedOpportunityCount": row.approved_opportunity_count,
                        "totalOpportunityCount": row.total_opportunity_count,
                        "timeRangeLow": row.time_range_low,
                        "timeRangeHigh": row.time_range_high,
                    },
                }
            )

    thin_occupations.sort(key=lambda row: (-row["severity"], row["title"]))
    summary = {
        "totalOccupations": len(rows),
        "storyReadyCount": summary_counter["story_ready_count"],
        "thinCount": summary_counter["thin_count"],
        "missingProfileCount": summary_counter["missing_profile"],
        "missingTimeRangeCount": summary_counter["missing_time_range"],
        "missingBlockRangeCount": summary_counter["missing_block_ranges"],
        "missingBlockersCount": summary_counter["missing_blockers"],
        "lowTaskCount": summary_counter["too_few_tasks"],
        "lowAiTaskCount": summary_counter["too_few_ai_tasks"],
        "lowCategorizedTaskCount": summary_counter["too_few_categorized_ai_tasks"],
        "noGeneratedOpportunityCount": summary_counter["no_generated_opportunities"],
        "noApprovedOpportunityCount": summary_counter["no_approved_opportunities"],
    }
    return summary, thin_occupations


def build_markdown(summary: dict, thin_occupations: list[dict]) -> str:
    top_thin = thin_occupations[:30]
    air_traffic = next(
        (row for row in thin_occupations if row["slug"] == "air-traffic-controllers"),
        None,
    )
    lines = [
        "# Occupation Coverage Audit",
        "",
        "## Summary",
        "",
        f"- Total occupations: {summary['totalOccupations']}",
        f"- Story-ready occupations: {summary['storyReadyCount']}",
        f"- Thin occupations: {summary['thinCount']}",
        f"- Missing profile rows: {summary['missingProfileCount']}",
        f"- Missing time ranges: {summary['missingTimeRangeCount']}",
        f"- Missing block ranges: {summary['missingBlockRangeCount']}",
        f"- Missing blockers: {summary['missingBlockersCount']}",
        f"- Too few tasks: {summary['lowTaskCount']}",
        f"- Too few AI tasks: {summary['lowAiTaskCount']}",
        f"- Too few categorized AI tasks: {summary['lowCategorizedTaskCount']}",
        f"- No generated opportunities: {summary['noGeneratedOpportunityCount']}",
        f"- No approved opportunities: {summary['noApprovedOpportunityCount']}",
        "",
            "## Highest-priority thin occupations",
            "",
            "| Occupation | Category | Severity | Reasons |",
            "| --- | --- | ---: | --- |",
    ]
    for row in top_thin:
        lines.append(
            f"| {row['title']} | {row['majorCategory']} | {row['severity']} | {', '.join(row['blockingReasons'] or row['reasons'])} |"
        )
    lines.extend(
        [
            "",
            "## Backfill order",
            "",
            "1. Regenerate or enrich `job_micro_tasks` for occupations with `too_few_ai_tasks` or `too_few_categorized_ai_tasks`.",
            "2. Recompute `occupation_automation_profile` for occupations missing `time_range_*`, `time_range_by_block`, or blockers.",
            "3. Generate `ai_opportunities` where none exist, then decide whether to bulk-approve or selectively approve.",
            "4. Add curated overrides only after the structured backfill is in place.",
            "",
            "## Reference case",
            "",
        ]
    )
    if air_traffic:
        lines.append(
            f"- `air-traffic-controllers`: {', '.join(air_traffic['reasons'])}"
        )
    else:
        lines.append("- `air-traffic-controllers`: not flagged as thin by the audit thresholds.")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(AUDIT_SQL)
            rows = [AuditRow(*row) for row in cur.fetchall()]
    finally:
        conn.close()

    summary, thin_occupations = build_report(rows)

    report_dir = Path("docs/superpowers/reports")
    report_dir.mkdir(parents=True, exist_ok=True)

    json_path = report_dir / "2026-04-01-occupation-coverage-audit.json"
    md_path = report_dir / "2026-04-01-occupation-coverage-audit.md"

    json_path.write_text(
        json.dumps(
            {
                "summary": summary,
                "thinOccupations": thin_occupations,
            },
            indent=2,
        )
    )
    md_path.write_text(build_markdown(summary, thin_occupations))

    print(f"Audited {summary['totalOccupations']} occupations")
    print(f"Story-ready: {summary['storyReadyCount']}")
    print(f"Thin: {summary['thinCount']}")
    print(f"Wrote report: {md_path}")
    print(f"Wrote JSON:   {json_path}")


if __name__ == "__main__":
    main()
