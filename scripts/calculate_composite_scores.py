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
"""
import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.db import get_db, get_occupation_lookup

# ──────────────────────────────────────────────────────────────
# Dimension 1: Ability → AI Capability Mapping
# Each O*NET ability gets a score: how well can AI perform this?
# Scale: 0 = AI can't do this, 1 = AI excels at this
# ──────────────────────────────────────────────────────────────

ABILITY_AI_SCORES = {
    # Cognitive — Verbal (AI strong at text processing)
    '1.A.1.a.1': 0.80,  # Oral Comprehension — speech-to-text + NLP
    '1.A.1.a.2': 0.85,  # Written Comprehension — LLMs excel
    '1.A.1.a.3': 0.70,  # Oral Expression — TTS improving but not human-level
    '1.A.1.a.4': 0.85,  # Written Expression — LLMs excel
    # Cognitive — Idea Generation & Reasoning
    '1.A.1.b.1': 0.55,  # Fluency of Ideas — LLMs generate many, quality varies
    '1.A.1.b.2': 0.45,  # Originality — AI assists but true novelty is human edge
    '1.A.1.b.3': 0.50,  # Problem Sensitivity — pattern recognition helps, judgment needed
    '1.A.1.b.4': 0.75,  # Deductive Reasoning — formal logic, AI strong
    '1.A.1.b.5': 0.65,  # Inductive Reasoning — pattern inference, AI decent
    '1.A.1.b.6': 0.85,  # Information Ordering — sorting/organizing, AI excels
    '1.A.1.b.7': 0.70,  # Category Flexibility — classification, AI good
    # Cognitive — Quantitative
    '1.A.1.c.1': 0.80,  # Mathematical Reasoning — computation/logic strong
    '1.A.1.c.2': 0.90,  # Number Facility — arithmetic, AI perfect
    # Cognitive — Memory
    '1.A.1.d.1': 0.90,  # Memorization — databases >> human memory
    # Cognitive — Perceptual
    '1.A.1.e.1': 0.75,  # Speed of Closure — pattern completion, CV strong
    '1.A.1.e.2': 0.70,  # Flexibility of Closure — visual pattern recognition
    '1.A.1.e.3': 0.85,  # Perceptual Speed — rapid comparison, AI excels
    # Cognitive — Spatial
    '1.A.1.f.1': 0.40,  # Spatial Orientation — 3D reasoning, AI moderate
    '1.A.1.f.2': 0.50,  # Visualization — improving with generative AI
    # Cognitive — Attentiveness
    '1.A.1.g.1': 0.80,  # Selective Attention — filtering, AI doesn't fatigue
    '1.A.1.g.2': 0.60,  # Time Sharing — multitasking, AI parallel processing
    # Psychomotor — Fine Motor
    '1.A.2.a.1': 0.10,  # Arm-Hand Steadiness — physical, not AI
    '1.A.2.a.2': 0.10,  # Manual Dexterity — physical manipulation
    '1.A.2.a.3': 0.10,  # Finger Dexterity — fine motor, not AI
    # Psychomotor — Control
    '1.A.2.b.1': 0.15,  # Control Precision — physical control
    '1.A.2.b.2': 0.10,  # Multilimb Coordination — physical
    '1.A.2.b.3': 0.15,  # Response Orientation — physical reaction
    '1.A.2.b.4': 0.15,  # Rate Control — physical timing
    # Psychomotor — Reaction
    '1.A.2.c.1': 0.15,  # Reaction Time — physical speed
    '1.A.2.c.2': 0.05,  # Wrist-Finger Speed — repetitive physical
    '1.A.2.c.3': 0.05,  # Speed of Limb Movement — physical
    # Physical — Strength
    '1.A.3.a.1': 0.05,  # Static Strength — lifting, not AI
    '1.A.3.a.2': 0.05,  # Explosive Strength — physical
    '1.A.3.a.3': 0.05,  # Dynamic Strength — physical
    '1.A.3.a.4': 0.05,  # Trunk Strength — physical
    # Physical — Endurance/Flexibility
    '1.A.3.b.1': 0.05,  # Stamina — physical endurance
    '1.A.3.c.1': 0.05,  # Extent Flexibility — physical
    '1.A.3.c.2': 0.05,  # Dynamic Flexibility — physical
    '1.A.3.c.3': 0.05,  # Gross Body Coordination — physical
    '1.A.3.c.4': 0.05,  # Gross Body Equilibrium — physical/balance
    # Sensory — Visual
    '1.A.4.a.1': 0.60,  # Near Vision — computer vision good at close-up
    '1.A.4.a.2': 0.50,  # Far Vision — less relevant to most AI tasks
    '1.A.4.a.3': 0.55,  # Visual Color Discrimination — CV decent
    '1.A.4.a.4': 0.20,  # Night Vision — specialized, low AI relevance
    '1.A.4.a.5': 0.30,  # Peripheral Vision — spatial awareness, limited AI
    '1.A.4.a.6': 0.45,  # Depth Perception — 3D vision improving
    '1.A.4.a.7': 0.20,  # Glare Sensitivity — physical adaptation
    # Sensory — Auditory
    '1.A.4.b.1': 0.50,  # Hearing Sensitivity — audio processing moderate
    '1.A.4.b.2': 0.55,  # Auditory Attention — audio filtering
    '1.A.4.b.3': 0.30,  # Sound Localization — spatial audio, niche
    '1.A.4.b.4': 0.80,  # Speech Recognition — AI excels
    '1.A.4.b.5': 0.75,  # Speech Clarity — TTS good and improving
}

# Ability categories for profile metadata
ABILITY_CATEGORIES = {
    'physical': [
        '1.A.2.a.1', '1.A.2.a.2', '1.A.2.a.3',  # Fine Motor
        '1.A.2.b.1', '1.A.2.b.2', '1.A.2.b.3', '1.A.2.b.4',  # Control
        '1.A.2.c.1', '1.A.2.c.2', '1.A.2.c.3',  # Reaction
        '1.A.3.a.1', '1.A.3.a.2', '1.A.3.a.3', '1.A.3.a.4',  # Strength
        '1.A.3.b.1', '1.A.3.c.1', '1.A.3.c.2', '1.A.3.c.3', '1.A.3.c.4',  # Endurance
    ],
    'cognitive_routine': [
        '1.A.1.a.2', '1.A.1.a.4',  # Written comprehension/expression
        '1.A.1.b.4', '1.A.1.b.6',  # Deductive, Information Ordering
        '1.A.1.c.1', '1.A.1.c.2',  # Math
        '1.A.1.d.1',  # Memorization
        '1.A.1.e.1', '1.A.1.e.2', '1.A.1.e.3',  # Perceptual
        '1.A.1.g.1',  # Selective Attention
    ],
    'cognitive_creative': [
        '1.A.1.b.1', '1.A.1.b.2', '1.A.1.b.3',  # Ideas, Originality, Problem Sensitivity
        '1.A.1.b.5', '1.A.1.b.7',  # Inductive, Category Flexibility
        '1.A.1.f.1', '1.A.1.f.2',  # Spatial
        '1.A.1.g.2',  # Time Sharing
    ],
}


# ──────────────────────────────────────────────────────────────
# Dimension 2: Work Activity → Automation Potential Mapping
# ──────────────────────────────────────────────────────────────

WORK_ACTIVITY_AI_SCORES = {
    # Information Input — generally automatable
    '4.A.1.a.1': 0.80,  # Getting Information — search, retrieval, AI excels
    '4.A.1.a.2': 0.60,  # Monitoring Processes — sensor/dashboard monitoring
    '4.A.1.b.1': 0.65,  # Identifying Objects, Actions, Events — classification
    '4.A.1.b.2': 0.40,  # Inspecting Equipment — physical inspection, limited
    '4.A.1.b.3': 0.70,  # Estimating Quantifiable Characteristics — computation
    # Mental Processes — mixed
    '4.A.2.a.1': 0.50,  # Judging Qualities — subjective judgment, AI assists
    '4.A.2.a.2': 0.85,  # Processing Information — data processing, AI excels
    '4.A.2.a.3': 0.75,  # Evaluating Compliance — rule-based checking
    '4.A.2.a.4': 0.80,  # Analyzing Data — analytics, AI strong
    '4.A.2.b.1': 0.45,  # Making Decisions — judgment-heavy, AI assists
    '4.A.2.b.2': 0.50,  # Thinking Creatively — AI assists but doesn't replace
    '4.A.2.b.3': 0.70,  # Updating and Using Knowledge — RAG, knowledge management
    '4.A.2.b.4': 0.40,  # Developing Objectives and Strategies — strategic thinking
    '4.A.2.b.5': 0.75,  # Scheduling Work — optimization, AI good
    '4.A.2.b.6': 0.65,  # Organizing, Planning, Prioritizing — AI assists well
    # Work Output — physical activities score low
    '4.A.3.a.1': 0.10,  # Performing General Physical Activities — not AI
    '4.A.3.a.2': 0.10,  # Handling and Moving Objects — physical
    '4.A.3.a.3': 0.25,  # Controlling Machines — some automation, mostly physical
    '4.A.3.a.4': 0.15,  # Operating Vehicles — autonomous driving improving
    '4.A.3.b.1': 0.80,  # Working with Computers — AI native environment
    '4.A.3.b.2': 0.55,  # Drafting/Specifying Technical Devices — CAD AI improving
    '4.A.3.b.4': 0.10,  # Repairing Mechanical Equipment — physical
    '4.A.3.b.5': 0.15,  # Repairing Electronic Equipment — physical + diagnostic
    '4.A.3.b.6': 0.85,  # Documenting/Recording Information — text generation, AI excels
    # Interacting with Others — generally lower
    '4.A.4.a.1': 0.65,  # Interpreting Information for Others — summarization, AI good
    '4.A.4.a.2': 0.50,  # Communicating with Supervisors/Peers — AI drafts, human delivers
    '4.A.4.a.3': 0.45,  # Communicating with External People — relationship-dependent
    '4.A.4.a.4': 0.20,  # Establishing Interpersonal Relationships — human skill
    '4.A.4.a.5': 0.10,  # Assisting and Caring for Others — empathy-dependent
    '4.A.4.a.6': 0.35,  # Selling or Influencing — persuasion, AI assists
    '4.A.4.a.7': 0.25,  # Resolving Conflicts and Negotiating — human judgment
    '4.A.4.a.8': 0.15,  # Performing for/with the Public — human presence required
    '4.A.4.b.1': 0.40,  # Coordinating Work of Others — scheduling part automatable
    '4.A.4.b.2': 0.20,  # Developing and Building Teams — human leadership
    '4.A.4.b.3': 0.40,  # Training and Teaching — AI tutoring improving
    '4.A.4.b.4': 0.25,  # Guiding/Motivating Subordinates — human leadership
    '4.A.4.b.5': 0.30,  # Coaching and Developing Others — human relationship
    '4.A.4.b.6': 0.45,  # Providing Consultation and Advice — AI can draft advice
    # Administrative
    '4.A.4.c.1': 0.80,  # Performing Administrative Activities — forms, filing, AI strong
    '4.A.4.c.2': 0.45,  # Staffing Organizational Units — judgment + process
    '4.A.4.c.3': 0.60,  # Monitoring and Controlling Resources — dashboards, AI assists
}


# ──────────────────────────────────────────────────────────────
# Dimension 4: Knowledge → Digital Readiness
# High scores = occupation works with structured/digital data
# ──────────────────────────────────────────────────────────────

KNOWLEDGE_DIGITAL_SCORES = {
    '2.C.3.a': 1.0,   # Computers and Electronics — most direct signal
    '2.C.4.a': 0.8,   # Mathematics — quantitative, model-friendly
    '2.C.1.c': 0.7,   # Economics and Accounting — structured data
    '2.C.1.a': 0.5,   # Administration and Management — process-oriented
    '2.C.1.b': 0.6,   # Administrative — clerical, structured
    '2.C.1.d': 0.5,   # Sales and Marketing — data-driven marketing
    '2.C.1.e': 0.3,   # Customer and Personal Service — human interaction
    '2.C.1.f': 0.5,   # Personnel and Human Resources — mix
    '2.C.2.a': 0.3,   # Production and Processing — physical
    '2.C.2.b': 0.2,   # Food Production — physical
    '2.C.3.b': 0.6,   # Engineering and Technology — technical
    '2.C.3.c': 0.5,   # Design — creative+technical
    '2.C.3.d': 0.2,   # Building and Construction — physical
    '2.C.3.e': 0.2,   # Mechanical — physical
    '2.C.4.b': 0.5,   # Physics — analytical
    '2.C.4.c': 0.4,   # Chemistry — lab + data
    '2.C.4.d': 0.4,   # Biology — research + data
    '2.C.4.e': 0.3,   # Psychology — human-centered
    '2.C.4.f': 0.2,   # Sociology and Anthropology — human-centered
    '2.C.4.g': 0.4,   # Geography — GIS data
    '2.C.5.a': 0.3,   # Medicine and Dentistry — human care
    '2.C.5.b': 0.2,   # Therapy and Counseling — human care
    '2.C.6': 0.4,     # Education and Training — AI tutoring
    '2.C.7.a': 0.6,   # English Language — NLP native domain
    '2.C.7.b': 0.5,   # Foreign Language — translation AI
    '2.C.7.c': 0.4,   # Fine Arts — generative AI
    '2.C.7.d': 0.3,   # History and Archeology — research
    '2.C.7.e': 0.2,   # Philosophy and Theology — abstract reasoning
    '2.C.8.a': 0.3,   # Public Safety and Security — physical + judgment
    '2.C.8.b': 0.5,   # Law and Government — document-heavy
    '2.C.9.a': 0.7,   # Telecommunications — technical
    '2.C.9.b': 0.6,   # Communications and Media — content creation
    '2.C.10': 0.3,    # Transportation — physical
}


# ──────────────────────────────────────────────────────────────
# Dimension 3: Task Keyword Score (kept from existing pipeline)
# ──────────────────────────────────────────────────────────────

KEYWORD_SCORES = {
    'high': [
        'data entry', 'record', 'log', 'file', 'organize', 'sort', 'categorize',
        'calculate', 'compute', 'summarize', 'compile', 'generate report',
        'schedule', 'calendar', 'email', 'notification', 'remind',
        'search', 'find', 'lookup', 'retrieve', 'query',
        'translate', 'transcribe', 'convert', 'format',
        'check', 'verify', 'validate', 'review', 'audit',
        'monitor', 'track', 'measure', 'analyze', 'compare',
    ],
    'medium': [
        'prepare', 'draft', 'create', 'develop', 'design',
        'communicate', 'respond', 'reply', 'present', 'explain',
        'evaluate', 'assess', 'recommend', 'suggest', 'advise',
        'plan', 'coordinate', 'organize', 'manage',
        'research', 'investigate', 'identify', 'determine',
    ],
    'low': [
        'negotiate', 'persuade', 'sell', 'counsel', 'interview',
        'supervise', 'lead', 'train', 'mentor', 'coach',
        'create strategy', 'make decisions', 'exercise judgment',
        'physical', 'manual', 'operate equipment', 'drive',
    ],
}


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
        freq_weights = {'daily': 1.0, 'weekly': 0.5, 'monthly': 0.25, 'as-needed': 0.15}
        if total_tasks > 0:
            freq_score = sum(
                freq_weights.get(f, 0.3) * c / total_tasks
                for f, c in freq_counts.items()
            )
        else:
            freq_score = 0.5  # neutral default

        # Composite: weighted average of available dimensions
        dimensions = {
            'ability': (0.30, ability_score),
            'work_activity': (0.25, wa_score),
            'keyword': (0.20, kw_score),
            'knowledge': (0.15, know_score),
            'frequency': (0.10, freq_score),
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
