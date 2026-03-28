"""
Task-to-Action Mapper
Links O*NET tasks to automation actions for intelligent package recommendations
Uses keyword matching and pattern detection
"""
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')

# Keyword patterns for each action category
ACTION_PATTERNS = {
    'ACT-DATA-001': {  # Data Entry
        'patterns': ['enter', 'input', 'record', 'log', 'type', 'capture', 'transcribe'],
        'weight': 1.0
    },
    'ACT-DATA-002': {  # Record Keeping
        'patterns': ['maintain', 'keep', 'file', 'organize', 'archive', 'store', 'document'],
        'weight': 1.0
    },
    'ACT-DATA-003': {  # Data Validation
        'patterns': ['verify', 'validate', 'check', 'review', 'audit', 'confirm', 'ensure'],
        'weight': 1.0
    },
    'ACT-DATA-004': {  # Data Classification
        'patterns': ['categorize', 'classify', 'sort', 'group', 'organize', 'index', 'tag'],
        'weight': 1.0
    },
    'ACT-COMM-001': {  # Email
        'patterns': ['email', 'correspond', 'write', 'communicate', 'message', 'reply', 'respond'],
        'weight': 1.0
    },
    'ACT-COMM-002': {  # Report Generation
        'patterns': ['report', 'summary', 'document', 'present', 'analyze', 'compile'],
        'weight': 1.0
    },
    'ACT-COMM-003': {  # Scheduling
        'patterns': ['schedule', 'arrange', 'coordinate', 'plan', 'calendar', 'meeting', 'appointment'],
        'weight': 1.0
    },
    'ACT-COMM-004': {  # Message Routing
        'patterns': ['route', 'direct', 'forward', 'escalate', 'transfer', 'distribute'],
        'weight': 1.0
    },
    'ACT-ANLY-001': {  # Document Analysis
        'patterns': ['analyze', 'review', 'summarize', 'extract', 'interpret', 'evaluate', 'assess'],
        'weight': 1.0
    },
    'ACT-ANLY-002': {  # Data Analysis
        'patterns': ['analyze', 'data', 'trend', 'pattern', 'statistic', 'metric', 'performance'],
        'weight': 1.0
    },
    'ACT-ANLY-003': {  # Market Research
        'patterns': ['research', 'market', 'competitor', 'industry', 'benchmark', 'survey'],
        'weight': 1.0
    },
    'ACT-ANLY-004': {  # Sentiment Analysis
        'patterns': ['sentiment', 'opinion', 'feedback', 'review', 'satisfaction', 'perception'],
        'weight': 1.0
    },
    'ACT-SCHED-001': {  # Appointment Scheduling
        'patterns': ['appointment', 'schedule', 'book', 'reschedule', 'calendar', 'meeting'],
        'weight': 1.0
    },
    'ACT-SCHED-002': {  # Resource Allocation
        'patterns': ['allocate', 'assign', 'distribute', 'resource', 'staff', 'deploy'],
        'weight': 1.0
    },
    'ACT-SCHED-003': {  # Deadline Tracking
        'patterns': ['deadline', 'due', 'remind', 'follow-up', 'overdue', 'track', 'monitor'],
        'weight': 1.0
    },
    'ACT-DOC-001': {  # Document Generation
        'patterns': ['generate', 'create', 'draft', 'prepare', 'write', 'produce', 'compose'],
        'weight': 1.0
    },
    'ACT-DOC-002': {  # Invoice Processing
        'patterns': ['invoice', 'bill', 'receipt', 'payment', 'charge', 'expense'],
        'weight': 1.0
    },
    'ACT-DOC-003': {  # Document Review
        'patterns': ['review', 'compliance', 'regulation', 'policy', 'standard', 'requirement'],
        'weight': 1.0
    },
    'ACT-DOC-004': {  # Form Processing
        'patterns': ['form', 'application', 'submission', 'request', 'claim', 'petition'],
        'weight': 1.0
    },
    'ACT-CS-001': {  # Customer Inquiry
        'patterns': ['customer', 'client', 'inquiry', 'question', 'support', 'help', 'assist'],
        'weight': 1.0
    },
    'ACT-CS-002': {  # Ticket Routing
        'patterns': ['ticket', 'issue', 'incident', 'request', 'case', 'problem'],
        'weight': 1.0
    },
    'ACT-CS-003': {  # Follow-up
        'patterns': ['follow-up', 'follow up', 'satisfaction', 'feedback', 'survey'],
        'weight': 1.0
    },
    'ACT-SALES-001': {  # Lead Qualification
        'patterns': ['lead', 'prospect', 'qualify', 'score', 'pipeline', 'opportunity'],
        'weight': 1.0
    },
    'ACT-SALES-002': {  # Outreach
        'patterns': ['outreach', 'cold', 'contact', 'engage', 'connect', 'network'],
        'weight': 1.0
    },
    'ACT-SALES-003': {  # Proposal Generation
        'patterns': ['proposal', 'quote', 'estimate', 'bid', 'offer', 'presentation'],
        'weight': 1.0
    },
    'ACT-SALES-004': {  # Social Media
        'patterns': ['social', 'post', 'content', 'campaign', 'marketing', 'promote'],
        'weight': 1.0
    },
    'ACT-FIN-001': {  # Expense Categorization
        'patterns': ['expense', 'cost', 'budget', 'categorize', 'allocate', 'track'],
        'weight': 1.0
    },
    'ACT-FIN-002': {  # Invoice Matching
        'patterns': ['match', 'reconcile', 'pair', 'link', 'connect', 'associate'],
        'weight': 1.0
    },
    'ACT-FIN-003': {  # Budget Tracking
        'patterns': ['budget', 'spend', 'expenditure', 'cost', 'variance', 'forecast'],
        'weight': 1.0
    },
    'ACT-HR-001': {  # Resume Screening
        'patterns': ['resume', 'candidate', 'applicant', 'hire', 'recruit', 'screen'],
        'weight': 1.0
    },
    'ACT-HR-002': {  # Onboarding
        'patterns': ['onboard', 'orientation', 'new hire', 'setup', 'welcome', 'integrate'],
        'weight': 1.0
    },
    'ACT-HR-003': {  # Performance Data
        'patterns': ['performance', 'review', 'evaluation', 'metric', 'kpi', 'goal'],
        'weight': 1.0
    },
    'ACT-PM-001': {  # Task Creation
        'patterns': ['task', 'assign', 'delegate', 'workload', 'capacity', 'resource'],
        'weight': 1.0
    },
    'ACT-PM-002': {  # Status Reporting
        'patterns': ['status', 'progress', 'milestone', 'update', 'dashboard', 'report'],
        'weight': 1.0
    },
    'ACT-PM-003': {  # Risk Identification
        'patterns': ['risk', 'issue', 'problem', 'concern', 'threat', 'mitigate'],
        'weight': 1.0
    },
    'ACT-QC-001': {  # Quality Check
        'patterns': ['quality', 'inspect', 'test', 'examine', 'assess', 'evaluate'],
        'weight': 1.0
    },
    'ACT-QC-002': {  # Compliance Monitoring
        'patterns': ['compliance', 'regulation', 'legal', 'policy', 'standard', 'requirement'],
        'weight': 1.0
    },
    'ACT-QC-003': {  # Audit Trail
        'patterns': ['audit', 'trail', 'log', 'history', 'record', 'trace'],
        'weight': 1.0
    },
}

def get_db():
    return psycopg2.connect(DATABASE_URL)

def match_task_to_actions(task_description: str) -> list[dict]:
    """Match a task description to automation actions"""
    task_lower = task_description.lower()
    matches = []
    
    for action_code, config in ACTION_PATTERNS.items():
        score = 0
        matched_patterns = []
        
        for pattern in config['patterns']:
            if pattern in task_lower:
                score += 1
                matched_patterns.append(pattern)
        
        if score > 0:
            confidence = min(0.95, (score / len(config['patterns'])) * config['weight'])
            matches.append({
                'action_code': action_code,
                'confidence': round(confidence, 2),
                'matched_patterns': matched_patterns,
            })
    
    # Sort by confidence
    matches.sort(key=lambda x: x['confidence'], reverse=True)
    return matches[:3]  # Top 3 matches

def map_tasks_to_actions():
    """Map all O*NET tasks to automation actions"""
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("=" * 60)
    print("Task-to-Action Mapping")
    print("=" * 60)
    
    # Get all O*NET tasks
    cur.execute("""
        SELECT id, task_description, occupation_id 
        FROM onet_tasks 
        WHERE ai_automatable = true
        ORDER BY id
    """)
    tasks = cur.fetchall()
    print(f"\nMapping {len(tasks)} AI-automatable tasks...")
    
    # Get action IDs
    cur.execute("SELECT id, action_code FROM automation_actions")
    action_map = {row['action_code']: row['id'] for row in cur.fetchall()}
    
    mapped_count = 0
    skipped_count = 0
    
    for task in tasks:
        matches = match_task_to_actions(task['task_description'])
        
        for match in matches:
            action_id = action_map.get(match['action_code'])
            if action_id:
                try:
                    cur.execute("""
                        INSERT INTO task_to_action_mapping (onet_task_id, action_id, confidence_score)
                        VALUES (%s, %s, %s)
                        ON CONFLICT DO NOTHING
                    """, (task['id'], action_id, match['confidence']))
                    mapped_count += 1
                except:
                    skipped_count += 1
    
    # Calculate action coverage stats
    cur.execute("""
        SELECT 
            aa.action_code,
            aa.action_name,
            COUNT(ttm.id) as task_count,
            COUNT(DISTINCT ot.occupation_id) as occupation_count
        FROM automation_actions aa
        LEFT JOIN task_to_action_mapping ttm ON aa.id = ttm.action_id
        LEFT JOIN onet_tasks ot ON ttm.onet_task_id = ot.id
        GROUP BY aa.id, aa.action_code, aa.action_name
        ORDER BY task_count DESC
    """)
    coverage = cur.fetchall()
    
    print(f"\n✅ Mapping Complete!")
    print(f"   Mapped: {mapped_count}")
    print(f"   Skipped: {skipped_count}")
    
    print(f"\n📊 Action Coverage:")
    for row in coverage[:15]:
        print(f"   {row['action_code']}: {row['task_count']} tasks across {row['occupation_count']} occupations")
    
    # Get occupation coverage
    cur.execute("""
        SELECT COUNT(DISTINCT occupation_id) as occ_count
        FROM task_to_action_mapping ttm
        JOIN onet_tasks ot ON ttm.onet_task_id = ot.id
    """)
    occ_coverage = cur.fetchone()
    print(f"\n   Total occupations with mapped actions: {occ_coverage['occ_count']}")
    
    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    map_tasks_to_actions()
