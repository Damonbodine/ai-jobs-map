#!/usr/bin/env python3
"""
Heuristic backfill for missing microtask AI metadata.

Fills missing values on ai-applicable tasks:
- ai_category
- ai_impact_level
- ai_effort_to_implement
- ai_how_it_helps

Default mode is dry-run. Pass --apply to write changes.
Optionally pass --slug <occupation-slug> to scope the run.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.pipeline.db import get_db


CATEGORY_RULES = [
    (
        "communication",
        [
            "communicat",
            "passenger",
            "customer",
            "supplier",
            "stakeholder",
            "message",
            "brief",
            "update",
            "coordinate",
            "collaborate",
        ],
    ),
    (
        "data_analysis",
        [
            "monitor",
            "track",
            "calculate",
            "analy",
            "audit",
            "metric",
            "log",
            "record",
            "dashboard",
            "forecast",
        ],
    ),
    (
        "decision_support",
        [
            "optimiz",
            "plan",
            "assess",
            "evaluate",
            "review",
            "route",
            "ensure compliance",
            "risk",
            "priorit",
        ],
    ),
    (
        "research_discovery",
        [
            "research",
            "investigat",
            "compare",
            "weather",
            "find",
            "gather",
            "inspect",
        ],
    ),
    (
        "learning_education",
        [
            "train",
            "teach",
            "educat",
            "coach",
            "brief new",
            "onboard",
        ],
    ),
    (
        "creative_assistance",
        [
            "create",
            "draft",
            "write",
            "present",
            "design",
            "content",
        ],
    ),
    (
        "task_automation",
        [
            "schedule",
            "process",
            "prepare",
            "maintain",
            "update",
            "file",
            "submit",
        ],
    ),
]


HOW_IT_HELPS = {
    "communication": "Prepares repetitive updates, drafts responses, and keeps follow-up moving.",
    "data_analysis": "Pulls together signals faster and prepares the numbers or logs for review.",
    "decision_support": "Organizes context and prepares the next decision instead of starting from scratch.",
    "research_discovery": "Finds relevant source material and prepares useful context faster.",
    "learning_education": "Prepares training material and recurring enablement content.",
    "creative_assistance": "Prepares first drafts and recurring output closer to finished.",
    "task_automation": "Handles repetitive setup steps and keeps the work moving in the background.",
    "documentation": "Prepares recurring documents and records so the work starts closer to finished.",
    "intake": "Sorts incoming work and organizes the next step before a person has to intervene.",
}


def parse_args(argv: list[str]) -> tuple[bool, str | None]:
    apply = "--apply" in argv
    slug = None
    if "--slug" in argv:
        index = argv.index("--slug")
        if index + 1 >= len(argv):
            raise SystemExit("--slug requires a value")
        slug = argv[index + 1]
    return apply, slug


def infer_category(task_name: str, task_description: str) -> str:
    text = f"{task_name} {task_description}".lower()
    for category, keywords in CATEGORY_RULES:
        if any(keyword in text for keyword in keywords):
            return category
    return "task_automation"


def infer_impact_level(task_name: str, task_description: str, frequency: str) -> int:
    base = {
        "daily": 4,
        "weekly": 3,
        "monthly": 2,
        "as-needed": 2,
    }.get(frequency, 2)
    text = f"{task_name} {task_description}".lower()
    if any(keyword in text for keyword in ["monitor", "log", "record", "document", "schedule", "update"]):
        base += 1
    if any(keyword in text for keyword in ["emergency", "compliance", "safety", "risk"]):
        base -= 1
    return max(1, min(5, base))


def infer_effort(task_name: str, task_description: str, category: str) -> int:
    text = f"{task_name} {task_description}".lower()
    base = {
        "communication": 2,
        "task_automation": 2,
        "creative_assistance": 2,
        "data_analysis": 3,
        "research_discovery": 3,
        "decision_support": 3,
        "learning_education": 2,
    }.get(category, 3)
    if any(keyword in text for keyword in ["compliance", "emergency", "safety", "route"]):
        base += 1
    return max(1, min(5, base))


def main() -> None:
    apply, slug = parse_args(sys.argv[1:])
    conn = get_db()
    updated = 0
    sampled: list[tuple] = []

    try:
        with conn.cursor() as cur:
            sql = """
                SELECT
                    j.id,
                    o.slug,
                    j.task_name,
                    j.task_description,
                    j.frequency,
                    j.ai_category,
                    j.ai_impact_level,
                    j.ai_effort_to_implement,
                    j.ai_how_it_helps
                FROM job_micro_tasks j
                JOIN occupations o ON o.id = j.occupation_id
                WHERE j.ai_applicable = true
                  AND (
                    j.ai_category IS NULL
                    OR j.ai_impact_level IS NULL
                    OR j.ai_effort_to_implement IS NULL
                    OR j.ai_how_it_helps IS NULL
                  )
            """
            params: list[str] = []
            if slug:
                sql += " AND o.slug = %s"
                params.append(slug)
            sql += " ORDER BY o.slug, j.id"
            cur.execute(sql, params)
            rows = cur.fetchall()

            for row in rows:
                task_id, occ_slug, task_name, task_description, frequency, ai_category, ai_impact, ai_effort, ai_help = row
                category = ai_category or infer_category(task_name, task_description or "")
                impact = ai_impact or infer_impact_level(task_name, task_description or "", frequency)
                effort = ai_effort or infer_effort(task_name, task_description or "", category)
                how_it_helps = ai_help or HOW_IT_HELPS.get(
                    category,
                    "Handles repetitive setup work and prepares the next step for review.",
                )

                sampled.append((occ_slug, task_name, category, impact, effort))

                if apply:
                    cur.execute(
                        """
                        UPDATE job_micro_tasks
                        SET
                          ai_category = COALESCE(ai_category, %s),
                          ai_impact_level = COALESCE(ai_impact_level, %s),
                          ai_effort_to_implement = COALESCE(ai_effort_to_implement, %s),
                          ai_how_it_helps = COALESCE(ai_how_it_helps, %s)
                        WHERE id = %s
                        """,
                        (category, impact, effort, how_it_helps, task_id),
                    )
                updated += 1

        if apply:
            conn.commit()
        else:
            conn.rollback()
    finally:
        conn.close()

    mode = "Applied" if apply else "Dry-run sampled"
    print(f"{mode} {updated} microtask metadata backfills")
    for occ_slug, task_name, category, impact, effort in sampled[:25]:
        print(f"- {occ_slug}: {task_name} -> {category}, impact {impact}, effort {effort}")


if __name__ == "__main__":
    main()
