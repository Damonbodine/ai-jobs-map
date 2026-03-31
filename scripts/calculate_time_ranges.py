#!/usr/bin/env python3
"""
Calculate O*NET-grounded time savings ranges per occupation.

Instead of relying on LLM-generated micro-tasks for time estimates,
this derives ranges from actual O*NET task data:

Conservative (low): Tasks with automation score >= 70, assume 20% of task time is recoverable
Optimistic (high): Tasks with automation score >= 50, assume 35% of task time is recoverable
Cap: 90 min/day maximum (1.5 hours — credible upper bound)

Each task's time share = 480 minutes (8h day) / number of O*NET tasks for the occupation.
Archetype multiplier scales both ends of the range.

Also computes per-work-block ranges (intake, analysis, documentation, coordination, exceptions)
so the agent cards can show matching numbers.
"""
import sys
import os
import json
import re

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.db import get_db

# Work block classification — maps task text to work block categories
BLOCK_PATTERNS = {
    'coordination': re.compile(
        r'schedul|follow[- ]?up|coordinat|communicat|notify|respond|meeting|handoff|route|confer|consult|collab',
        re.IGNORECASE
    ),
    'analysis': re.compile(
        r'analy|evaluat|compar|research|assess|forecast|estimat|study|review|examin|interpret|diagnos|investigat|determin',
        re.IGNORECASE
    ),
    'documentation': re.compile(
        r'design|draft|document|report|write|plan|layout|prepar|record|maintain.*record|compil|summar|creat.*report',
        re.IGNORECASE
    ),
    'exceptions': re.compile(
        r'inspect|validat|verif|check|monitor|audit|complian|quality|exception|test|calibrat',
        re.IGNORECASE
    ),
}


def classify_task_block(task_text):
    """Assign a task to a work block based on text content."""
    for block, pattern in BLOCK_PATTERNS.items():
        if pattern.search(task_text):
            return block
    return 'intake'  # default


def run():
    conn = get_db()
    cur = conn.cursor()

    # Add columns if they don't exist
    for col, dtype in [('time_range_low', 'INTEGER'), ('time_range_high', 'INTEGER'), ('time_range_by_block', 'TEXT')]:
        try:
            cur.execute(f"ALTER TABLE occupation_automation_profile ADD COLUMN {col} {dtype}")
            conn.commit()
        except Exception:
            conn.rollback()

    # Get all occupations with automation profiles
    cur.execute("""
        SELECT o.id, o.title, p.physical_ability_avg
        FROM occupations o
        JOIN occupation_automation_profile p ON p.occupation_id = o.id
    """)
    occupations = cur.fetchall()
    print(f"Calculating time ranges for {len(occupations)} occupations...")

    updated = 0
    no_tasks = 0

    for occ_id, occ_title, phys_avg in occupations:
        # Get O*NET tasks with automation scores
        cur.execute("""
            SELECT task_title, task_description, ai_automation_score, gwa_title
            FROM onet_tasks
            WHERE occupation_id = %s AND ai_automation_score IS NOT NULL
        """, (occ_id,))
        tasks = cur.fetchall()

        if not tasks:
            no_tasks += 1
            continue

        n = len(tasks)
        min_per_task = 480.0 / n

        # Archetype multiplier
        if phys_avg is not None and phys_avg > 2.5:
            mult = 0.3
        elif phys_avg is not None and phys_avg > 2.0:
            mult = 0.6
        elif phys_avg is not None:
            mult = 1.0
        else:
            mult = 0.5

        # Per-block accumulators
        block_low = {'intake': 0, 'analysis': 0, 'documentation': 0, 'coordination': 0, 'exceptions': 0}
        block_high = {'intake': 0, 'analysis': 0, 'documentation': 0, 'coordination': 0, 'exceptions': 0}

        total_low = 0
        total_high = 0

        for title, desc, score, gwa in tasks:
            text = f"{title} {desc or ''} {gwa or ''}"
            block = classify_task_block(text)

            # Conservative: score >= 70, save 20%
            if score >= 70:
                saved = min_per_task * 0.20
                total_low += saved
                block_low[block] += saved

            # Optimistic: score >= 50, save 35%
            if score >= 50:
                saved = min_per_task * 0.35
                total_high += saved
                block_high[block] += saved

        # Apply multiplier and cap
        range_low = max(5, round(total_low * mult))
        range_high = min(90, max(range_low + 5, round(total_high * mult)))

        # Scale blocks proportionally to match totals
        def scale_blocks(raw_blocks, target):
            raw_total = sum(raw_blocks.values())
            if raw_total == 0:
                return {k: 0 for k in raw_blocks}
            scale = target / raw_total
            return {k: max(0, round(v * scale)) for k, v in raw_blocks.items()}

        blocks_low_scaled = scale_blocks(block_low, range_low)
        blocks_high_scaled = scale_blocks(block_high, range_high)

        # Merge into per-block ranges
        block_ranges = {}
        for block in ['intake', 'analysis', 'documentation', 'coordination', 'exceptions']:
            lo = blocks_low_scaled.get(block, 0)
            hi = blocks_high_scaled.get(block, 0)
            if lo > 0 or hi > 0:
                block_ranges[block] = {'low': lo, 'high': max(lo, hi)}

        # Update
        cur.execute("""
            UPDATE occupation_automation_profile SET
                time_range_low = %s,
                time_range_high = %s,
                time_range_by_block = %s,
                updated_at = NOW()
            WHERE occupation_id = %s
        """, (range_low, range_high, json.dumps(block_ranges), occ_id))

        updated += 1
        if updated % 100 == 0:
            conn.commit()
            print(f"  {updated} updated...")

    conn.commit()

    # Summary
    cur.execute("SELECT MIN(time_range_low), AVG(time_range_low), MAX(time_range_low) FROM occupation_automation_profile WHERE time_range_low IS NOT NULL")
    lo_min, lo_avg, lo_max = cur.fetchone()
    cur.execute("SELECT MIN(time_range_high), AVG(time_range_high), MAX(time_range_high) FROM occupation_automation_profile WHERE time_range_high IS NOT NULL")
    hi_min, hi_avg, hi_max = cur.fetchone()

    print(f"\nDone! Updated {updated}, skipped {no_tasks} (no O*NET tasks)")
    print(f"Low range:  min={lo_min}, avg={lo_avg:.0f}, max={lo_max}")
    print(f"High range: min={hi_min}, avg={hi_avg:.0f}, max={hi_max}")

    # Spot checks
    print("\nSpot checks:")
    for title in ['data entry keyers', 'accountants and auditors', 'dancers', 'firefighters', 'registered nurses', 'software developers', 'general and operations managers', 'diagnostic medical sonographers']:
        cur.execute("""
            SELECT o.title, p.time_range_low, p.time_range_high, p.time_range_by_block
            FROM occupation_automation_profile p
            JOIN occupations o ON o.id = p.occupation_id
            WHERE LOWER(o.title) LIKE %s LIMIT 1
        """, (f'%{title}%',))
        row = cur.fetchone()
        if row:
            blocks = json.loads(row[3]) if row[3] else {}
            block_str = ', '.join(f"{k}:{v['low']}-{v['high']}" for k, v in blocks.items() if v['high'] > 0)
            print(f"  {row[0][:35]:36s} {row[1]:2d}–{row[2]:2d} min/day  [{block_str}]")

    conn.close()


if __name__ == "__main__":
    run()
