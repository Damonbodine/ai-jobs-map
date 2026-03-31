"""
Generic O*NET dimensional data importer.
Handles Abilities, Knowledge, and Work Activities Excel files,
which all share the same column structure:
  O*NET-SOC Code | Title | Element ID | Element Name | Scale ID | Scale Name | Data Value | ...
"""
import sys
import os
import openpyxl

# Allow imports from project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from scripts.pipeline.db import get_db, get_occupation_lookup, match_occupation


def import_dimension(excel_path, table_name, source_label):
    """
    Import an O*NET dimensional Excel file into the database.

    Reads both Importance (IM) and Level (LV) scales per element per occupation,
    then merges them into a single row with importance + level columns.
    """
    print(f"Importing {source_label} from {excel_path}...")

    conn = get_db()
    cur = conn.cursor()

    # Create table if not exists
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id SERIAL PRIMARY KEY,
            onet_soc_code TEXT NOT NULL,
            element_id TEXT NOT NULL,
            element_name TEXT NOT NULL,
            importance REAL,
            level REAL,
            occupation_id INTEGER REFERENCES occupations(id),
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    """)
    cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_soc ON {table_name}(onet_soc_code)")
    cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_occ ON {table_name}(occupation_id)")
    cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_elem ON {table_name}(element_id)")
    conn.commit()

    # Load occupation lookup
    occ_lookup = get_occupation_lookup(cur)

    # Read Excel — collect both IM and LV per (soc_code, element_id)
    wb = openpyxl.load_workbook(excel_path, read_only=True)
    ws = wb.active

    # Accumulate: key = (soc_code, element_id) → {title, element_name, im, lv}
    records = {}

    for row in ws.iter_rows(min_row=2, values_only=True):
        soc_code = row[0]    # O*NET-SOC Code
        title = row[1]       # Occupation title
        element_id = row[2]  # Element ID
        element_name = row[3] # Element Name
        scale_id = row[4]    # "IM" or "LV"
        data_value = row[6]  # Numeric score

        if not soc_code or not element_id:
            continue

        key = (soc_code, element_id)
        if key not in records:
            records[key] = {
                'title': title,
                'element_name': element_name,
                'im': None,
                'lv': None,
            }

        if scale_id == 'IM':
            records[key]['im'] = float(data_value) if data_value is not None else None
        elif scale_id == 'LV':
            records[key]['lv'] = float(data_value) if data_value is not None else None

    wb.close()
    print(f"  Parsed {len(records)} unique (occupation, element) pairs")

    # Clear existing data for clean re-import
    cur.execute(f"DELETE FROM {table_name}")

    # Batch insert
    inserted = 0
    skipped = 0
    batch = []

    for (soc_code, element_id), rec in records.items():
        occupation_id = match_occupation(rec['title'], occ_lookup)
        if not occupation_id:
            skipped += 1
            continue

        batch.append((
            soc_code,
            element_id,
            rec['element_name'],
            rec['im'],
            rec['lv'],
            occupation_id,
        ))
        inserted += 1

        if len(batch) >= 500:
            _insert_batch(cur, table_name, batch)
            batch = []
            conn.commit()
            print(f"  Inserted {inserted} rows...")

    if batch:
        _insert_batch(cur, table_name, batch)

    # Record data version
    cur.execute("""
        CREATE TABLE IF NOT EXISTS data_versions (
            id SERIAL PRIMARY KEY,
            source TEXT NOT NULL,
            version TEXT NOT NULL,
            imported_at TIMESTAMP DEFAULT NOW() NOT NULL,
            record_count INTEGER,
            checksum TEXT
        )
    """)
    cur.execute("""
        INSERT INTO data_versions (source, version, record_count)
        VALUES (%s, %s, %s)
    """, (source_label, 'onet_30.x', inserted))

    conn.commit()
    conn.close()

    print(f"Done! Imported {inserted} rows, skipped {skipped} (no matching occupation)")
    return inserted


def _insert_batch(cur, table_name, batch):
    """Insert a batch of records."""
    args_str = ','.join(
        cur.mogrify("(%s,%s,%s,%s,%s,%s)", row).decode()
        for row in batch
    )
    cur.execute(f"""
        INSERT INTO {table_name}
        (onet_soc_code, element_id, element_name, importance, level, occupation_id)
        VALUES {args_str}
    """)
