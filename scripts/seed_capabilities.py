#!/usr/bin/env python3
"""
Seed the module_capabilities table with the capability catalog.
Each module gets 4-6 concrete capabilities that describe the actual
deliverables a user receives when that module is part of their system.

Run: python scripts/seed_capabilities.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.db import get_db

CAPABILITIES = [
    # ── Intake & Triage ──────────────────────────────────────────
    {
        "module_key": "intake",
        "capability_key": "request_triage",
        "capability_name": "Request Triage",
        "description": "Sorts and prioritizes incoming requests by urgency, type, and routing destination.",
        "example_tasks": [
            "Sort incoming emails by priority",
            "Route support tickets to the right team",
            "Flag urgent requests for immediate attention",
            "Categorize new submissions by type",
        ],
        "likely_systems": ["email", "ticketing", "CRM"],
    },
    {
        "module_key": "intake",
        "capability_key": "form_processing",
        "capability_name": "Form & Document Intake",
        "description": "Extracts structured data from incoming forms, applications, and documents.",
        "example_tasks": [
            "Parse application forms into structured records",
            "Extract key fields from submitted documents",
            "Validate required fields on intake forms",
            "Convert paper forms to digital records",
        ],
        "likely_systems": ["document management", "forms", "database"],
    },
    {
        "module_key": "intake",
        "capability_key": "notification_routing",
        "capability_name": "Notification & Alert Routing",
        "description": "Monitors incoming notifications and routes them to the right person or queue.",
        "example_tasks": [
            "Monitor system alerts and escalate critical ones",
            "Route voicemail transcripts to the right recipient",
            "Filter low-priority notifications from the main feed",
        ],
        "likely_systems": ["email", "messaging", "alerting"],
    },
    {
        "module_key": "intake",
        "capability_key": "data_entry_assistant",
        "capability_name": "Data Entry Assistant",
        "description": "Handles repetitive data entry from incoming sources into internal systems.",
        "example_tasks": [
            "Enter new client information into CRM",
            "Log incoming shipment details",
            "Record patient check-in information",
            "Update inventory from delivery manifests",
        ],
        "likely_systems": ["CRM", "ERP", "database"],
    },

    # ── Analysis ─────────────────────────────────────────────────
    {
        "module_key": "analysis",
        "capability_key": "pattern_detection",
        "capability_name": "Pattern & Trend Detection",
        "description": "Identifies recurring patterns, trends, and anomalies in operational data.",
        "example_tasks": [
            "Identify trends in customer complaint data",
            "Detect anomalies in daily transaction volumes",
            "Surface recurring issues from incident reports",
            "Track seasonal patterns in workload",
        ],
        "likely_systems": ["analytics", "database", "spreadsheets"],
    },
    {
        "module_key": "analysis",
        "capability_key": "decision_prep",
        "capability_name": "Decision Prep & Comparison",
        "description": "Prepares structured comparisons and summaries to support upcoming decisions.",
        "example_tasks": [
            "Compare vendor proposals side by side",
            "Summarize options for a procurement decision",
            "Prepare pros/cons analysis for a policy change",
            "Compile candidate evaluation summaries",
        ],
        "likely_systems": ["documents", "spreadsheets", "presentation"],
    },
    {
        "module_key": "analysis",
        "capability_key": "data_summarization",
        "capability_name": "Data Summarization",
        "description": "Condenses large datasets or reports into actionable summaries.",
        "example_tasks": [
            "Summarize weekly performance metrics",
            "Distill long reports into executive briefs",
            "Create highlight summaries from meeting transcripts",
            "Generate daily situation reports from multiple sources",
        ],
        "likely_systems": ["analytics", "documents", "email"],
    },
    {
        "module_key": "analysis",
        "capability_key": "risk_screening",
        "capability_name": "Risk & Flag Screening",
        "description": "Screens inputs and data for potential risks, flags, or items requiring attention.",
        "example_tasks": [
            "Screen applications for missing or inconsistent data",
            "Flag transactions above threshold amounts",
            "Identify patients with overdue follow-ups",
            "Highlight contracts approaching expiration",
        ],
        "likely_systems": ["database", "CRM", "compliance"],
    },

    # ── Documentation ────────────────────────────────────────────
    {
        "module_key": "documentation",
        "capability_key": "report_drafting",
        "capability_name": "Report Drafting",
        "description": "Drafts recurring reports from templates and live data sources.",
        "example_tasks": [
            "Draft weekly status reports",
            "Compile monthly performance summaries",
            "Generate shift handoff reports",
            "Create incident summary documents",
        ],
        "likely_systems": ["documents", "analytics", "email"],
    },
    {
        "module_key": "documentation",
        "capability_key": "records_assistant",
        "capability_name": "Records & Log Maintenance",
        "description": "Keeps ongoing records, logs, and case files up to date.",
        "example_tasks": [
            "Update patient visit notes",
            "Maintain communication logs",
            "Record maintenance activities",
            "Log inspection results",
        ],
        "likely_systems": ["database", "document management", "EHR"],
    },
    {
        "module_key": "documentation",
        "capability_key": "meeting_notes",
        "capability_name": "Meeting Notes & Action Items",
        "description": "Captures meeting notes and extracts action items for follow-up.",
        "example_tasks": [
            "Summarize meeting discussions into structured notes",
            "Extract action items and assign owners",
            "Distribute meeting minutes to attendees",
            "Track open action items across meetings",
        ],
        "likely_systems": ["calendar", "documents", "task tracker"],
    },
    {
        "module_key": "documentation",
        "capability_key": "template_generation",
        "capability_name": "Template & Form Generation",
        "description": "Creates and maintains document templates, standard operating procedures, and form layouts.",
        "example_tasks": [
            "Generate SOPs from process descriptions",
            "Create standardized report templates",
            "Build reusable email templates",
            "Maintain procedure checklists",
        ],
        "likely_systems": ["documents", "knowledge base", "forms"],
    },

    # ── Coordination & Scheduling ────────────────────────────────
    {
        "module_key": "coordination",
        "capability_key": "scheduling_assistant",
        "capability_name": "Scheduling Assistant",
        "description": "Manages calendar scheduling, shift assignments, and appointment coordination.",
        "example_tasks": [
            "Update crew schedules based on availability",
            "Coordinate meeting times across teams",
            "Manage appointment booking and reminders",
            "Handle schedule change requests",
        ],
        "likely_systems": ["calendar", "scheduling software", "email"],
    },
    {
        "module_key": "coordination",
        "capability_key": "followup_tracker",
        "capability_name": "Follow-up Tracker",
        "description": "Tracks open items and sends reminders to keep work moving forward.",
        "example_tasks": [
            "Send follow-up reminders for pending approvals",
            "Track open action items from meetings",
            "Remind team members of upcoming deadlines",
            "Escalate overdue items",
        ],
        "likely_systems": ["task tracker", "email", "messaging"],
    },
    {
        "module_key": "coordination",
        "capability_key": "handoff_assistant",
        "capability_name": "Handoff & Transition Assistant",
        "description": "Prepares handoff documentation and ensures smooth transitions between shifts or teams.",
        "example_tasks": [
            "Prepare shift handoff summaries",
            "Document transition notes for project transfers",
            "Brief incoming team on current status",
            "Track handoff completion confirmations",
        ],
        "likely_systems": ["documents", "messaging", "task tracker"],
    },
    {
        "module_key": "coordination",
        "capability_key": "status_tracking",
        "capability_name": "Status & Progress Tracking",
        "description": "Monitors task and project progress and generates status updates.",
        "example_tasks": [
            "Track project milestone completion",
            "Generate weekly progress summaries",
            "Update stakeholders on delivery timelines",
            "Monitor work queue depths",
        ],
        "likely_systems": ["project management", "task tracker", "email"],
    },

    # ── Exceptions & Escalations ─────────────────────────────────
    {
        "module_key": "exceptions",
        "capability_key": "escalation_routing",
        "capability_name": "Escalation Router",
        "description": "Detects situations requiring human judgment and routes them to the right person.",
        "example_tasks": [
            "Flag customer complaints exceeding severity threshold",
            "Route complex cases to senior staff",
            "Escalate system alerts to on-call personnel",
            "Identify edge cases that fall outside standard procedures",
        ],
        "likely_systems": ["ticketing", "alerting", "messaging"],
    },
    {
        "module_key": "exceptions",
        "capability_key": "disruption_assistant",
        "capability_name": "Disruption Response Assistant",
        "description": "Helps manage response to unexpected events by gathering context and coordinating initial steps.",
        "example_tasks": [
            "Compile context when a disruption occurs",
            "Notify affected parties of schedule changes",
            "Prepare weather disruption follow-through tasks",
            "Gather incident details for response planning",
        ],
        "likely_systems": ["alerting", "messaging", "documents"],
    },
    {
        "module_key": "exceptions",
        "capability_key": "exception_logging",
        "capability_name": "Exception Logging & Tracking",
        "description": "Records exceptions and unusual situations for pattern analysis and process improvement.",
        "example_tasks": [
            "Log exception details with timestamps and context",
            "Track exception frequency by category",
            "Generate exception trend reports",
            "Flag recurring exceptions for process review",
        ],
        "likely_systems": ["database", "analytics", "ticketing"],
    },

    # ── Learning & Updates ───────────────────────────────────────
    {
        "module_key": "learning",
        "capability_key": "standards_monitor",
        "capability_name": "Standards & Updates Monitor",
        "description": "Tracks changes to industry standards, regulations, and best practices relevant to the role.",
        "example_tasks": [
            "Monitor regulatory updates in relevant domains",
            "Track changes to industry standards",
            "Summarize new guidelines for the team",
            "Flag upcoming compliance deadlines",
        ],
        "likely_systems": ["web monitoring", "knowledge base", "email"],
    },
    {
        "module_key": "learning",
        "capability_key": "training_content",
        "capability_name": "Training Content Assistant",
        "description": "Helps prepare and organize training materials and learning resources.",
        "example_tasks": [
            "Compile training materials for new procedures",
            "Create quick-reference guides",
            "Organize learning resources by topic",
            "Draft onboarding checklists",
        ],
        "likely_systems": ["documents", "knowledge base", "LMS"],
    },
    {
        "module_key": "learning",
        "capability_key": "knowledge_capture",
        "capability_name": "Knowledge Capture",
        "description": "Captures institutional knowledge from experienced team members and documents it.",
        "example_tasks": [
            "Document tribal knowledge into searchable format",
            "Record expert decision-making patterns",
            "Build FAQ from common team questions",
            "Maintain lessons-learned database",
        ],
        "likely_systems": ["knowledge base", "documents", "wiki"],
    },

    # ── Research ─────────────────────────────────────────────────
    {
        "module_key": "research",
        "capability_key": "information_gathering",
        "capability_name": "Information Gathering",
        "description": "Finds and compiles information from multiple sources to answer specific questions.",
        "example_tasks": [
            "Research vendor options for a procurement decision",
            "Compile background information on a new market",
            "Gather regulatory requirements for a new process",
            "Pull specifications for equipment comparison",
        ],
        "likely_systems": ["web", "documents", "databases"],
    },
    {
        "module_key": "research",
        "capability_key": "competitive_scan",
        "capability_name": "Competitive & Market Scanning",
        "description": "Monitors competitive landscape and market changes relevant to the organization.",
        "example_tasks": [
            "Track competitor product announcements",
            "Monitor industry news for relevant developments",
            "Compile market trend summaries",
            "Flag emerging technologies in the field",
        ],
        "likely_systems": ["web monitoring", "news feeds", "analytics"],
    },
    {
        "module_key": "research",
        "capability_key": "document_review",
        "capability_name": "Document Review & Extraction",
        "description": "Reviews lengthy documents and extracts relevant sections, findings, or data points.",
        "example_tasks": [
            "Extract key clauses from contracts",
            "Summarize findings from research papers",
            "Pull relevant data from lengthy reports",
            "Identify critical information in regulatory filings",
        ],
        "likely_systems": ["documents", "knowledge base", "database"],
    },

    # ── Compliance & Policy ──────────────────────────────────────
    {
        "module_key": "compliance",
        "capability_key": "policy_checker",
        "capability_name": "Policy & Procedure Checker",
        "description": "Validates actions and outputs against established policies and procedures.",
        "example_tasks": [
            "Check submissions against policy requirements",
            "Verify process steps match approved procedures",
            "Flag deviations from standard protocols",
            "Validate documentation completeness for audits",
        ],
        "likely_systems": ["compliance software", "documents", "database"],
    },
    {
        "module_key": "compliance",
        "capability_key": "audit_prep",
        "capability_name": "Audit Preparation Assistant",
        "description": "Helps organize documentation and evidence for upcoming audits or reviews.",
        "example_tasks": [
            "Compile audit evidence packages",
            "Organize records by compliance category",
            "Generate audit trail reports",
            "Identify gaps in documentation before reviews",
        ],
        "likely_systems": ["document management", "compliance software", "database"],
    },
    {
        "module_key": "compliance",
        "capability_key": "regulatory_tracking",
        "capability_name": "Regulatory Change Tracking",
        "description": "Monitors and alerts on regulatory changes that may affect operations.",
        "example_tasks": [
            "Track regulatory updates in relevant jurisdictions",
            "Summarize impact of new regulations",
            "Maintain compliance calendar",
            "Flag upcoming regulatory deadlines",
        ],
        "likely_systems": ["web monitoring", "compliance software", "calendar"],
    },

    # ── Communication ────────────────────────────────────────────
    {
        "module_key": "communication",
        "capability_key": "message_drafting",
        "capability_name": "Message & Email Drafting",
        "description": "Drafts professional messages, emails, and responses for review before sending.",
        "example_tasks": [
            "Draft response emails to client inquiries",
            "Prepare stakeholder update messages",
            "Write follow-up communications",
            "Compose announcements for distribution",
        ],
        "likely_systems": ["email", "messaging", "CRM"],
    },
    {
        "module_key": "communication",
        "capability_key": "presentation_prep",
        "capability_name": "Presentation & Briefing Prep",
        "description": "Prepares presentation materials, talking points, and briefing documents.",
        "example_tasks": [
            "Build slide decks from data and notes",
            "Prepare talking points for meetings",
            "Create executive briefing documents",
            "Compile visual summaries for presentations",
        ],
        "likely_systems": ["presentation software", "documents", "analytics"],
    },
    {
        "module_key": "communication",
        "capability_key": "stakeholder_updates",
        "capability_name": "Stakeholder Update Manager",
        "description": "Manages recurring stakeholder communications with consistent format and cadence.",
        "example_tasks": [
            "Generate weekly stakeholder digests",
            "Prepare board-ready status summaries",
            "Distribute project updates to sponsors",
            "Maintain communication cadence with external partners",
        ],
        "likely_systems": ["email", "documents", "project management"],
    },

    # ── Data & Reporting ─────────────────────────────────────────
    {
        "module_key": "data_reporting",
        "capability_key": "dashboard_maintenance",
        "capability_name": "Dashboard & Metrics Maintenance",
        "description": "Keeps dashboards and metrics views current with the latest data.",
        "example_tasks": [
            "Update daily operational dashboards",
            "Refresh KPI tracking views",
            "Maintain data quality in reporting systems",
            "Configure new metrics as requirements evolve",
        ],
        "likely_systems": ["analytics", "dashboard software", "database"],
    },
    {
        "module_key": "data_reporting",
        "capability_key": "scheduled_reports",
        "capability_name": "Scheduled Report Generation",
        "description": "Generates and distributes recurring reports on a set schedule.",
        "example_tasks": [
            "Generate daily operational reports",
            "Compile and send weekly performance summaries",
            "Produce monthly compliance reports",
            "Create end-of-shift status reports",
        ],
        "likely_systems": ["analytics", "email", "documents"],
    },
    {
        "module_key": "data_reporting",
        "capability_key": "data_collection",
        "capability_name": "Data Collection & Organization",
        "description": "Gathers data from multiple sources and organizes it into usable formats.",
        "example_tasks": [
            "Collect survey responses into structured datasets",
            "Aggregate data from multiple systems",
            "Organize field data into standardized formats",
            "Maintain reference data tables",
        ],
        "likely_systems": ["database", "spreadsheets", "forms"],
    },
    {
        "module_key": "data_reporting",
        "capability_key": "data_visualization",
        "capability_name": "Data Visualization",
        "description": "Creates charts, graphs, and visual summaries to make data accessible.",
        "example_tasks": [
            "Create trend charts from time-series data",
            "Build comparison visualizations",
            "Generate infographics for team presentations",
            "Produce visual status boards",
        ],
        "likely_systems": ["analytics", "presentation software", "dashboard software"],
    },
]


def main():
    conn = get_db()
    cur = conn.cursor()

    # Create table if it doesn't exist (idempotent)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS module_capabilities (
            id SERIAL PRIMARY KEY,
            module_key TEXT NOT NULL,
            capability_key TEXT NOT NULL UNIQUE,
            capability_name TEXT NOT NULL,
            description TEXT NOT NULL,
            example_tasks TEXT[] NOT NULL DEFAULT '{}',
            likely_systems TEXT[] NOT NULL DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
    """)
    cur.execute("""
        CREATE INDEX IF NOT EXISTS module_capabilities_module_key_idx
        ON module_capabilities(module_key)
    """)

    inserted = 0
    updated = 0

    for cap in CAPABILITIES:
        cur.execute(
            "SELECT id FROM module_capabilities WHERE capability_key = %s",
            (cap["capability_key"],)
        )
        existing = cur.fetchone()

        if existing:
            cur.execute("""
                UPDATE module_capabilities
                SET module_key = %s,
                    capability_name = %s,
                    description = %s,
                    example_tasks = %s,
                    likely_systems = %s
                WHERE capability_key = %s
            """, (
                cap["module_key"],
                cap["capability_name"],
                cap["description"],
                cap["example_tasks"],
                cap["likely_systems"],
                cap["capability_key"],
            ))
            updated += 1
        else:
            cur.execute("""
                INSERT INTO module_capabilities
                    (module_key, capability_key, capability_name, description, example_tasks, likely_systems)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                cap["module_key"],
                cap["capability_key"],
                cap["capability_name"],
                cap["description"],
                cap["example_tasks"],
                cap["likely_systems"],
            ))
            inserted += 1

    conn.commit()
    cur.close()
    conn.close()

    total = len(CAPABILITIES)
    modules = len(set(c["module_key"] for c in CAPABILITIES))
    print(f"Capability catalog seeded: {total} capabilities across {modules} modules")
    print(f"  Inserted: {inserted}, Updated: {updated}")


if __name__ == "__main__":
    main()
