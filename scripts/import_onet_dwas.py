#!/usr/bin/env python3
"""
Import O*NET Tasks-to-DWAs mappings from Excel.
Populates both detailed_work_activities and tasks_to_dwas tables.
Also updates DWA metadata (occupation_count, avg_automation_score).
"""
import sys
import os
import openpyxl
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.db import get_db, get_occupation_lookup, match_occupation


def run():
    print("Importing O*NET Tasks-to-DWAs mappings...")

    conn = get_db()
    cur = conn.cursor()

    occ_lookup = get_occupation_lookup(cur)

    wb = openpyxl.load_workbook('data/onet/Tasks_to_DWAs.xlsx', read_only=True)
    ws = wb.active

    # Collect DWAs and mappings
    dwas = {}  # dwa_id → {title, iwa_id, occupations: set}
    mappings = []

    for row in ws.iter_rows(min_row=2, values_only=True):
        soc_code = row[0]
        title = row[1]
        task_id = str(row[2]) if row[2] else None
        dwa_id = row[4]
        dwa_title = row[5]

        if not dwa_id or not task_id:
            continue

        occupation_id = match_occupation(title, occ_lookup)

        # Extract IWA ID from DWA ID (e.g., "4.A.2.a.4.I09.D03" → IWA is "4.A.2.a.4.I09")
        parts = dwa_id.rsplit('.', 1)
        iwa_id = parts[0] if len(parts) > 1 else None

        # Extract GWA title from IWA prefix (e.g., "4.A.2.a.4" maps to a GWA)
        # GWA is the first 5 segments: "4.A.2.a.4"
        gwa_parts = dwa_id.split('.')
        gwa_id = '.'.join(gwa_parts[:5]) if len(gwa_parts) >= 5 else None

        if dwa_id not in dwas:
            dwas[dwa_id] = {
                'title': dwa_title,
                'iwa_id': iwa_id,
                'gwa_id': gwa_id,
                'occupations': set(),
            }

        if occupation_id:
            dwas[dwa_id]['occupations'].add(occupation_id)
            mappings.append((task_id, soc_code, dwa_id, occupation_id))

    wb.close()
    print(f"  Parsed {len(dwas)} unique DWAs, {len(mappings)} mappings")

    # Clear and re-insert DWAs
    cur.execute("DELETE FROM tasks_to_dwas")
    cur.execute("DELETE FROM detailed_work_activities")

    # Insert DWAs
    dwa_count = 0
    for dwa_id, info in dwas.items():
        cur.execute("""
            INSERT INTO detailed_work_activities (dwa_id, dwa_title, iwa_id, occupation_count)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (dwa_id) DO UPDATE SET
                occupation_count = EXCLUDED.occupation_count
        """, (dwa_id, info['title'], info['iwa_id'], len(info['occupations'])))
        dwa_count += 1

    conn.commit()
    print(f"  Inserted {dwa_count} DWAs")

    # Insert mappings in batches
    batch = []
    for task_id, soc_code, dwa_id, occ_id in mappings:
        batch.append(cur.mogrify("(%s,%s,%s,%s)", (task_id, soc_code, dwa_id, occ_id)).decode())
        if len(batch) >= 500:
            cur.execute(f"INSERT INTO tasks_to_dwas (task_id, onet_soc_code, dwa_id, occupation_id) VALUES {','.join(batch)}")
            batch = []
            conn.commit()

    if batch:
        cur.execute(f"INSERT INTO tasks_to_dwas (task_id, onet_soc_code, dwa_id, occupation_id) VALUES {','.join(batch)}")
    conn.commit()

    print(f"  Inserted {len(mappings)} task-to-DWA mappings")

    # Update avg_automation_score on DWAs from linked onet_tasks
    cur.execute("""
        UPDATE detailed_work_activities d SET
            avg_automation_score = sub.avg_score
        FROM (
            SELECT t.dwa_id, AVG(ot.ai_automation_score)::int as avg_score
            FROM tasks_to_dwas t
            JOIN onet_tasks ot ON ot.task_id = t.task_id AND ot.onet_soc_code = t.onet_soc_code
            WHERE ot.ai_automation_score IS NOT NULL
            GROUP BY t.dwa_id
        ) sub
        WHERE d.dwa_id = sub.dwa_id
    """)
    conn.commit()

    # Summary
    cur.execute("SELECT COUNT(*) FROM detailed_work_activities WHERE occupation_count > 0")
    active = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM detailed_work_activities WHERE avg_automation_score IS NOT NULL")
    scored = cur.fetchone()[0]

    print(f"\nDone! {dwa_count} DWAs ({active} with occupations, {scored} with automation scores)")
    print(f"  {len(mappings)} task-to-DWA mappings")

    conn.close()


if __name__ == "__main__":
    run()
