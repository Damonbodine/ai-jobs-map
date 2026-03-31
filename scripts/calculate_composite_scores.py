#!/usr/bin/env python3
"""
Multi-Signal Composite Automation Scoring Model

Replaces the keyword-only heuristic with a weighted composite using:
  1. Ability automation potential (0.30) — physical vs cognitive-routine vs creative
  2. Work activity automation potential (0.25) — GWA-level automation mapping
  3. Keyword score (0.20) — existing task text analysis (kept but reduced weight)
  4. Knowledge digital readiness (0.15) — tech/data knowledge profile
  5. Task frequency weight (0.10) — higher frequency = higher automation value

Each dimension produces a 0-1 score. The composite is scaled to 0-100.

Methodology notes:
  - Ability mappings informed by Frey & Osborne (2017) task model categories
  - Physical abilities get low AI scores (0.05-0.15) — AI can't lift/move/assemble
  - Cognitive-routine abilities get high scores (0.7-0.9) — pattern matching, data processing
  - Cognitive-creative abilities get medium scores (0.4-0.6) — LLMs help but don't replace
  - Work activity mappings based on O*NET's own task taxonomy + automation literature


All weights and mappings are loaded from data/scoring-methodology.json.
Edit that file to tune the model, then re-run this script.
"""
import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.db import get_db, get_occupation_lookup

# ──────────────────────────────────────────────────────────────
# Load methodology from config file
# ──────────────────────────────────────────────────────────────

METHODOLOGY_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'scoring-methodology.json')

def load_methodology():
    with open(METHODOLOGY_PATH, 'r') as f:
        config = json.load(f)

    # Flatten nested ability scores: {category: {id: {score}}} → {id: score}
    ability_scores = {}
    for category, entries in config['ability_ai_scores'].items():
        if category.startswith('_'):
            continue
        for element_id, data in entries.items():
            ability_scores[element_id] = data['score']

    # Flatten work activity scores
    wa_scores = {}
    for category, entries in config['work_activity_ai_scores'].items():
        if category.startswith('_'):
            continue
        for element_id, data in entries.items():
            wa_scores[element_id] = data['score']

    # Flatten knowledge scores
    know_scores = {}
    for element_id, data in config['knowledge_digital_scores'].items():
        if element_id.startswith('_'):
            continue
        know_scores[element_id] = data['score']

    return {
        'dimension_weights': config['dimension_weights'],
        'ability_ai_scores': ability_scores,
        'ability_categories': {k: v for k, v in config['ability_categories'].items() if not k.startswith('_')},
        'work_activity_ai_scores': wa_scores,
        'knowledge_digital_scores': know_scores,
        'keyword_scores': config['keyword_scores'],
        'frequency_weights': config['frequency_weights'],
    }

METHODOLOGY = load_methodology()

# Expose as module-level for the functions below
ABILITY_AI_SCORES = METHODOLOGY['ability_ai_scores']
ABILITY_CATEGORIES = METHODOLOGY['ability_categories']
WORK_ACTIVITY_AI_SCORES = METHODOLOGY['work_activity_ai_scores']
KNOWLEDGE_DIGITAL_SCORES = METHODOLOGY['knowledge_digital_scores']
KEYWORD_SCORES = METHODOLOGY['keyword_scores']
DIMENSION_WEIGHTS = METHODOLOGY['dimension_weights']
FREQUENCY_WEIGHTS = METHODOLOGY['frequency_weights']


def calculate_keyword_score(task_texts):
    """Score 0-1 based on keyword analysis of task descriptions."""
    if not task_texts:
        return 0.5  # neutral default

    text_lower = ' '.join(task_texts).lower()
    high_hits = sum(1 for kw in KEYWORD_SCORES['high'] if kw in text_lower)
    med_hits = sum(1 for kw in KEYWORD_SCORES['medium'] if kw in text_lower)
    low_hits = sum(1 for kw in KEYWORD_SCORES['low'] if kw in text_lower)

    total = high_hits + med_hits + low_hits
    if total == 0:
        return 0.5

    weighted = (high_hits * 0.9 + med_hits * 0.5 + low_hits * 0.15) / total
    return min(1.0, max(0.0, weighted))


def weighted_dimension_score(rows, score_map):
    """
    Calculate importance-weighted automation score for a dimension.
    Each row has (element_id, importance, level).
    Returns 0-1 score.
    """
    if not rows:
        return None

    total_weight = 0.0
    weighted_sum = 0.0

    for element_id, importance, level in rows:
        ai_score = score_map.get(element_id, 0.5)
        weight = importance if importance else 1.0
        weighted_sum += ai_score * weight
        total_weight += weight

    if total_weight == 0:
        return None

    return weighted_sum / total_weight


def calculate_ability_profile(ability_rows):
    """Calculate ability dimension + physical/cognitive/creative averages."""
    if not ability_rows:
        return None, None, None, None

    # Main weighted score
    score = weighted_dimension_score(ability_rows, ABILITY_AI_SCORES)

    # Category averages (importance-weighted)
    def category_avg(category_ids):
        relevant = [(eid, imp, lv) for eid, imp, lv in ability_rows if eid in category_ids]
        if not relevant:
            return 0.0
        total_imp = sum(imp or 1 for _, imp, _ in relevant)
        return sum((imp or 1) * (imp or 1) / total_imp for _, imp, _ in relevant) if total_imp else 0

    # Use raw importance averages for the category metadata
    physical_avg = _category_importance_avg(ability_rows, ABILITY_CATEGORIES['physical'])
    routine_avg = _category_importance_avg(ability_rows, ABILITY_CATEGORIES['cognitive_routine'])
    creative_avg = _category_importance_avg(ability_rows, ABILITY_CATEGORIES['cognitive_creative'])

    return score, physical_avg, routine_avg, creative_avg


def _category_importance_avg(rows, category_ids):
    """Average importance for abilities in a category."""
    relevant = [(imp or 0) for eid, imp, _ in rows if eid in category_ids and imp]
    return sum(relevant) / len(relevant) if relevant else 0.0


def find_top_automatable_activities(wa_rows, n=5):
    """Find top N work activities with highest automation × importance."""
    scored = []
    for eid, importance, level in wa_rows:
        ai_score = WORK_ACTIVITY_AI_SCORES.get(eid, 0.5)
        combined = ai_score * (importance or 1)
        scored.append({'element_id': eid, 'name': eid, 'ai_score': ai_score, 'importance': importance})
    scored.sort(key=lambda x: x['ai_score'] * (x['importance'] or 1), reverse=True)
    return scored[:n]


def find_top_blocking_abilities(ability_rows, n=5):
    """Find abilities with low AI scores but high importance (blockers)."""
    scored = []
    for eid, importance, level in ability_rows:
        ai_score = ABILITY_AI_SCORES.get(eid, 0.5)
        if ai_score < 0.3 and (importance or 0) >= 3.0:
            scored.append({'element_id': eid, 'ai_score': ai_score, 'importance': importance})
    scored.sort(key=lambda x: x['importance'] or 0, reverse=True)
    return scored[:n]


def run():
    conn = get_db()
    cur = conn.cursor()

    # Ensure tables exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS occupation_automation_profile (
            id SERIAL PRIMARY KEY,
            occupation_id INTEGER NOT NULL UNIQUE REFERENCES occupations(id) ON DELETE CASCADE,
            composite_score REAL NOT NULL,
            ability_automation_potential REAL,
            work_activity_automation_potential REAL,
            keyword_score REAL,
            knowledge_digital_readiness REAL,
            task_frequency_weight REAL,
            physical_ability_avg REAL,
            cognitive_routine_avg REAL,
            cognitive_creative_avg REAL,
            top_automatable_activities TEXT,
            top_blocking_abilities TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_oap_composite ON occupation_automation_profile(composite_score)")
    conn.commit()

    # Also ensure pipeline_runs and data_versions exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS pipeline_runs (
            id SERIAL PRIMARY KEY,
            stage TEXT NOT NULL,
            status TEXT NOT NULL,
            records_processed INTEGER,
            error_message TEXT,
            started_at TIMESTAMP DEFAULT NOW() NOT NULL,
            completed_at TIMESTAMP
        )
    """)
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
    conn.commit()

    # Record pipeline start
    cur.execute(
        "INSERT INTO pipeline_runs (stage, status) VALUES ('composite_scores', 'running') RETURNING id"
    )
    run_id = cur.fetchone()[0]
    conn.commit()

    # Get all occupations
    cur.execute("SELECT id, title FROM occupations")
    occupations = cur.fetchall()
    print(f"Calculating composite scores for {len(occupations)} occupations...")

    processed = 0
    skipped = 0

    for occ_id, occ_title in occupations:
        # Dimension 1: Abilities
        cur.execute(
            "SELECT element_id, importance, level FROM onet_abilities WHERE occupation_id = %s",
            (occ_id,)
        )
        ability_rows = cur.fetchall()

        # Dimension 2: Work Activities
        cur.execute(
            "SELECT element_id, importance, level FROM onet_work_activities WHERE occupation_id = %s",
            (occ_id,)
        )
        wa_rows = cur.fetchall()

        # Dimension 4: Knowledge
        cur.execute(
            "SELECT element_id, importance, level FROM onet_knowledge WHERE occupation_id = %s",
            (occ_id,)
        )
        know_rows = cur.fetchall()

        # Dimension 3: Task keywords from onet_tasks + job_micro_tasks
        cur.execute(
            "SELECT task_description FROM onet_tasks WHERE occupation_id = %s",
            (occ_id,)
        )
        task_texts = [r[0] for r in cur.fetchall()]
        cur.execute(
            "SELECT task_description FROM job_micro_tasks WHERE occupation_id = %s",
            (occ_id,)
        )
        task_texts += [r[0] for r in cur.fetchall()]

        # Dimension 5: Task frequency
        cur.execute("""
            SELECT frequency, COUNT(*) FROM job_micro_tasks
            WHERE occupation_id = %s GROUP BY frequency
        """, (occ_id,))
        freq_counts = dict(cur.fetchall())
        total_tasks = sum(freq_counts.values()) if freq_counts else 0

        # Calculate each dimension
        ability_score, phys_avg, routine_avg, creative_avg = calculate_ability_profile(ability_rows)
        wa_score = weighted_dimension_score(wa_rows, WORK_ACTIVITY_AI_SCORES)
        kw_score = calculate_keyword_score(task_texts)
        know_score = weighted_dimension_score(
            [(eid, imp, lv) for eid, imp, lv in know_rows],
            KNOWLEDGE_DIGITAL_SCORES
        )

        # Task frequency weight: more daily tasks = higher value for automation
        default_fw = FREQUENCY_WEIGHTS.get('default', 0.3)
        if total_tasks > 0:
            freq_score = sum(
                FREQUENCY_WEIGHTS.get(f, default_fw) * c / total_tasks
                for f, c in freq_counts.items()
            )
        else:
            freq_score = 0.5  # neutral default

        # Composite: weighted average of available dimensions
        dw = DIMENSION_WEIGHTS
        dimensions = {
            'ability': (dw.get('ability', 0.30), ability_score),
            'work_activity': (dw.get('work_activity', 0.25), wa_score),
            'keyword': (dw.get('keyword', 0.20), kw_score),
            'knowledge': (dw.get('knowledge', 0.15), know_score),
            'frequency': (dw.get('frequency', 0.10), freq_score),
        }

        # Handle missing dimensions by redistributing weights
        available = {k: (w, s) for k, (w, s) in dimensions.items() if s is not None}
        if not available:
            skipped += 1
            continue

        total_weight = sum(w for w, s in available.values())
        composite = sum((w / total_weight) * s for w, s in available.values())
        composite_100 = round(composite * 100, 1)

        # Top automatable activities and blocking abilities
        top_activities = find_top_automatable_activities(wa_rows) if wa_rows else []
        blocking = find_top_blocking_abilities(ability_rows) if ability_rows else []

        # Upsert
        cur.execute("""
            INSERT INTO occupation_automation_profile (
                occupation_id, composite_score,
                ability_automation_potential, work_activity_automation_potential,
                keyword_score, knowledge_digital_readiness, task_frequency_weight,
                physical_ability_avg, cognitive_routine_avg, cognitive_creative_avg,
                top_automatable_activities, top_blocking_abilities,
                updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (occupation_id) DO UPDATE SET
                composite_score = EXCLUDED.composite_score,
                ability_automation_potential = EXCLUDED.ability_automation_potential,
                work_activity_automation_potential = EXCLUDED.work_activity_automation_potential,
                keyword_score = EXCLUDED.keyword_score,
                knowledge_digital_readiness = EXCLUDED.knowledge_digital_readiness,
                task_frequency_weight = EXCLUDED.task_frequency_weight,
                physical_ability_avg = EXCLUDED.physical_ability_avg,
                cognitive_routine_avg = EXCLUDED.cognitive_routine_avg,
                cognitive_creative_avg = EXCLUDED.cognitive_creative_avg,
                top_automatable_activities = EXCLUDED.top_automatable_activities,
                top_blocking_abilities = EXCLUDED.top_blocking_abilities,
                updated_at = NOW()
        """, (
            occ_id, composite_100,
            ability_score, wa_score,
            kw_score, know_score, freq_score,
            phys_avg, routine_avg, creative_avg,
            json.dumps(top_activities) if top_activities else None,
            json.dumps(blocking) if blocking else None,
        ))

        processed += 1
        if processed % 100 == 0:
            conn.commit()
            print(f"  Processed {processed}/{len(occupations)}...")

    # Finalize
    cur.execute("""
        UPDATE pipeline_runs SET status = 'completed', records_processed = %s, completed_at = NOW()
        WHERE id = %s
    """, (processed, run_id))
    conn.commit()

    # Summary stats
    cur.execute("SELECT MIN(composite_score), AVG(composite_score), MAX(composite_score) FROM occupation_automation_profile")
    min_s, avg_s, max_s = cur.fetchone()

    print(f"\nDone! Scored {processed} occupations, skipped {skipped}")
    print(f"Score distribution: min={min_s:.1f}, avg={avg_s:.1f}, max={max_s:.1f}")

    # Sanity check: show some recognizable occupations
    cur.execute("""
        SELECT o.title, p.composite_score, p.ability_automation_potential, p.physical_ability_avg
        FROM occupation_automation_profile p
        JOIN occupations o ON o.id = p.occupation_id
        ORDER BY p.composite_score DESC LIMIT 10
    """)
    print("\nTop 10 most automatable:")
    for title, score, ability, phys in cur.fetchall():
        print(f"  {score:5.1f}  {title}")

    cur.execute("""
        SELECT o.title, p.composite_score, p.physical_ability_avg
        FROM occupation_automation_profile p
        JOIN occupations o ON o.id = p.occupation_id
        ORDER BY p.composite_score ASC LIMIT 10
    """)
    print("\nTop 10 least automatable:")
    for title, score, phys in cur.fetchall():
        phys_str = f"{phys:.1f}" if phys is not None else "N/A"
        print(f"  {score:5.1f}  phys_avg={phys_str}  {title}")

    conn.close()


if __name__ == "__main__":
    run()
