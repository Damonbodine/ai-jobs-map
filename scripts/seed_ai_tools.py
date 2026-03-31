#!/usr/bin/env python3
"""
Seed the AI tools capability database.
Consolidates tool suggestions scattered across import-onet-tasks.py and generate_enhanced_tasks.py
into a structured, queryable database with pricing and capability mappings.
"""
import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.db import get_db

TOOLS = [
    # Document & Data Processing
    {"name": "ChatGPT", "vendor": "OpenAI", "category": "general_ai", "capabilities": ["text_generation", "summarization", "analysis", "coding", "translation"], "pricing": "freemium", "low": 0, "high": 20, "url": "https://chat.openai.com", "dwas": ["mental_processes", "communication", "administrative"]},
    {"name": "Claude", "vendor": "Anthropic", "category": "general_ai", "capabilities": ["text_generation", "summarization", "analysis", "coding", "research"], "pricing": "freemium", "low": 0, "high": 20, "url": "https://claude.ai", "dwas": ["mental_processes", "communication", "administrative"]},
    {"name": "Gemini", "vendor": "Google", "category": "general_ai", "capabilities": ["text_generation", "summarization", "multimodal", "coding"], "pricing": "freemium", "low": 0, "high": 20, "url": "https://gemini.google.com", "dwas": ["mental_processes", "communication"]},
    {"name": "Perplexity", "vendor": "Perplexity AI", "category": "research", "capabilities": ["web_search", "research", "summarization", "citation"], "pricing": "freemium", "low": 0, "high": 20, "url": "https://perplexity.ai", "dwas": ["information_input", "mental_processes"]},
    {"name": "Notion AI", "vendor": "Notion", "category": "productivity", "capabilities": ["writing", "summarization", "project_management", "knowledge_base"], "pricing": "subscription", "low": 10, "high": 15, "url": "https://notion.so", "dwas": ["administrative", "communication", "mental_processes"]},

    # Document Processing
    {"name": "DocuSign", "vendor": "DocuSign", "category": "document_processing", "capabilities": ["e_signatures", "document_workflow", "contract_management"], "pricing": "subscription", "low": 10, "high": 40, "url": "https://docusign.com", "dwas": ["administrative"]},
    {"name": "Adobe Acrobat AI", "vendor": "Adobe", "category": "document_processing", "capabilities": ["ocr", "pdf_editing", "summarization", "document_ai"], "pricing": "subscription", "low": 13, "high": 23, "url": "https://acrobat.adobe.com", "dwas": ["administrative", "technical_work"]},

    # Data & Analytics
    {"name": "Tableau", "vendor": "Salesforce", "category": "analytics", "capabilities": ["data_visualization", "dashboards", "analytics", "reporting"], "pricing": "subscription", "low": 15, "high": 75, "url": "https://tableau.com", "dwas": ["mental_processes", "information_input"]},
    {"name": "Power BI", "vendor": "Microsoft", "category": "analytics", "capabilities": ["data_visualization", "dashboards", "reporting", "data_modeling"], "pricing": "freemium", "low": 0, "high": 10, "url": "https://powerbi.microsoft.com", "dwas": ["mental_processes", "information_input"]},
    {"name": "Julius AI", "vendor": "Julius", "category": "analytics", "capabilities": ["data_analysis", "visualization", "statistical_analysis"], "pricing": "freemium", "low": 0, "high": 20, "url": "https://julius.ai", "dwas": ["mental_processes"]},

    # Communication & Email
    {"name": "Grammarly", "vendor": "Grammarly", "category": "communication", "capabilities": ["writing_assistance", "grammar_check", "tone_adjustment", "email_drafting"], "pricing": "freemium", "low": 0, "high": 12, "url": "https://grammarly.com", "dwas": ["communication"]},
    {"name": "Superhuman", "vendor": "Superhuman", "category": "communication", "capabilities": ["email_management", "ai_drafting", "scheduling", "prioritization"], "pricing": "subscription", "low": 25, "high": 25, "url": "https://superhuman.com", "dwas": ["communication", "administrative"]},
    {"name": "Otter.ai", "vendor": "Otter", "category": "communication", "capabilities": ["transcription", "meeting_notes", "summarization", "action_items"], "pricing": "freemium", "low": 0, "high": 20, "url": "https://otter.ai", "dwas": ["communication", "information_input"]},

    # Scheduling & Coordination
    {"name": "Calendly", "vendor": "Calendly", "category": "scheduling", "capabilities": ["appointment_scheduling", "meeting_coordination", "calendar_management"], "pricing": "freemium", "low": 0, "high": 16, "url": "https://calendly.com", "dwas": ["administrative", "communication"]},
    {"name": "Reclaim.ai", "vendor": "Reclaim", "category": "scheduling", "capabilities": ["smart_scheduling", "time_blocking", "habit_tracking", "meeting_optimization"], "pricing": "freemium", "low": 0, "high": 18, "url": "https://reclaim.ai", "dwas": ["administrative"]},

    # Automation Platforms
    {"name": "Zapier", "vendor": "Zapier", "category": "automation", "capabilities": ["workflow_automation", "app_integration", "data_routing", "triggers"], "pricing": "freemium", "low": 0, "high": 70, "url": "https://zapier.com", "dwas": ["administrative", "technical_work"]},
    {"name": "Make (Integromat)", "vendor": "Make", "category": "automation", "capabilities": ["workflow_automation", "app_integration", "data_transformation", "visual_builder"], "pricing": "freemium", "low": 0, "high": 30, "url": "https://make.com", "dwas": ["administrative", "technical_work"]},
    {"name": "n8n", "vendor": "n8n", "category": "automation", "capabilities": ["workflow_automation", "self_hosted", "app_integration", "coding"], "pricing": "freemium", "low": 0, "high": 20, "url": "https://n8n.io", "dwas": ["administrative", "technical_work"]},

    # CRM & Sales
    {"name": "HubSpot AI", "vendor": "HubSpot", "category": "crm", "capabilities": ["crm", "email_automation", "lead_scoring", "content_generation"], "pricing": "freemium", "low": 0, "high": 90, "url": "https://hubspot.com", "dwas": ["communication", "administrative"]},
    {"name": "Apollo.io", "vendor": "Apollo", "category": "sales", "capabilities": ["lead_generation", "email_outreach", "contact_enrichment", "sequences"], "pricing": "freemium", "low": 0, "high": 80, "url": "https://apollo.io", "dwas": ["communication", "information_input"]},

    # Design & Creative
    {"name": "Canva AI", "vendor": "Canva", "category": "creative", "capabilities": ["graphic_design", "presentation", "image_generation", "templates"], "pricing": "freemium", "low": 0, "high": 13, "url": "https://canva.com", "dwas": ["technical_work", "communication"]},
    {"name": "Midjourney", "vendor": "Midjourney", "category": "creative", "capabilities": ["image_generation", "concept_art", "visual_design"], "pricing": "subscription", "low": 10, "high": 60, "url": "https://midjourney.com", "dwas": ["technical_work"]},

    # Finance & Accounting
    {"name": "QuickBooks AI", "vendor": "Intuit", "category": "finance", "capabilities": ["bookkeeping", "invoicing", "expense_tracking", "tax_prep"], "pricing": "subscription", "low": 15, "high": 50, "url": "https://quickbooks.intuit.com", "dwas": ["administrative"]},
    {"name": "Dext", "vendor": "Dext", "category": "finance", "capabilities": ["receipt_scanning", "expense_categorization", "data_extraction"], "pricing": "subscription", "low": 20, "high": 50, "url": "https://dext.com", "dwas": ["administrative", "information_input"]},

    # HR & People
    {"name": "Greenhouse", "vendor": "Greenhouse", "category": "hr", "capabilities": ["ats", "resume_screening", "interview_scheduling", "hiring_analytics"], "pricing": "subscription", "low": 50, "high": 500, "url": "https://greenhouse.io", "dwas": ["administrative", "management"]},
    {"name": "Rippling", "vendor": "Rippling", "category": "hr", "capabilities": ["hris", "payroll", "onboarding", "it_management"], "pricing": "subscription", "low": 8, "high": 25, "url": "https://rippling.com", "dwas": ["administrative", "management"]},

    # Project Management
    {"name": "Linear", "vendor": "Linear", "category": "project_management", "capabilities": ["issue_tracking", "project_planning", "ai_triage", "cycles"], "pricing": "freemium", "low": 0, "high": 8, "url": "https://linear.app", "dwas": ["management", "administrative"]},
    {"name": "Asana AI", "vendor": "Asana", "category": "project_management", "capabilities": ["task_management", "project_tracking", "workload_management", "ai_status"], "pricing": "freemium", "low": 0, "high": 25, "url": "https://asana.com", "dwas": ["management", "administrative"]},

    # Compliance & Legal
    {"name": "Harvey AI", "vendor": "Harvey", "category": "legal", "capabilities": ["legal_research", "contract_review", "document_drafting", "compliance"], "pricing": "subscription", "low": 100, "high": 500, "url": "https://harvey.ai", "dwas": ["mental_processes", "administrative"]},
    {"name": "Clio", "vendor": "Clio", "category": "legal", "capabilities": ["case_management", "billing", "document_management", "client_portal"], "pricing": "subscription", "low": 39, "high": 129, "url": "https://clio.com", "dwas": ["administrative"]},

    # Healthcare
    {"name": "Nuance DAX", "vendor": "Microsoft/Nuance", "category": "healthcare", "capabilities": ["clinical_documentation", "medical_transcription", "ambient_listening"], "pricing": "subscription", "low": 200, "high": 500, "url": "https://nuance.com/dax", "dwas": ["technical_work", "communication"]},

    # Education
    {"name": "Khanmigo", "vendor": "Khan Academy", "category": "education", "capabilities": ["tutoring", "lesson_planning", "student_feedback", "assessment"], "pricing": "freemium", "low": 0, "high": 9, "url": "https://khanacademy.org", "dwas": ["management", "communication"]},
]


def run():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS ai_tools (
            id SERIAL PRIMARY KEY,
            tool_name TEXT NOT NULL,
            vendor TEXT,
            category TEXT NOT NULL,
            capabilities TEXT,
            pricing_model TEXT,
            monthly_cost_low INTEGER,
            monthly_cost_high INTEGER,
            url TEXT,
            dwa_categories TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_ai_tools_cat ON ai_tools(category)")
    cur.execute("DELETE FROM ai_tools")

    for tool in TOOLS:
        cur.execute("""
            INSERT INTO ai_tools (tool_name, vendor, category, capabilities, pricing_model,
                monthly_cost_low, monthly_cost_high, url, dwa_categories)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            tool["name"], tool["vendor"], tool["category"],
            json.dumps(tool["capabilities"]),
            tool["pricing"],
            tool["low"], tool["high"],
            tool["url"],
            json.dumps(tool["dwas"]),
        ))

    conn.commit()
    print(f"Seeded {len(TOOLS)} AI tools")

    # Summary by category
    cur.execute("SELECT category, COUNT(*) FROM ai_tools GROUP BY category ORDER BY COUNT(*) DESC")
    print("\nBy category:")
    for cat, count in cur.fetchall():
        print(f"  {cat:25s} {count}")

    conn.close()


if __name__ == "__main__":
    run()
