#!/usr/bin/env python3
"""
Persist derived block example tasks onto occupation_automation_profile.block_example_tasks.

Default mode is dry-run. Pass --apply to write changes.
Optionally pass --slug <occupation-slug> to scope the run.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.pipeline.db import get_db
from scripts.block_example_utils import (
    dedupe_examples,
    infer_block_for_dwa,
    infer_block_for_microtask,
    infer_block_for_onet_task,
    infer_block_for_work_activity,
    midpoint,
    normalize_title,
    rank_dwa,
    rank_microtask,
    rank_onet_task,
    rank_work_activity,
    safe_load_json,
)


def parse_args(argv: list[str]) -> tuple[bool, str | None]:
    apply = "--apply" in argv
    slug = None
    if "--slug" in argv:
      idx = argv.index("--slug")
      if idx + 1 >= len(argv):
          raise SystemExit("--slug requires a value")
      slug = argv[idx + 1]
    return apply, slug


def build_examples_for_occupation(cur, occ_id: int, blocks: dict) -> dict:
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
        LIMIT 150
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
        LIMIT 150
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

    persisted = {}
    sorted_blocks = sorted(
        blocks.items(),
        key=lambda item: midpoint(int(item[1].get("low", 0) or 0), int(item[1].get("high", 0) or 0)),
        reverse=True,
    )

    for block, range_data in sorted_blocks:
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

        if examples:
            persisted[block] = {"examples": examples}

    return persisted


def main() -> None:
    apply, slug = parse_args(sys.argv[1:])
    conn = get_db()
    updated = 0
    sampled = []

    try:
        with conn.cursor() as cur:
            try:
                cur.execute("ALTER TABLE occupation_automation_profile ADD COLUMN block_example_tasks TEXT")
                conn.commit()
            except Exception:
                conn.rollback()

            cur.execute(
                """
                SELECT
                  o.id,
                  o.slug,
                  p.time_range_by_block
                FROM occupations o
                JOIN occupation_automation_profile p ON p.occupation_id = o.id
                ORDER BY o.title ASC
                """
            )
            rows = cur.fetchall()
            if slug:
                rows = [row for row in rows if row[1] == slug]

            for occ_id, occ_slug, time_range_by_block in rows:
                blocks = safe_load_json(time_range_by_block)
                if not blocks:
                    continue

                persisted = build_examples_for_occupation(cur, occ_id, blocks)
                if not persisted:
                    continue

                sampled.append((occ_slug, list(persisted.keys())[:3]))
                if apply:
                    cur.execute(
                        """
                        UPDATE occupation_automation_profile
                        SET block_example_tasks = %s, updated_at = NOW()
                        WHERE occupation_id = %s
                        """,
                        (json.dumps(persisted), occ_id),
                    )
                updated += 1

        if apply:
            conn.commit()
        else:
            conn.rollback()
    finally:
        conn.close()

    mode = "Applied" if apply else "Dry-run generated"
    print(f"{mode} block examples for {updated} occupations")
    for occ_slug, blocks in sampled[:25]:
        print(f"- {occ_slug}: {', '.join(blocks)}")


if __name__ == "__main__":
    main()
