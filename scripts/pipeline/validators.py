#!/usr/bin/env python3
"""
Data quality validators — run after pipeline stages to catch issues.

Usage:
    python scripts/pipeline/validators.py
    python scripts/pipeline/orchestrator.py --validate
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from scripts.pipeline.db import get_db


def validate(name, query, check_fn, conn):
    """Run a single validation check."""
    cur = conn.cursor()
    cur.execute(query)
    result = cur.fetchone()
    passed, detail = check_fn(result)
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {name}: {detail}")
    return passed


def run_all():
    conn = get_db()
    results = []

    print("\nRunning data quality validators...\n")

    # 1. Occupation count matches expectation
    results.append(validate(
        "Occupation count >= 800",
        "SELECT COUNT(*) FROM occupations",
        lambda r: (r[0] >= 800, f"{r[0]} occupations"),
        conn
    ))

    # 2. O*NET abilities imported
    results.append(validate(
        "Abilities data imported (>20K rows)",
        "SELECT COUNT(*) FROM onet_abilities",
        lambda r: (r[0] >= 20000, f"{r[0]} ability rows"),
        conn
    ))

    # 3. O*NET knowledge imported
    results.append(validate(
        "Knowledge data imported (>15K rows)",
        "SELECT COUNT(*) FROM onet_knowledge",
        lambda r: (r[0] >= 15000, f"{r[0]} knowledge rows"),
        conn
    ))

    # 4. O*NET work activities imported
    results.append(validate(
        "Work activities data imported (>20K rows)",
        "SELECT COUNT(*) FROM onet_work_activities",
        lambda r: (r[0] >= 20000, f"{r[0]} work activity rows"),
        conn
    ))

    # 5. Composite scores calculated for all occupations
    results.append(validate(
        "Every occupation has a composite score",
        """SELECT
            (SELECT COUNT(*) FROM occupations) as total,
            (SELECT COUNT(*) FROM occupation_automation_profile) as scored
        """,
        lambda r: (r[0] == r[1], f"{r[1]}/{r[0]} scored"),
        conn
    ))

    # 6. Composite scores in valid range
    results.append(validate(
        "Composite scores between 0-100",
        "SELECT MIN(composite_score), MAX(composite_score) FROM occupation_automation_profile",
        lambda r: (
            r[0] >= 0 and r[1] <= 100,
            f"range: {r[0]:.1f} - {r[1]:.1f}"
        ),
        conn
    ))

    # 7. Score distribution isn't degenerate (range > 5 points)
    results.append(validate(
        "Score distribution has reasonable spread (>5 pts)",
        "SELECT MAX(composite_score) - MIN(composite_score) FROM occupation_automation_profile",
        lambda r: (r[0] > 5, f"spread: {r[0]:.1f} points"),
        conn
    ))

    # 8. Multi-signal coverage (occupations with full dimensional data)
    results.append(validate(
        "Multi-signal coverage >50% of occupations",
        """SELECT
            COUNT(*) FILTER (WHERE ability_automation_potential IS NOT NULL) as multi,
            COUNT(*) as total
        FROM occupation_automation_profile""",
        lambda r: (
            r[0] / r[1] > 0.5 if r[1] > 0 else False,
            f"{r[0]}/{r[1]} ({100*r[0]/r[1]:.0f}%) have full dimensional data"
        ),
        conn
    ))

    # 9. O*NET tasks exist
    results.append(validate(
        "O*NET tasks imported (>10K)",
        "SELECT COUNT(*) FROM onet_tasks",
        lambda r: (r[0] >= 10000, f"{r[0]} tasks"),
        conn
    ))

    # 10. Micro tasks exist
    results.append(validate(
        "Micro tasks generated (>5K)",
        "SELECT COUNT(*) FROM job_micro_tasks",
        lambda r: (r[0] >= 5000, f"{r[0]} micro tasks"),
        conn
    ))

    # 11. Sanity: data entry should score higher than janitors
    results.append(validate(
        "Sanity: data entry > janitors in composite score",
        """SELECT
            (SELECT composite_score FROM occupation_automation_profile p
             JOIN occupations o ON o.id = p.occupation_id
             WHERE LOWER(o.title) LIKE '%data entry%' LIMIT 1) as data_entry,
            (SELECT composite_score FROM occupation_automation_profile p
             JOIN occupations o ON o.id = p.occupation_id
             WHERE LOWER(o.title) LIKE '%janitor%' LIMIT 1) as janitor
        """,
        lambda r: (
            (r[0] or 0) > (r[1] or 0),
            f"data entry={r[0]:.1f}, janitors={r[1]:.1f}"
        ) if r[0] and r[1] else (False, "missing occupations"),
        conn
    ))

    # 12. No orphaned automation profiles
    results.append(validate(
        "No orphaned automation profiles",
        """SELECT COUNT(*) FROM occupation_automation_profile p
           LEFT JOIN occupations o ON o.id = p.occupation_id
           WHERE o.id IS NULL""",
        lambda r: (r[0] == 0, f"{r[0]} orphans"),
        conn
    ))

    # 13. Factory tables populated
    results.append(validate(
        "Automation actions exist (>10)",
        "SELECT COUNT(*) FROM automation_actions",
        lambda r: (r[0] >= 10, f"{r[0]} actions"),
        conn
    ))

    results.append(validate(
        "Automation workflows exist (>5)",
        "SELECT COUNT(*) FROM automation_workflows",
        lambda r: (r[0] >= 5, f"{r[0]} workflows"),
        conn
    ))

    results.append(validate(
        "Automation packages exist (>5)",
        "SELECT COUNT(*) FROM automation_packages",
        lambda r: (r[0] >= 5, f"{r[0]} packages"),
        conn
    ))

    # Summary
    passed = sum(results)
    total = len(results)
    print(f"\n{'='*50}")
    print(f"  {passed}/{total} checks passed")
    if passed < total:
        print(f"  {total - passed} check(s) FAILED")
    print(f"{'='*50}")

    conn.close()
    return all(results)


if __name__ == '__main__':
    success = run_all()
    sys.exit(0 if success else 1)
