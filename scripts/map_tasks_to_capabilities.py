#!/usr/bin/env python3
"""
Map micro-tasks to capabilities using keyword-based matching.
Extends the getBlockForTask logic from lib/blueprint.ts to capability level.

Run: python scripts/map_tasks_to_capabilities.py
"""
import sys
import os
import re

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.db import get_db

# Keyword patterns mapped to capability keys.
# Order matters within a module — first match wins.
# Patterns use word-boundary-aware matching.
CAPABILITY_PATTERNS = {
    # Intake
    "data_entry_assistant": [
        r"\benter\b", r"\binput\b", r"\blog\b(?!in)", r"\brecord\b.*\b(detail|info|data)\b",
        r"\bupdate\b.*\b(system|database|record)\b", r"\bcheck.in\b",
    ],
    "form_processing": [
        r"\bform\b", r"\bapplication\b", r"\bextract\b.*\bfield\b", r"\bparse\b",
        r"\bsubmission\b", r"\bintake\b.*\bform\b",
    ],
    "notification_routing": [
        r"\balert\b", r"\bnotif", r"\bvoicemail\b", r"\broute\b.*\b(message|alert)\b",
        r"\bmonitor\b.*\bincoming\b",
    ],
    "request_triage": [
        r"\btriage\b", r"\bprioritiz\b", r"\bsort\b.*\b(request|email|ticket)\b",
        r"\broute\b.*\b(ticket|request)\b", r"\bcategoriz\b",
        r"\bincoming\b", r"\brequest\b",
    ],

    # Analysis
    "risk_screening": [
        r"\brisk\b", r"\bscreen\b", r"\bflag\b", r"\boverdue\b", r"\bthreshold\b",
        r"\bexpir\b", r"\binconsisten\b",
    ],
    "pattern_detection": [
        r"\btrend\b", r"\bpattern\b", r"\banomaly\b", r"\bdetect\b",
        r"\brecurr\b", r"\bseasonal\b",
    ],
    "decision_prep": [
        r"\bcompar\b", r"\bpros.*cons\b", r"\boption\b", r"\bevaluat\b.*\b(vendor|candidate|proposal)\b",
        r"\bside.by.side\b", r"\bprocurement\b",
    ],
    "data_summarization": [
        r"\bsummar\b", r"\bdigest\b", r"\bcondense\b", r"\bhighlight\b",
        r"\bbrief\b", r"\bsynopsis\b",
    ],

    # Documentation
    "meeting_notes": [
        r"\bmeeting\b.*\bnote\b", r"\bminute\b", r"\baction.item\b",
        r"\bmeeting\b.*\bsummar\b", r"\bmeeting\b", r"\bnote\b.*\baction\b",
    ],
    "template_generation": [
        r"\btemplate\b", r"\bSOP\b", r"\bstandard.operat\b", r"\bchecklist\b",
        r"\bprocedure\b.*\b(creat|build|maint)\b",
    ],
    "records_assistant": [
        r"\bmaintain\b.*\b(record|log|file)\b", r"\bupdate\b.*\bnote\b",
        r"\blog\b.*\b(result|activit|inspect)\b", r"\bcase.file\b",
        r"\brecord.keep\b", r"\bdocument\b.*\b(visit|incident|maint)\b",
    ],
    "report_drafting": [
        r"\breport\b", r"\bdraft\b", r"\bwrite\b.*\b(status|summar|report)\b",
        r"\bcompile\b", r"\bgenerat\b.*\breport\b",
    ],

    # Coordination
    "scheduling_assistant": [
        r"\bschedul\b", r"\bcalendar\b", r"\bappointment\b", r"\bshift\b",
        r"\bbook\b", r"\breschedul\b",
    ],
    "followup_tracker": [
        r"\bfollow.up\b", r"\bremind\b", r"\bdeadline\b", r"\boverdue\b",
        r"\bpending\b.*\bapproval\b",
    ],
    "handoff_assistant": [
        r"\bhandoff\b", r"\bhand.off\b", r"\btransition\b", r"\bshift\b.*\b(change|summar|note)\b",
        r"\bturnover\b",
    ],
    "status_tracking": [
        r"\bstatus\b", r"\bprogress\b", r"\bmilestone\b", r"\btrack\b.*\b(project|task|item)\b",
        r"\btimeline\b",
    ],

    # Exceptions
    "escalation_routing": [
        r"\besculat\b", r"\bescalat\b", r"\broute\b.*\b(complex|senior)\b",
        r"\bseverity\b", r"\bcomplex.case\b", r"\bescalat\b", r"\bcomplex\b",
        r"\bexception\b.*\b(rout|handl|manag)\b",
    ],
    "disruption_assistant": [
        r"\bdisrupt\b", r"\bweather\b", r"\bemergency\b", r"\bincident\b.*\brespons\b",
        r"\bunexpect\b", r"\bcontingency\b",
    ],
    "exception_logging": [
        r"\bexception\b", r"\bedge.case\b", r"\bunusual\b", r"\birregular\b",
    ],

    # Learning
    "standards_monitor": [
        r"\bstandard\b", r"\bregulat\b.*\bupdate\b", r"\bbest.practice\b",
        r"\bguideline\b", r"\bindustry\b.*\bchange\b",
    ],
    "training_content": [
        r"\btrain\b", r"\bonboard\b", r"\blearn\b.*\bmateri\b",
        r"\bquick.reference\b", r"\bguide\b",
    ],
    "knowledge_capture": [
        r"\bknowledge\b", r"\btribal\b", r"\bFAQ\b", r"\blesson.learn\b",
        r"\binstitutional\b",
    ],

    # Research
    "document_review": [
        r"\breview\b.*\b(document|contract|report|paper)\b",
        r"\bextract\b.*\b(clause|finding|data)\b",
    ],
    "competitive_scan": [
        r"\bcompetit\b", r"\bmarket\b.*\b(scan|monitor|trend)\b",
        r"\bindustry\b.*\bnews\b",
    ],
    "information_gathering": [
        r"\bresearch\b", r"\bfind\b.*\binformation\b", r"\bgather\b",
        r"\bcompile\b.*\b(background|info|data)\b", r"\binvestigat\b",
        r"\bsearch\b",
    ],

    # Compliance
    "regulatory_tracking": [
        r"\bregulat\b.*\b(track|monitor|change|update)\b",
        r"\bcompliance\b.*\bcalendar\b", r"\bjurisdiction\b",
        r"\bregulat\b.*\b(new|upcom|chang)\b", r"\blaw\b.*\bchang\b",
    ],
    "audit_prep": [
        r"\baudit\b", r"\bevidence\b", r"\bpackage\b.*\bcompliance\b",
        r"\baudit.trail\b",
    ],
    "policy_checker": [
        r"\bpolicy\b", r"\bprocedure\b.*\bcheck\b", r"\bvalidat\b.*\bprocess\b",
        r"\bcompliance\b", r"\bregulat\b",
    ],

    # Communication
    "presentation_prep": [
        r"\bpresent\b", r"\bslide\b", r"\btalking.point\b", r"\bdeck\b",
        r"\bbriefing\b",
    ],
    "stakeholder_updates": [
        r"\bstakeholder\b", r"\bboard\b.*\b(report|update)\b",
        r"\bdigest\b", r"\bsponsor\b",
    ],
    "message_drafting": [
        r"\bemail\b", r"\bmessage\b", r"\bdraft\b.*\b(response|email|letter)\b",
        r"\bcommunicat\b", r"\bannounce\b", r"\bcorrespond\b",
    ],

    # Data & Reporting
    "data_visualization": [
        r"\bvisuali\b", r"\bchart\b", r"\bgraph\b", r"\binfographic\b",
    ],
    "scheduled_reports": [
        r"\bdaily\b.*\breport\b", r"\bweekly\b.*\breport\b", r"\bmonthly\b.*\breport\b",
        r"\brecurring\b.*\breport\b", r"\bgenerat\b.*\breport\b",
    ],
    "dashboard_maintenance": [
        r"\bdashboard\b", r"\bKPI\b", r"\bmetric\b.*\b(track|maintain|update)\b",
    ],
    "data_collection": [
        r"\bcollect\b.*\bdata\b", r"\baggregat\b", r"\bsurvey\b.*\brespons\b",
        r"\borganiz\b.*\bdata\b", r"\bdata\b.*\bentry\b",
    ],
}


def match_task_to_capabilities(task_name, task_description, ai_category):
    """Return list of (capability_key, confidence) tuples."""
    combined = f"{task_name} {task_description}".lower()
    matches = []

    for cap_key, patterns in CAPABILITY_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, combined, re.IGNORECASE):
                matches.append((cap_key, 0.85))
                break

    # If no match from keywords, try a broader fallback based on ai_category
    if not matches and ai_category:
        CATEGORY_FALLBACKS = {
            "task_automation": ["request_triage", "data_entry_assistant"],
            "decision_support": ["decision_prep", "data_summarization"],
            "research_discovery": ["information_gathering"],
            "communication": ["message_drafting"],
            "creative_assistance": ["report_drafting"],
            "data_analysis": ["data_summarization", "dashboard_maintenance"],
            "learning_education": ["standards_monitor"],
        }
        fallbacks = CATEGORY_FALLBACKS.get(ai_category, [])
        for cap_key in fallbacks[:1]:  # take the primary fallback
            matches.append((cap_key, 0.6))

    return matches


def main():
    conn = get_db()
    cur = conn.cursor()

    # Ensure mapping table exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS task_capability_mappings (
            id SERIAL PRIMARY KEY,
            micro_task_id INTEGER NOT NULL REFERENCES job_micro_tasks(id) ON DELETE CASCADE,
            capability_key TEXT NOT NULL REFERENCES module_capabilities(capability_key) ON DELETE CASCADE,
            confidence REAL NOT NULL DEFAULT 0.8,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            UNIQUE(micro_task_id, capability_key)
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS task_capability_mappings_task_idx ON task_capability_mappings(micro_task_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS task_capability_mappings_capability_idx ON task_capability_mappings(capability_key)")

    # Fetch all AI-applicable micro tasks
    cur.execute("""
        SELECT id, task_name, task_description, ai_category
        FROM job_micro_tasks
        WHERE ai_applicable = true
    """)
    tasks = cur.fetchall()
    print(f"Processing {len(tasks)} AI-applicable tasks...")

    inserted = 0
    skipped = 0
    unmatched = 0

    for task_id, task_name, task_description, ai_category in tasks:
        matches = match_task_to_capabilities(task_name, task_description or "", ai_category)

        if not matches:
            unmatched += 1
            continue

        for cap_key, confidence in matches:
            try:
                cur.execute("""
                    INSERT INTO task_capability_mappings (micro_task_id, capability_key, confidence)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (micro_task_id, capability_key) DO UPDATE
                    SET confidence = EXCLUDED.confidence
                """, (task_id, cap_key, confidence))
                inserted += 1
            except Exception as e:
                # capability_key might not exist in module_capabilities
                conn.rollback()
                skipped += 1

    conn.commit()

    # Stats
    cur.execute("SELECT COUNT(DISTINCT micro_task_id) FROM task_capability_mappings")
    mapped_tasks = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM job_micro_tasks WHERE ai_applicable = true")
    total_ai_tasks = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT capability_key) FROM task_capability_mappings")
    used_capabilities = cur.fetchone()[0]

    coverage = (mapped_tasks / total_ai_tasks * 100) if total_ai_tasks > 0 else 0

    print(f"\nMapping complete:")
    print(f"  Total mappings created: {inserted}")
    print(f"  Tasks mapped: {mapped_tasks}/{total_ai_tasks} ({coverage:.1f}% coverage)")
    print(f"  Capabilities used: {used_capabilities}/35")
    print(f"  Unmatched tasks: {unmatched}")
    print(f"  Skipped (FK errors): {skipped}")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
