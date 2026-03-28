"""
Populate the automation factory with core actions, workflows, and packages
Based on O*NET task patterns and real-world automation opportunities
"""
import os
import psycopg2
import json

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')

def get_db():
    return psycopg2.connect(DATABASE_URL)

# ============================================
# CORE AUTOMATION ACTIONS (based on O*NET DWAs)
# ============================================
CORE_ACTIONS = [
    # Data Entry & Recording
    ("ACT-DATA-001", "Data Entry & Recording", "Capture and input data from various sources", "data_management", 1, 2.0, ["forms", "ocr", "voice_to_text"], 520),
    ("ACT-DATA-002", "Record Keeping & Logging", "Maintain organized records and logs", "data_management", 1, 2.5, ["databases", "spreadsheets", "cloud_storage"], 480),
    ("ACT-DATA-003", "Data Validation & Verification", "Check data accuracy and completeness", "data_management", 2, 3.0, ["validation_rules", "cross_reference"], 340),
    ("ACT-DATA-004", "Data Classification & Categorization", "Sort and organize data by type", "data_management", 2, 2.0, ["ml_classification", "rules_engine"], 290),
    
    # Communication
    ("ACT-COMM-001", "Email Composition & Response", "Draft and send professional emails", "communication", 2, 3.0, ["email_ai", "templates", "crm"], 450),
    ("ACT-COMM-002", "Report Generation", "Create formatted reports from data", "communication", 3, 4.0, ["report_templates", "data_viz", "bi_tools"], 380),
    ("ACT-COMM-003", "Meeting Scheduling & Coordination", "Find optimal meeting times", "communication", 1, 1.5, ["calendar_ai", "scheduling_tools"], 410),
    ("ACT-COMM-004", "Message Routing & Escalation", "Direct messages to appropriate recipients", "communication", 2, 2.0, ["routing_rules", "ai_triage"], 280),
    
    # Analysis & Research
    ("ACT-ANLY-001", "Document Analysis & Summarization", "Extract key info from documents", "analysis", 3, 4.0, ["document_ai", "summarization_llm"], 420),
    ("ACT-ANLY-002", "Data Analysis & Pattern Detection", "Identify trends in datasets", "analysis", 4, 6.0, ["analytics_ai", "ml_models", "bi_tools"], 310),
    ("ACT-ANLY-003", "Market Research & Competitive Analysis", "Gather and analyze market data", "analysis", 4, 8.0, ["web_scraping", "ai_analysis"], 180),
    ("ACT-ANLY-004", "Sentiment Analysis", "Determine tone and sentiment", "analysis", 3, 3.0, ["nlp_models", "sentiment_ai"], 220),
    
    # Scheduling & Coordination
    ("ACT-SCHED-001", "Appointment Scheduling", "Book and manage appointments", "scheduling", 1, 2.0, ["calendar_ai", "booking_systems"], 380),
    ("ACT-SCHED-002", "Resource Allocation", "Assign resources to tasks", "scheduling", 3, 4.0, ["resource_ai", "optimization"], 150),
    ("ACT-SCHED-003", "Deadline Tracking & Reminders", "Monitor deadlines and send alerts", "scheduling", 1, 1.5, ["task_management", "notifications"], 340),
    
    # Document Processing
    ("ACT-DOC-001", "Document Generation", "Create contracts, letters, forms", "document_processing", 3, 5.0, ["doc_templates", "ai_writing"], 410),
    ("ACT-DOC-002", "Invoice & Receipt Processing", "Extract data from financial docs", "document_processing", 2, 3.0, ["ocr", "invoice_ai", "accounting"], 290),
    ("ACT-DOC-003", "Document Review & Compliance Check", "Review docs for compliance", "document_processing", 4, 6.0, ["compliance_ai", "rule_checking"], 180),
    ("ACT-DOC-004", "Form Processing & Extraction", "Process forms and extract fields", "document_processing", 2, 2.5, ["form_ai", "ocr"], 350),
    
    # Customer Service
    ("ACT-CS-001", "Customer Inquiry Response", "Respond to customer questions", "customer_service", 2, 3.0, ["chatbot", "knowledge_base"], 320),
    ("ACT-CS-002", "Ticket Routing & Prioritization", "Route support tickets appropriately", "customer_service", 2, 2.0, ["ticketing_ai", "priority_rules"], 280),
    ("ACT-CS-003", "Follow-up & Satisfaction Tracking", "Track customer satisfaction", "customer_service", 2, 2.5, ["survey_ai", "crm_integration"], 240),
    
    # Sales & Marketing
    ("ACT-SALES-001", "Lead Qualification & Scoring", "Score and qualify leads", "sales_marketing", 3, 4.0, ["lead_ai", "scoring_models"], 210),
    ("ACT-SALES-002", "Outreach Personalization", "Create personalized outreach", "sales_marketing", 3, 4.0, ["personalization_ai", "email_ai"], 190),
    ("ACT-SALES-003", "Proposal Generation", "Create sales proposals", "sales_marketing", 4, 6.0, ["proposal_templates", "ai_writing"], 160),
    ("ACT-SALES-004", "Social Media Content Creation", "Generate social media posts", "sales_marketing", 3, 4.0, ["content_ai", "scheduling_tools"], 175),
    
    # Finance & Accounting
    ("ACT-FIN-001", "Expense Categorization", "Categorize expenses automatically", "finance", 2, 2.0, ["accounting_ai", "ml_classification"], 280),
    ("ACT-FIN-002", "Invoice Matching & Reconciliation", "Match invoices to payments", "finance", 3, 4.0, ["reconciliation_ai", "accounting"], 190),
    ("ACT-FIN-003", "Budget Tracking & Alerts", "Monitor budgets and send alerts", "finance", 2, 2.5, ["budget_tools", "notifications"], 230),
    
    # HR & People
    ("ACT-HR-001", "Resume Screening & Ranking", "Screen and rank job applicants", "hr", 3, 4.0, ["resume_ai", "screening_rules"], 220),
    ("ACT-HR-002", "Onboarding Workflow", "Manage employee onboarding", "hr", 3, 5.0, ["onboarding_ai", "doc_gen"], 180),
    ("ACT-HR-003", "Performance Data Aggregation", "Collect performance metrics", "hr", 2, 3.0, ["hris_integration", "analytics"], 210),
    
    # Project Management
    ("ACT-PM-001", "Task Creation & Assignment", "Create and assign project tasks", "project_management", 2, 2.5, ["project_tools", "workload_ai"], 310),
    ("ACT-PM-002", "Status Reporting & Dashboards", "Generate project status reports", "project_management", 3, 4.0, ["dashboards", "report_ai"], 260),
    ("ACT-PM-003", "Risk Identification & Alerts", "Identify project risks early", "project_management", 4, 5.0, ["risk_ai", "predictive_analytics"], 140),
    
    # Quality & Compliance
    ("ACT-QC-001", "Quality Check Automation", "Automate quality inspections", "quality", 3, 5.0, ["vision_ai", "rules_engine"], 170),
    ("ACT-QC-002", "Compliance Monitoring", "Monitor regulatory compliance", "quality", 4, 6.0, ["compliance_ai", "alerting"], 150),
    ("ACT-QC-003", "Audit Trail Generation", "Create audit documentation", "quality", 2, 3.0, ["logging", "report_gen"], 200),
]

# ============================================
# WORKFLOW TEMPLATES (chained actions)
# ============================================
WORKFLOWS = [
    # Sales & Marketing Workflows
    {
        "code": "WF-SALES-001",
        "name": "Lead Capture to Qualification",
        "description": "Capture leads from web forms, enrich with data, qualify and score",
        "category": "sales_marketing",
        "trigger_type": "event",
        "input_sources": ["web_form", "linkedin", "website"],
        "output_destinations": ["crm", "email", "slack"],
        "requires_human_approval": True,
        "base_price": 2497,
        "monthly_price": 147,
        "time_saved_per_day": 1.5,
        "action_codes": ["ACT-DATA-001", "ACT-SALES-001", "ACT-COMM-001"]
    },
    {
        "code": "WF-SALES-002",
        "name": "Cold Outreach Pipeline",
        "description": "Personalized cold outreach at scale with follow-up sequences",
        "category": "sales_marketing",
        "trigger_type": "scheduled",
        "input_sources": ["lead_database", "linkedin"],
        "output_destinations": ["email", "crm", "calendar"],
        "requires_human_approval": True,
        "base_price": 3497,
        "monthly_price": 197,
        "time_saved_per_day": 2.0,
        "action_codes": ["ACT-SALES-002", "ACT-COMM-001", "ACT-SCHED-001"]
    },
    {
        "code": "WF-SALES-003",
        "name": "Proposal Generation Engine",
        "description": "Auto-generate custom proposals from client requirements",
        "category": "sales_marketing",
        "trigger_type": "manual",
        "input_sources": ["crm", "requirements_form"],
        "output_destinations": ["pdf", "email", "crm"],
        "requires_human_approval": True,
        "base_price": 2997,
        "monthly_price": 147,
        "time_saved_per_day": 1.0,
        "action_codes": ["ACT-ANLY-001", "ACT-DOC-001", "ACT-SALES-003"]
    },
    
    # Customer Service Workflows
    {
        "code": "WF-CS-001",
        "name": "Smart Ticket Triage",
        "description": "AI-powered ticket routing and initial response generation",
        "category": "customer_service",
        "trigger_type": "event",
        "input_sources": ["email", "chat", "phone", "form"],
        "output_destinations": ["ticketing_system", "email", "slack"],
        "requires_human_approval": False,
        "base_price": 1997,
        "monthly_price": 97,
        "time_saved_per_day": 2.5,
        "action_codes": ["ACT-CS-001", "ACT-CS-002", "ACT-COMM-004"]
    },
    {
        "code": "WF-CS-002",
        "name": "Customer Feedback Analysis",
        "description": "Analyze feedback, detect sentiment, generate insights",
        "category": "customer_service",
        "trigger_type": "scheduled",
        "input_sources": ["surveys", "reviews", "support_tickets"],
        "output_destinations": ["dashboard", "email", "report"],
        "requires_human_approval": False,
        "base_price": 2497,
        "monthly_price": 147,
        "time_saved_per_day": 1.0,
        "action_codes": ["ACT-ANLY-004", "ACT-ANLY-001", "ACT-COMM-002"]
    },
    
    # Finance & Accounting Workflows
    {
        "code": "WF-FIN-001",
        "name": "Invoice Processing Pipeline",
        "description": "Extract, validate, and route invoices for approval",
        "category": "finance",
        "trigger_type": "event",
        "input_sources": ["email", "upload", "portal"],
        "output_destinations": ["accounting_system", "approval_queue", "slack"],
        "requires_human_approval": True,
        "base_price": 2997,
        "monthly_price": 147,
        "time_saved_per_day": 2.0,
        "action_codes": ["ACT-DOC-002", "ACT-FIN-001", "ACT-FIN-002"]
    },
    {
        "code": "WF-FIN-002",
        "name": "Expense Report Automation",
        "description": "Auto-categorize and process expense reports",
        "category": "finance",
        "trigger_type": "event",
        "input_sources": ["receipt_photos", "credit_card_feed", "form"],
        "output_destinations": ["accounting_system", "manager_approval", "employee"],
        "requires_human_approval": True,
        "base_price": 2497,
        "monthly_price": 127,
        "time_saved_per_day": 1.5,
        "action_codes": ["ACT-DOC-004", "ACT-FIN-001", "ACT-DATA-003"]
    },
    
    # HR & People Workflows
    {
        "code": "WF-HR-001",
        "name": "Hiring Pipeline Automation",
        "description": "Screen resumes, schedule interviews, send updates",
        "category": "hr",
        "trigger_type": "event",
        "input_sources": ["job_board", "careers_page", "referral"],
        "output_destinations": ["ats", "calendar", "email"],
        "requires_human_approval": True,
        "base_price": 3997,
        "monthly_price": 197,
        "time_saved_per_day": 2.0,
        "action_codes": ["ACT-HR-001", "ACT-SCHED-001", "ACT-COMM-001"]
    },
    {
        "code": "WF-HR-002",
        "name": "Employee Onboarding Flow",
        "description": "Automated onboarding document generation and task assignment",
        "category": "hr",
        "trigger_type": "event",
        "input_sources": ["hris", "form"],
        "output_destinations": ["email", "doc_sign", "hris", "slack"],
        "requires_human_approval": False,
        "base_price": 3497,
        "monthly_price": 177,
        "time_saved_per_day": 1.5,
        "action_codes": ["ACT-HR-002", "ACT-DOC-001", "ACT-PM-001"]
    },
    
    # Operations Workflows
    {
        "code": "WF-OPS-001",
        "name": "Daily Report Aggregation",
        "description": "Collect data from sources, generate daily summary reports",
        "category": "operations",
        "trigger_type": "scheduled",
        "input_sources": ["databases", "apis", "spreadsheets"],
        "output_destinations": ["email", "slack", "dashboard"],
        "requires_human_approval": False,
        "base_price": 1997,
        "monthly_price": 97,
        "time_saved_per_day": 1.0,
        "action_codes": ["ACT-ANLY-002", "ACT-COMM-002", "ACT-DATA-004"]
    },
    {
        "code": "WF-OPS-002",
        "name": "Meeting Prep Automation",
        "description": "Auto-generate meeting agendas and pre-reads",
        "category": "operations",
        "trigger_type": "scheduled",
        "input_sources": ["calendar", "crm", "project_tool"],
        "output_destinations": ["email", "slack", "doc"],
        "requires_human_approval": False,
        "base_price": 1497,
        "monthly_price": 77,
        "time_saved_per_day": 0.75,
        "action_codes": ["ACT-SCHED-001", "ACT-ANLY-001", "ACT-DOC-001"]
    },
    
    # Content & Marketing Workflows
    {
        "code": "WF-MKT-001",
        "name": "Social Media Content Factory",
        "description": "Generate, schedule, and publish social content",
        "category": "marketing",
        "trigger_type": "scheduled",
        "input_sources": ["content_calendar", "blog", "industry_news"],
        "output_destinations": ["social_platforms", "approval_queue", "analytics"],
        "requires_human_approval": True,
        "base_price": 2997,
        "monthly_price": 147,
        "time_saved_per_day": 1.5,
        "action_codes": ["ACT-SALES-004", "ACT-ANLY-003", "ACT-SCHED-003"]
    },
    
    # Compliance & Quality
    {
        "code": "WF-QC-001",
        "name": "Compliance Audit Automation",
        "description": "Automated compliance checks and audit trail generation",
        "category": "compliance",
        "trigger_type": "scheduled",
        "input_sources": ["documents", "systems", "databases"],
        "output_destinations": ["report", "alert", "archive"],
        "requires_human_approval": False,
        "base_price": 4997,
        "monthly_price": 247,
        "time_saved_per_day": 2.0,
        "action_codes": ["ACT-QC-002", "ACT-QC-003", "ACT-ANLY-001"]
    },
]

# ============================================
# SELLABLE PACKAGES
# ============================================
PACKAGES = [
    {
        "code": "PKG-STARTER-001",
        "name": "Lead Generation Starter",
        "description": "Capture and qualify leads automatically. Perfect for small sales teams.",
        "tier": "starter",
        "workflow_codes": ["WF-SALES-001"],
        "base_price": 2997,
        "monthly_price": 147,
        "setup_hours": 8.0,
        "includes_self_healing": True,
        "includes_integrations": 1,
        "target_occupations": ["Sales Managers", "Sales Representatives", "Marketing Managers"],
        "roi_multiplier": 4.5
    },
    {
        "code": "PKG-GROWTH-001",
        "name": "Sales Automation Growth Pack",
        "description": "Full sales pipeline automation from lead to close",
        "tier": "growth",
        "workflow_codes": ["WF-SALES-001", "WF-SALES-002", "WF-SALES-003"],
        "base_price": 5997,
        "monthly_price": 297,
        "setup_hours": 16.0,
        "includes_self_healing": True,
        "includes_integrations": 3,
        "target_occupations": ["Sales Managers", "Business Development Managers"],
        "roi_multiplier": 6.0
    },
    {
        "code": "PKG-STARTER-002",
        "name": "Customer Support Starter",
        "description": "Smart ticket routing and auto-responses for support teams",
        "tier": "starter",
        "workflow_codes": ["WF-CS-001"],
        "base_price": 2497,
        "monthly_price": 127,
        "setup_hours": 6.0,
        "includes_self_healing": True,
        "includes_integrations": 1,
        "target_occupations": ["Customer Service Representatives", "Support Managers"],
        "roi_multiplier": 5.0
    },
    {
        "code": "PKG-GROWTH-002",
        "name": "Customer Experience Automation",
        "description": "Full customer service automation with feedback analysis",
        "tier": "growth",
        "workflow_codes": ["WF-CS-001", "WF-CS-002"],
        "base_price": 4497,
        "monthly_price": 197,
        "setup_hours": 12.0,
        "includes_self_healing": True,
        "includes_integrations": 2,
        "target_occupations": ["Customer Service Managers", "Operations Managers"],
        "roi_multiplier": 5.5
    },
    {
        "code": "PKG-STARTER-003",
        "name": "Invoice Processing Starter",
        "description": "Automate invoice capture, extraction, and routing",
        "tier": "starter",
        "workflow_codes": ["WF-FIN-001"],
        "base_price": 2997,
        "monthly_price": 147,
        "setup_hours": 8.0,
        "includes_self_healing": True,
        "includes_integrations": 1,
        "target_occupations": ["Accountants", "Bookkeeping Clerks", "Accounts Payable Clerks"],
        "roi_multiplier": 4.0
    },
    {
        "code": "PKG-ENTERPRISE-001",
        "name": "Finance Operations Suite",
        "description": "Complete finance automation: invoices, expenses, reconciliation",
        "tier": "enterprise",
        "workflow_codes": ["WF-FIN-001", "WF-FIN-002", "WF-FIN-003"],
        "base_price": 8997,
        "monthly_price": 447,
        "setup_hours": 24.0,
        "includes_self_healing": True,
        "includes_integrations": 5,
        "target_occupations": ["Financial Managers", "Controllers", "CFOs"],
        "roi_multiplier": 7.0
    },
    {
        "code": "PKG-STARTER-004",
        "name": "Hiring Automation Starter",
        "description": "Resume screening and interview scheduling automation",
        "tier": "starter",
        "workflow_codes": ["WF-HR-001"],
        "base_price": 3497,
        "monthly_price": 177,
        "setup_hours": 10.0,
        "includes_self_healing": True,
        "includes_integrations": 2,
        "target_occupations": ["Human Resources Specialists", "Recruiters"],
        "roi_multiplier": 4.5
    },
    {
        "code": "PKG-GROWTH-003",
        "name": "HR Automation Growth Pack",
        "description": "Hiring + onboarding automation for growing teams",
        "tier": "growth",
        "workflow_codes": ["WF-HR-001", "WF-HR-002"],
        "base_price": 5997,
        "monthly_price": 297,
        "setup_hours": 18.0,
        "includes_self_healing": True,
        "includes_integrations": 3,
        "target_occupations": ["Human Resources Managers", "HR Directors"],
        "roi_multiplier": 5.5
    },
    {
        "code": "PKG-STARTER-005",
        "name": "Operations Reporting Starter",
        "description": "Automated daily/weekly report generation",
        "tier": "starter",
        "workflow_codes": ["WF-OPS-001"],
        "base_price": 1997,
        "monthly_price": 97,
        "setup_hours": 6.0,
        "includes_self_healing": True,
        "includes_integrations": 1,
        "target_occupations": ["Operations Managers", "Project Managers"],
        "roi_multiplier": 3.5
    },
    {
        "code": "PKG-ENTERPRISE-002",
        "name": "Full Operations Automation",
        "description": "Complete ops automation: reports, meetings, compliance",
        "tier": "enterprise",
        "workflow_codes": ["WF-OPS-001", "WF-OPS-002", "WF-QC-001"],
        "base_price": 9997,
        "monthly_price": 497,
        "setup_hours": 28.0,
        "includes_self_healing": True,
        "includes_integrations": 6,
        "target_occupations": ["Operations Directors", "COOs"],
        "roi_multiplier": 8.0
    },
    {
        "code": "PKG-MARKETING-001",
        "name": "Content Marketing Engine",
        "description": "Social media content factory with scheduling",
        "tier": "growth",
        "workflow_codes": ["WF-MKT-001"],
        "base_price": 3497,
        "monthly_price": 177,
        "setup_hours": 10.0,
        "includes_self_healing": True,
        "includes_integrations": 2,
        "target_occupations": ["Marketing Managers", "Content Managers", "Social Media Managers"],
        "roi_multiplier": 5.0
    },
]

def populate():
    conn = get_db()
    cur = conn.cursor()
    
    print("=" * 60)
    print("Populating Automation Factory")
    print("=" * 60)
    
    # Insert Actions
    print("\n📦 Inserting Actions...")
    action_id_map = {}
    for action in CORE_ACTIONS:
        code, name, desc, category, complexity, hours, integrations, occ_count = action
        cur.execute("""
            INSERT INTO automation_actions (action_code, action_name, action_description, category, base_complexity, estimated_hours, common_integrations, reusable_across_occupations)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (action_code) DO UPDATE SET reusable_across_occupations = EXCLUDED.reusable_across_occupations
            RETURNING id, action_code
        """, (code, name, desc, category, complexity, hours, integrations, occ_count))
        row = cur.fetchone()
        action_id_map[code] = row[0]
    print(f"  ✓ {len(CORE_ACTIONS)} actions inserted")
    
    # Insert Workflows
    print("\n⚡ Inserting Workflows...")
    workflow_id_map = {}
    for wf in WORKFLOWS:
        action_ids = [action_id_map.get(c) for c in wf["action_codes"] if c in action_id_map]
        cur.execute("""
            INSERT INTO automation_workflows (workflow_code, workflow_name, workflow_description, category, trigger_type, input_sources, output_destinations, requires_human_approval, base_price, monthly_maintenance, estimated_time_saved_per_day, action_ids)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (workflow_code) DO NOTHING
            RETURNING id, workflow_code
        """, (wf["code"], wf["name"], wf["description"], wf["category"], wf["trigger_type"], 
              wf["input_sources"], wf["output_destinations"], wf["requires_human_approval"],
              wf["base_price"], wf["monthly_price"], wf["time_saved_per_day"], action_ids))
        row = cur.fetchone()
        if row:
            workflow_id_map[wf["code"]] = row[0]
    print(f"  ✓ {len(workflow_id_map)} workflows inserted")
    
    # Insert Packages
    print("\n🎁 Inserting Packages...")
    for pkg in PACKAGES:
        wf_ids = [workflow_id_map.get(c) for c in pkg["workflow_codes"] if c in workflow_id_map]
        cur.execute("""
            INSERT INTO automation_packages (package_code, package_name, package_description, tier, workflow_ids, base_price, monthly_price, setup_hours, includes_self_healing, includes_integrations, target_occupations, roi_multiplier)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (package_code) DO NOTHING
        """, (pkg["code"], pkg["name"], pkg["description"], pkg["tier"], wf_ids,
              pkg["base_price"], pkg["monthly_price"], pkg["setup_hours"],
              pkg["includes_self_healing"], pkg["includes_integrations"],
              pkg["target_occupations"], pkg["roi_multiplier"]))
    print(f"  ✓ {len(PACKAGES)} packages inserted")
    
    # Summary
    cur.execute("SELECT COUNT(*) FROM automation_actions")
    actions = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM automation_workflows")
    workflows = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM automation_packages")
    packages = cur.fetchone()[0]
    
    print("\n" + "=" * 60)
    print("FACTORY POPULATION COMPLETE")
    print(f"  Actions: {actions}")
    print(f"  Workflows: {workflows}")
    print(f"  Packages: {packages}")
    print("=" * 60)
    
    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    populate()
