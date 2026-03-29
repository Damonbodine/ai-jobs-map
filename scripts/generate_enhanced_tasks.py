#!/usr/bin/env python3
"""
Generate Enhanced Tasks with Business Context
Takes existing O*NET data and enriches with:
- Task granularity
- Frequency estimates
- Risk levels
- Business impact
- ROI calculations
- Proof points
"""

import os
import psycopg2
import random
from datetime import datetime

def load_env():
    env = {}
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, val = line.strip().split('=', 1)
                    env[key] = val.strip().strip('"').strip("'")
    except:
        pass
    return env

env = load_env()
DATABASE_URL = os.getenv('DATABASE_URL') or env.get('DATABASE_URL')

# Task frequency patterns by category
FREQUENCY_PATTERNS = {
    'communication': {'daily': 0.6, 'weekly': 0.3, 'monthly': 0.1},
    'analysis': {'daily': 0.3, 'weekly': 0.5, 'monthly': 0.2},
    'writing': {'daily': 0.4, 'weekly': 0.4, 'monthly': 0.2},
    'planning': {'daily': 0.2, 'weekly': 0.5, 'monthly': 0.3},
    'data_entry': {'daily': 0.7, 'weekly': 0.2, 'monthly': 0.1},
    'finance': {'weekly': 0.3, 'monthly': 0.5, 'quarterly': 0.2},
    'sales': {'daily': 0.5, 'weekly': 0.4, 'monthly': 0.1},
    'hr': {'weekly': 0.4, 'monthly': 0.4, 'quarterly': 0.2},
    'operations': {'daily': 0.5, 'weekly': 0.4, 'monthly': 0.1},
    'compliance': {'weekly': 0.3, 'monthly': 0.5, 'quarterly': 0.2},
}

# Risk patterns by task keywords
RISK_PATTERNS = {
    'high': ['financial', 'legal', 'compliance', 'security', 'customer', 'contract', 'budget', 'audit'],
    'medium': ['report', 'analysis', 'review', 'approval', 'decision', 'strategy', 'planning'],
    'low': ['documentation', 'scheduling', 'data entry', 'research', 'organization'],
}

# Business impact patterns
IMPACT_PATTERNS = {
    'revenue': ['sales', 'customer', 'client', 'proposal', 'pitch', 'closing', 'lead'],
    'cost': ['budget', 'expense', 'procurement', 'vendor', 'cost', 'savings'],
    'risk': ['compliance', 'audit', 'legal', 'security', 'quality', 'safety'],
    'quality': ['review', 'testing', 'validation', 'verification', 'inspection'],
    'scalability': ['process', 'workflow', 'automation', 'system', 'platform'],
}

# Automation readiness patterns
READINESS_PATTERNS = {
    'ready_now': {
        'keywords': ['data entry', 'scheduling', 'email', 'report', 'documentation', 'research'],
        'confidence': 0.85,
    },
    'ready_soon': {
        'keywords': ['analysis', 'writing', 'communication', 'planning'],
        'confidence': 0.70,
    },
    'needs_review': {
        'keywords': ['decision', 'judgment', 'approval', 'strategy', 'negotiation'],
        'confidence': 0.50,
    },
}

# Proof points database
PROOF_POINTS = {
    'communication': [
        {'tool': 'Gmail + AI', 'url': 'https://gmail.com', 'pricing': 'Free-$12/mo', 'setup': '5 min'},
        {'tool': 'Slack + AI', 'url': 'https://slack.com', 'pricing': '$7-12/mo', 'setup': '15 min'},
        {'tool': 'Calendly', 'url': 'https://calendly.com', 'pricing': 'Free-$12/mo', 'setup': '10 min'},
    ],
    'analysis': [
        {'tool': 'ChatGPT', 'url': 'https://chat.openai.com', 'pricing': 'Free-$20/mo', 'setup': '2 min'},
        {'tool': 'Claude', 'url': 'https://claude.ai', 'pricing': 'Free-$20/mo', 'setup': '2 min'},
        {'tool': 'Tableau + AI', 'url': 'https://tableau.com', 'pricing': '$70/mo', 'setup': '30 min'},
    ],
    'writing': [
        {'tool': 'Jasper', 'url': 'https://jasper.ai', 'pricing': '$49/mo', 'setup': '10 min'},
        {'tool': 'Copy.ai', 'url': 'https://copy.ai', 'pricing': 'Free-$49/mo', 'setup': '5 min'},
        {'tool': 'Grammarly', 'url': 'https://grammarly.com', 'pricing': 'Free-$30/mo', 'setup': '5 min'},
    ],
    'planning': [
        {'tool': 'Calendly', 'url': 'https://calendly.com', 'pricing': 'Free-$12/mo', 'setup': '10 min'},
        {'tool': 'Asana + AI', 'url': 'https://asana.com', 'pricing': 'Free-$24/mo', 'setup': '20 min'},
        {'tool': 'Notion AI', 'url': 'https://notion.so', 'pricing': '$10/mo', 'setup': '15 min'},
    ],
    'data_entry': [
        {'tool': 'Zapier', 'url': 'https://zapier.com', 'pricing': 'Free-$20/mo', 'setup': '15 min'},
        {'tool': 'UiPath', 'url': 'https://uipath.com', 'pricing': 'Custom', 'setup': '2-4 hrs'},
        {'tool': 'Airtable', 'url': 'https://airtable.com', 'pricing': 'Free-$20/mo', 'setup': '30 min'},
    ],
    'finance': [
        {'tool': 'QuickBooks + AI', 'url': 'https://quickbooks.com', 'pricing': '$30/mo', 'setup': '1 hr'},
        {'tool': 'Xero', 'url': 'https://xero.com', 'pricing': '$13/mo', 'setup': '30 min'},
        {'tool': 'Ramp', 'url': 'https://ramp.com', 'pricing': 'Free', 'setup': '15 min'},
    ],
    'sales': [
        {'tool': 'HubSpot + AI', 'url': 'https://hubspot.com', 'pricing': 'Free-$45/mo', 'setup': '30 min'},
        {'tool': 'Salesforce Einstein', 'url': 'https://salesforce.com', 'pricing': '$25/mo', 'setup': '1-2 hrs'},
        {'tool': 'Apollo.io', 'url': 'https://apollo.io', 'pricing': 'Free-$99/mo', 'setup': '20 min'},
    ],
    'hr': [
        {'tool': 'Greenhouse + AI', 'url': 'https://greenhouse.com', 'pricing': 'Custom', 'setup': '2-4 hrs'},
        {'tool': 'Workday', 'url': 'https://workday.com', 'pricing': 'Custom', 'setup': '4+ hrs'},
        {'tool': 'Lattice', 'url': 'https://lattice.com', 'pricing': '$11/mo', 'setup': '30 min'},
    ],
    'operations': [
        {'tool': 'Monday.com', 'url': 'https://monday.com', 'pricing': '$8/mo', 'setup': '30 min'},
        {'tool': 'ClickUp', 'url': 'https://clickup.com', 'pricing': 'Free-$7/mo', 'setup': '20 min'},
        {'tool': 'Jira', 'url': 'https://jira.com', 'pricing': 'Free-$7/mo', 'setup': '45 min'},
    ],
    'compliance': [
        {'tool': 'Vanta', 'url': 'https://vanta.com', 'pricing': 'Custom', 'setup': '2-4 hrs'},
        {'tool': 'Drata', 'url': 'https://drata.com', 'pricing': 'Custom', 'setup': '2-4 hrs'},
        {'tool': 'LogicGate', 'url': 'https://logicgate.com', 'pricing': 'Custom', 'setup': '4+ hrs'},
    ],
}

def get_category_for_task(task_title: str, task_desc: str) -> str:
    """Determine task category based on keywords"""
    text = f"{task_title} {task_desc}".lower()
    
    category_scores = {}
    for category, patterns in FREQUENCY_PATTERNS.items():
        score = 0
        if category in text:
            score += 2
        for keyword in ['email', 'meeting', 'call', 'presentation']:
            if keyword in text and category == 'communication':
                score += 1
        for keyword in ['analyze', 'research', 'data', 'report']:
            if keyword in text and category == 'analysis':
                score += 1
        for keyword in ['write', 'document', 'content', 'draft']:
            if keyword in text and category == 'writing':
                score += 1
        for keyword in ['schedule', 'plan', 'calendar', 'organize']:
            if keyword in text and category == 'planning':
                score += 1
        for keyword in ['input', 'enter', 'record', 'update']:
            if keyword in text and category == 'data_entry':
                score += 1
        category_scores[category] = score
    
    if category_scores:
        return max(category_scores, key=category_scores.get)
    return 'operations'

def get_frequency(category: str) -> str:
    """Get frequency based on category"""
    patterns = FREQUENCY_PATTERNS.get(category, FREQUENCY_PATTERNS['operations'])
    return random.choices(list(patterns.keys()), weights=list(patterns.values()))[0]

def get_risk_level(task_title: str, task_desc: str) -> str:
    """Determine risk level based on content"""
    text = f"{task_title} {task_desc}".lower()
    
    for risk_level, keywords in RISK_PATTERNS.items():
        for keyword in keywords:
            if keyword in text:
                return risk_level
    return 'low'

def get_business_impact(task_title: str, task_desc: str) -> dict:
    """Determine business impact areas"""
    text = f"{task_title} {task_desc}".lower()
    impacts = {}
    
    for impact, keywords in IMPACT_PATTERNS.items():
        impacts[f'impact_{impact}'] = any(keyword in text for keyword in keywords)
    
    return impacts

def get_automation_readiness(task_title: str, task_desc: str) -> dict:
    """Determine automation readiness"""
    text = f"{task_title} {task_desc}".lower()
    
    for readiness, config in READINESS_PATTERNS.items():
        for keyword in config['keywords']:
            if keyword in text:
                return {
                    'readiness': readiness,
                    'confidence': config['confidence'],
                    'difficulty': 'easy' if readiness == 'ready_now' else 'moderate' if readiness == 'ready_soon' else 'hard',
                }
    
    return {
        'readiness': 'needs_review',
        'confidence': 0.50,
        'difficulty': 'moderate',
    }

def calculate_roi(frequency: str, time_per_occurrence: float, hourly_rate: float = 50) -> dict:
    """Calculate ROI based on frequency and time"""
    frequency_multiplier = {
        'daily': 5,
        'weekly': 1,
        'monthly': 0.25,
        'quarterly': 0.08,
        'yearly': 0.02,
        'as_needed': 0.5,
    }
    
    weekly_hours = time_per_occurrence * frequency_multiplier.get(frequency, 1)
    weekly_savings = weekly_hours * hourly_rate
    monthly_savings = weekly_savings * 4
    annual_savings = weekly_savings * 52
    
    return {
        'weekly_hours': weekly_hours,
        'weekly_savings': weekly_savings,
        'monthly_savings': monthly_savings,
        'annual_savings': annual_savings,
    }

def get_proof_points(category: str) -> list:
    """Get proof points for a category"""
    return PROOF_POINTS.get(category, PROOF_POINTS['operations'])

def generate_enhanced_tasks():
    """Generate enhanced tasks from existing O*NET data"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print("Generating Enhanced Tasks...")
    
    # Get categories
    cur.execute("SELECT id, category_code FROM task_categories")
    categories = {row[1]: row[0] for row in cur.fetchall()}
    
    # Get existing tasks (limit to top occupations for now)
    cur.execute("""
        SELECT ot.id, ot.task_title, ot.task_description, ot.occupation_id, o.title
        FROM onet_tasks ot
        JOIN occupations o ON ot.occupation_id = o.id
        WHERE ot.ai_automatable IS NOT NULL
        ORDER BY ot.ai_automation_score DESC NULLS LAST
        LIMIT 500
    """)
    
    tasks = cur.fetchall()
    print(f"Found {len(tasks)} tasks to enhance")
    
    enhanced_count = 0
    for task_id, task_title, task_desc, occ_id, occ_title in tasks:
        if not task_title:
            continue
        
        # Determine properties
        category = get_category_for_task(task_title, task_desc or '')
        category_id = categories.get(category, categories['operations'])
        frequency = get_frequency(category)
        risk_level = get_risk_level(task_title, task_desc or '')
        impacts = get_business_impact(task_title, task_desc or '')
        readiness = get_automation_readiness(task_title, task_desc or '')
        
        # Estimate time
        time_per_occurrence = random.uniform(0.25, 2.0)  # 15 min to 2 hours
        roi = calculate_roi(frequency, time_per_occurrence)
        
        # Generate task code
        task_code = f"ET-{occ_id}-{task_id}"
        
        # Insert enhanced task
        try:
            cur.execute("""
                INSERT INTO enhanced_tasks (
                    task_code, task_name, task_description, occupation_id, category_id,
                    frequency, time_per_occurrence_hours, occurrences_per_week, weekly_hours,
                    risk_level, data_sensitivity, requires_human_judgment,
                    impact_revenue, impact_cost, impact_risk, impact_quality, impact_scalability,
                    automation_readiness, automation_difficulty, automation_confidence,
                    estimated_weekly_savings_hours, estimated_weekly_savings_dollars,
                    estimated_monthly_savings_dollars, estimated_annual_savings_dollars,
                    is_core_task, is_high_value, sort_priority
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s
                )
                ON CONFLICT (task_code) DO NOTHING
            """, (
                task_code, task_title, task_desc, occ_id, category_id,
                frequency, time_per_occurrence, 
                {'daily': 5, 'weekly': 1, 'monthly': 0.25}.get(frequency, 1),
                roi['weekly_hours'],
                risk_level, 
                'confidential' if risk_level in ['high', 'critical'] else 'internal',
                risk_level in ['high', 'critical'],
                impacts.get('impact_revenue', False),
                impacts.get('impact_cost', False),
                impacts.get('impact_risk', False),
                impacts.get('impact_quality', False),
                impacts.get('impact_scalability', False),
                readiness['readiness'],
                readiness['difficulty'],
                readiness['confidence'],
                roi['weekly_hours'],
                roi['weekly_savings'],
                roi['monthly_savings'],
                roi['annual_savings'],
                random.random() < 0.3,  # 30% are core tasks
                roi['annual_savings'] > 5000,  # High value if > $5k/year
                int(roi['annual_savings'] / 1000),  # Priority based on savings
            ))
            enhanced_count += 1
            
            if enhanced_count % 100 == 0:
                conn.commit()
                print(f"  Generated {enhanced_count} enhanced tasks...")
                
        except Exception as e:
            print(f"  Error with task {task_code}: {e}")
            continue
    
    conn.commit()
    print(f"Done! Generated {enhanced_count} enhanced tasks")
    
    # Add proof points for sample tasks
    print("Adding proof points...")
    cur.execute("SELECT id, category_id FROM enhanced_tasks LIMIT 50")
    sample_tasks = cur.fetchall()
    
    for task_id, cat_id in sample_tasks:
        cur.execute("SELECT category_code FROM task_categories WHERE id = %s", (cat_id,))
        cat_row = cur.fetchone()
        if cat_row:
            category = cat_row[0]
            proofs = get_proof_points(category)
            
            for proof in proofs[:2]:  # Add 2 proof points per task
                try:
                    cur.execute("""
                        INSERT INTO task_proof_points (
                            enhanced_task_id, proof_type, tool_name, tool_url, 
                            tool_pricing, tool_setup_time, title, description,
                            credibility_score
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        task_id, 'tool', proof['tool'], proof['url'],
                        proof['pricing'], proof['setup'],
                        f"{proof['tool']} - Automates this task",
                        f"This tool can help automate {proof['tool']} tasks with {proof['setup']} setup time",
                        4
                    ))
                except:
                    pass
    
    conn.commit()
    print("Done!")
    conn.close()

if __name__ == "__main__":
    generate_enhanced_tasks()
