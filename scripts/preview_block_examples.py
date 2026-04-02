#!/usr/bin/env python3
"""
Generate non-destructive preview block examples for one occupation or a small set.

Outputs:
- docs/superpowers/reports/2026-04-01-block-example-preview.md
- docs/superpowers/reports/2026-04-01-block-example-preview.json
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.pipeline.db import get_db
from scripts.block_example_utils import (
    BLOCK_LABELS,
    dedupe_examples,
    infer_block_for_dwa,
    infer_block_for_microtask,
    infer_block_for_onet_task,
    infer_block_for_work_activity,
    midpoint,
    rank_dwa,
    rank_microtask,
    rank_onet_task,
    rank_work_activity,
    normalize_title,
    safe_load_json,
)


REPORT_MD = ROOT / "docs/superpowers/reports/2026-04-01-block-example-preview.md"
REPORT_JSON = ROOT / "docs/superpowers/reports/2026-04-01-block-example-preview.json"


def parse_args(argv: list[str]) -> tuple[str | None, int]:
    slug = None
    limit = 10
    if "--slug" in argv:
        index = argv.index("--slug")
        if index + 1 >= len(argv):
            raise SystemExit("--slug requires a value")
        slug = argv[index + 1]
    if "--limit" in argv:
        index = argv.index("--limit")
        if index + 1 >= len(argv):
            raise SystemExit("--limit requires a value")
        limit = int(argv[index + 1])
    return slug, limit


def main() -> None:
    slug, limit = parse_args(sys.argv[1:])
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
            occupation_rows = cur.fetchall()
            if slug:
                occupation_rows = [row for row in occupation_rows if row[2] == slug]

            previews: list[dict] = []
            for occ_id, title, occ_slug, major_category, time_range_by_block in occupation_rows:
                blocks = safe_load_json(time_range_by_block)
                if not blocks:
                    continue

                cur.execute(
                    """
                    SELECT
                      task_name,
                      task_description,
                      frequency,
                      ai_category,
                      ai_impact_level,
                      ai_effort_to_implement
                    FROM job_micro_tasks
                    WHERE occupation_id = %s AND ai_applicable = true
                    """,
                    (occ_id,),
                )
                microtasks = [
                    {
                        "title": row[0],
                        "description": row[1],
                        "frequency": row[2],
                        "ai_category": row[3],
                        "ai_impact_level": row[4],
                        "ai_effort_to_implement": row[5],
                    }
                    for row in cur.fetchall()
                ]

                cur.execute(
                    """
                    SELECT
                      task_title,
                      task_description,
                      ai_automation_score,
                      estimated_time_saved_percent,
                      gwa_title
                    FROM onet_tasks
                    WHERE occupation_id = %s
                      AND ai_automation_score IS NOT NULL
                    ORDER BY ai_automation_score DESC NULLS LAST
                    LIMIT 100
                    """,
                    (occ_id,),
                )
                onet_tasks = [
                    {
                        "title": row[0],
                        "description": row[1],
                        "ai_automation_score": row[2],
                        "estimated_time_saved_percent": row[3],
                        "gwa_title": row[4],
                    }
                    for row in cur.fetchall()
                ]

                cur.execute(
                    """
                    SELECT DISTINCT
                      d.dwa_title,
                      d.avg_automation_score,
                      d.occupation_count
                    FROM detailed_work_activities d
                    JOIN tasks_to_dwas t ON t.dwa_id = d.dwa_id
                    WHERE t.occupation_id = %s
                    ORDER BY d.avg_automation_score DESC NULLS LAST
                    LIMIT 100
                    """,
                    (occ_id,),
                )
                dwas = [
                    {
                        "title": row[0],
                        "avg_automation_score": row[1],
                        "occupation_count": row[2],
                    }
                    for row in cur.fetchall()
                ]

                cur.execute(
                    """
                    SELECT
                      element_name,
                      importance,
                      level
                    FROM onet_work_activities
                    WHERE occupation_id = %s
                    ORDER BY importance DESC NULLS LAST, level DESC NULLS LAST
                    LIMIT 100
                    """,
                    (occ_id,),
                )
                work_activities = [
                    {
                        "title": row[0],
                        "importance": row[1],
                        "level": row[2],
                    }
                    for row in cur.fetchall()
                ]

                grouped: dict[str, list[dict]] = defaultdict(list)

                for task in microtasks:
                    block = infer_block_for_microtask(task["title"], task["description"], task["ai_category"])
                    grouped[block].append(
                        {
                            "title": normalize_title(task["title"]),
                            "source": "microtask",
                            "score": rank_microtask(task),
                        }
                    )

                for task in onet_tasks:
                    block = infer_block_for_onet_task(task["title"], task["description"], task["gwa_title"])
                    grouped[block].append(
                        {
                            "title": normalize_title(task["title"]),
                            "source": "onet_task",
                            "score": rank_onet_task(task),
                        }
                    )

                for task in dwas:
                    block = infer_block_for_dwa(task["title"])
                    grouped[block].append(
                        {
                            "title": normalize_title(task["title"]),
                            "source": "dwa",
                            "score": rank_dwa(task),
                        }
                    )

                for task in work_activities:
                    block = infer_block_for_work_activity(task["title"])
                    grouped[block].append(
                        {
                            "title": normalize_title(task["title"]),
                            "source": "work_activity",
                            "score": rank_work_activity(task),
                        }
                    )

                block_previews = []
                sorted_blocks = sorted(
                    blocks.items(),
                    key=lambda item: midpoint(int(item[1].get("low", 0) or 0), int(item[1].get("high", 0) or 0)),
                    reverse=True,
                )

                for block, range_data in sorted_blocks:
                    low = int(range_data.get("low", 0) or 0)
                    high = int(range_data.get("high", 0) or 0)
                    if midpoint(low, high) < 3:
                        continue

                    candidates = grouped.get(block, [])
                    microtask_candidates = sorted(
                        [row for row in candidates if row["source"] == "microtask"],
                        key=lambda row: row["score"],
                        reverse=True,
                    )
                    fallback_candidates = sorted(
                        [row for row in candidates if row["source"] != "microtask"],
                        key=lambda row: row["score"],
                        reverse=True,
                    )
                    examples = dedupe_examples(microtask_candidates, limit=4)
                    if len(examples) < 4:
                        seen = {example["title"].lower() for example in examples}
                        for candidate in fallback_candidates:
                            if candidate["title"].lower() in seen:
                                continue
                            examples.append(candidate)
                            seen.add(candidate["title"].lower())
                            if len(examples) >= 4:
                                break

                    block_previews.append(
                        {
                            "block": block,
                            "label": BLOCK_LABELS.get(block, block),
                            "low": low,
                            "high": high,
                            "examples": examples,
                        }
                    )

                if block_previews:
                    block_previews = block_previews[:4]
                    previews.append(
                        {
                            "title": title,
                            "slug": occ_slug,
                            "majorCategory": major_category,
                            "blocks": block_previews,
                        }
                    )

            previews = previews[:limit]

        REPORT_JSON.write_text(json.dumps({"occupations": previews}, indent=2), encoding="utf-8")
        REPORT_MD.write_text(build_markdown(previews), encoding="utf-8")
        print(f"Previewed {len(previews)} occupations")
        print(f"Wrote {REPORT_MD.relative_to(ROOT)}")
        print(f"Wrote {REPORT_JSON.relative_to(ROOT)}")
    finally:
        conn.close()


def build_markdown(previews: list[dict]) -> str:
    lines = [
        "# Block Example Preview",
        "",
        "Non-destructive preview of block example routines derived from microtasks first, then O*NET fallbacks.",
        "",
    ]

    for occupation in previews:
        lines.extend(
            [
                f"## {occupation['title']}",
                "",
                f"- Slug: `{occupation['slug']}`",
                f"- Category: {occupation['majorCategory']}",
                "",
            ]
        )
        for block in occupation["blocks"]:
            lines.append(f"### {block['label']} ({block['low']}-{block['high']} min)")
            lines.append("")
            if block["examples"]:
                for example in block["examples"]:
                    lines.append(f"- {example['title']} `{example['source']}`")
            else:
                lines.append("- No examples")
            lines.append("")

    return "\n".join(lines)


if __name__ == "__main__":
    main()
