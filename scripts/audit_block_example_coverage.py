#!/usr/bin/env python3
"""
Audit occupations whose visible work-area ranges are not backed by enough example routines.

Outputs:
- docs/superpowers/reports/2026-04-01-block-example-audit.md
- docs/superpowers/reports/2026-04-01-block-example-audit.json
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.pipeline.db import get_db
from scripts.block_example_utils import (
    BLOCK_LABELS,
    infer_block_for_microtask,
    rank_microtask,
    safe_load_json,
    midpoint,
)


REPORT_MD = ROOT / "docs/superpowers/reports/2026-04-01-block-example-audit.md"
REPORT_JSON = ROOT / "docs/superpowers/reports/2026-04-01-block-example-audit.json"


@dataclass
class ThinBlock:
    block: str
    low: int
    high: int
    midpoint: float
    example_count: int


def main() -> None:
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                  o.id,
                  o.title,
                  o.slug,
                  o.major_category,
                  p.time_range_by_block
                FROM occupations o
                LEFT JOIN occupation_automation_profile p ON p.occupation_id = o.id
                ORDER BY o.title ASC
                """
            )
            occupations = cur.fetchall()

            cur.execute(
                """
                SELECT
                  occupation_id,
                  task_name,
                  task_description,
                  frequency,
                  ai_category,
                  ai_impact_level,
                  ai_effort_to_implement
                FROM job_micro_tasks
                WHERE ai_applicable = true
                """
            )
            microtasks = cur.fetchall()

        tasks_by_occ: dict[int, list[dict]] = defaultdict(list)
        for occ_id, task_name, task_description, frequency, ai_category, ai_impact, ai_effort in microtasks:
            block = infer_block_for_microtask(task_name, task_description, ai_category)
            tasks_by_occ[occ_id].append(
                {
                    "block": block,
                    "title": task_name,
                    "task_description": task_description,
                    "frequency": frequency,
                    "ai_category": ai_category,
                    "ai_impact_level": ai_impact,
                    "ai_effort_to_implement": ai_effort,
                    "score": rank_microtask(
                        {
                            "frequency": frequency,
                            "ai_impact_level": ai_impact,
                            "ai_effort_to_implement": ai_effort,
                        }
                    ),
                }
            )

        summary = {
            "totalOccupations": len(occupations),
            "occupationsWithBlockRanges": 0,
            "occupationsWithThinBlocks": 0,
            "thinBlockCount": 0,
        }
        thin_rows: list[dict] = []

        for occ_id, title, slug, major_category, time_range_by_block in occupations:
            blocks = safe_load_json(time_range_by_block)
            if not blocks:
                continue
            summary["occupationsWithBlockRanges"] += 1

            grouped_examples: dict[str, list[dict]] = defaultdict(list)
            for task in tasks_by_occ.get(occ_id, []):
                grouped_examples[task["block"]].append(task)
            for block in grouped_examples:
                grouped_examples[block].sort(key=lambda row: row["score"], reverse=True)

            thin_blocks: list[ThinBlock] = []
            for block, range_data in blocks.items():
                low = int(range_data.get("low", 0) or 0)
                high = int(range_data.get("high", 0) or 0)
                mid = midpoint(low, high)
                if mid < 8:
                    continue
                example_count = len(grouped_examples.get(block, [])[:2])
                if example_count < 2:
                    thin_blocks.append(
                        ThinBlock(
                            block=block,
                            low=low,
                            high=high,
                            midpoint=mid,
                            example_count=example_count,
                        )
                    )

            if thin_blocks:
                summary["occupationsWithThinBlocks"] += 1
                summary["thinBlockCount"] += len(thin_blocks)
                thin_rows.append(
                    {
                        "title": title,
                        "slug": slug,
                        "majorCategory": major_category,
                        "thinBlocks": [
                            {
                                "block": row.block,
                                "label": BLOCK_LABELS.get(row.block, row.block),
                                "low": row.low,
                                "high": row.high,
                                "midpoint": round(row.midpoint, 1),
                                "exampleCount": row.example_count,
                            }
                            for row in sorted(thin_blocks, key=lambda item: item.midpoint, reverse=True)
                        ],
                    }
                )

        thin_rows.sort(
            key=lambda row: (
                -max(block["midpoint"] for block in row["thinBlocks"]),
                -len(row["thinBlocks"]),
                row["title"],
            )
        )

        REPORT_JSON.write_text(
            json.dumps({"summary": summary, "thinOccupations": thin_rows}, indent=2),
            encoding="utf-8",
        )
        REPORT_MD.write_text(build_markdown(summary, thin_rows), encoding="utf-8")

        print(
            f"Audited {summary['totalOccupations']} occupations; "
            f"{summary['occupationsWithThinBlocks']} have thin example blocks"
        )
        print(f"Wrote {REPORT_MD.relative_to(ROOT)}")
        print(f"Wrote {REPORT_JSON.relative_to(ROOT)}")
    finally:
        conn.close()


def build_markdown(summary: dict, thin_rows: list[dict]) -> str:
    lines = [
        "# Block Example Coverage Audit",
        "",
        "## Summary",
        "",
        f"- Total occupations: {summary['totalOccupations']}",
        f"- Occupations with block ranges: {summary['occupationsWithBlockRanges']}",
        f"- Occupations with thin example blocks: {summary['occupationsWithThinBlocks']}",
        f"- Total thin blocks: {summary['thinBlockCount']}",
        "",
        "## Highest-priority occupations",
        "",
        "| Occupation | Category | Thin blocks |",
        "| --- | --- | --- |",
    ]

    for row in thin_rows[:30]:
        block_text = ", ".join(
            f"{block['label']} ({block['low']}-{block['high']} min, {block['exampleCount']} examples)"
            for block in row["thinBlocks"][:3]
        )
        lines.append(f"| {row['title']} | {row['majorCategory']} | {block_text} |")

    lines.extend(
        [
            "",
            "## Recommendation",
            "",
            "1. Generate block example previews for these occupations.",
            "2. Use microtasks first, then fall back to O*NET tasks, DWAs, and work activities.",
            "3. Persist the derived examples only after preview QA.",
            "",
        ]
    )
    return "\n".join(lines)


if __name__ == "__main__":
    main()
