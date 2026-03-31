#!/usr/bin/env python3
"""
Seed automation benchmarks from published research.
Sources: Frey & Osborne (2017), OECD (2019).

These serve as calibration signals — if our composite score diverges
significantly from published research, the occupation gets flagged for review.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.db import get_db, get_occupation_lookup, match_occupation

# Frey & Osborne (2017) — "The Future of Employment"
# Probability of computerisation (0-1)
# Selected occupations that overlap with our BLS data
FREY_OSBORNE = [
    # High automation probability (>0.8)
    ("Telemarketers", 0.99),
    ("Accountants and auditors", 0.94),
    ("Retail salespersons", 0.92),
    ("Technical writers", 0.89),
    ("Real estate sales agents", 0.86),
    ("Word processors and typists", 0.81),
    ("Bookkeeping accounting and auditing clerks", 0.98),
    ("Data entry keyers", 0.99),
    ("Tax preparers", 0.99),
    ("Insurance underwriters", 0.99),
    ("Loan officers", 0.98),
    ("Credit analysts", 0.98),
    ("Cashiers", 0.97),
    ("Cooks fast food", 0.96),
    ("Paralegals and legal assistants", 0.94),
    ("Budget analysts", 0.94),
    ("File clerks", 0.97),
    ("Billing and posting clerks", 0.97),
    ("Order clerks", 0.97),
    ("Payroll and timekeeping clerks", 0.97),
    ("Receptionists and information clerks", 0.96),

    # Medium automation probability (0.3-0.8)
    ("Computer programmers", 0.48),
    ("Software developers", 0.042),  # Very low — creative problem solving
    ("Web developers", 0.21),
    ("Graphic designers", 0.83),
    ("Market research analysts and marketing specialists", 0.61),
    ("Financial analysts", 0.23),
    ("Management analysts", 0.13),
    ("Editors", 0.06),
    ("Pharmacists", 0.01),
    ("Registered nurses", 0.009),
    ("Physicians and surgeons", 0.0042),

    # Low automation probability (<0.3)
    ("Elementary school teachers except special education", 0.004),
    ("Lawyers", 0.035),
    ("Chief executives", 0.015),
    ("Human resources managers", 0.0055),
    ("Public relations specialists", 0.18),
    ("Social workers", 0.035),
    ("Clergy", 0.008),
    ("Firefighters", 0.17),
    ("Police and sheriffs patrol officers", 0.098),
    ("Mental health counselors", 0.0048),
    ("Dental hygienists", 0.68),
    ("Athletic trainers", 0.007),
    ("Recreational therapists", 0.003),
]

# OECD (2019) — "Automation, skills use and training"
# Risk of automation by broad occupation group (0-1)
OECD_BROAD = [
    ("Management", 0.10),
    ("Business and Financial Operations", 0.40),
    ("Computer and Mathematical", 0.15),
    ("Architecture and Engineering", 0.20),
    ("Life Physical and Social Science", 0.15),
    ("Legal", 0.20),
    ("Educational Instruction and Library", 0.08),
    ("Healthcare Practitioners and Technical", 0.12),
    ("Healthcare Support", 0.35),
    ("Protective Service", 0.20),
    ("Food Preparation and Serving", 0.60),
    ("Office and Administrative Support", 0.55),
    ("Sales and Related", 0.50),
    ("Construction and Extraction", 0.40),
    ("Production", 0.55),
    ("Transportation and Material Moving", 0.55),
]


def run():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS automation_benchmarks (
            id SERIAL PRIMARY KEY,
            occupation_id INTEGER REFERENCES occupations(id),
            source TEXT NOT NULL,
            external_score REAL,
            soc_code TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_bench_occ ON automation_benchmarks(occupation_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_bench_src ON automation_benchmarks(source)")
    cur.execute("DELETE FROM automation_benchmarks")

    occ_lookup = get_occupation_lookup(cur)

    # Frey & Osborne
    fo_matched = 0
    for title, score in FREY_OSBORNE:
        occ_id = match_occupation(title, occ_lookup)
        if occ_id:
            cur.execute("""
                INSERT INTO automation_benchmarks (occupation_id, source, external_score, notes)
                VALUES (%s, 'frey_osborne_2017', %s, %s)
            """, (occ_id, score, f"Probability of computerisation for {title}"))
            fo_matched += 1

    # OECD broad categories → apply to all occupations in that category
    oecd_matched = 0
    for category, score in OECD_BROAD:
        cur.execute(
            "SELECT id FROM occupations WHERE major_category = %s",
            (category,)
        )
        for (occ_id,) in cur.fetchall():
            cur.execute("""
                INSERT INTO automation_benchmarks (occupation_id, source, external_score, notes)
                VALUES (%s, 'oecd_2019', %s, %s)
            """, (occ_id, score, f"OECD broad category risk for {category}"))
            oecd_matched += 1

    conn.commit()

    # Divergence analysis: compare our composite scores to benchmarks
    cur.execute("""
        SELECT o.title, p.composite_score, b.external_score, b.source,
               ABS(p.composite_score/100.0 - b.external_score) as divergence
        FROM automation_benchmarks b
        JOIN occupations o ON o.id = b.occupation_id
        JOIN occupation_automation_profile p ON p.occupation_id = b.occupation_id
        WHERE b.source = 'frey_osborne_2017'
        ORDER BY divergence DESC
        LIMIT 10
    """)

    print(f"Seeded {fo_matched} Frey & Osborne benchmarks, {oecd_matched} OECD benchmarks")
    print(f"\nHighest divergence (our score vs Frey & Osborne):")
    for title, our, theirs, source, div in cur.fetchall():
        direction = "↑" if our/100 > theirs else "↓"
        print(f"  {direction} {div:.2f}  ours={our:.0f}%  F&O={theirs*100:.0f}%  {title}")

    conn.close()


if __name__ == "__main__":
    run()
