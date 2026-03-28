"""
Calculate job coverage for each occupation based on task-to-action mappings
Maps: Occupation → Tasks → Actions → Workflows → Packages
Shows: "We can automate X% of your job"
"""
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')

def get_db():
    return psycopg2.connect(DATABASE_URL)

# Skill keywords that map to automation actions
SKILL_TO_ACTION_MAP = {
    # Data skills
    'data entry': ['ACT-DATA-001'],
    'record keeping': ['ACT-DATA-002'],
    'data validation': ['ACT-DATA-003'],
    'data analysis': ['ACT-ANLY-002', 'ACT-ANLY-001'],
    'data visualization': ['ACT-COMM-002', 'ACT-ANLY-002'],
    'spreadsheets': ['ACT-DATA-001', 'ACT-DATA-002', 'ACT-FIN-001'],
    'database': ['ACT-DATA-001', 'ACT-DATA-002', 'ACT-DATA-004'],
    
    # Communication skills
    'email': ['ACT-COMM-001', 'ACT-COMM-004'],
    'writing': ['ACT-COMM-001', 'ACT-DOC-001'],
    'communication': ['ACT-COMM-001', 'ACT-COMM-002', 'ACT-CS-001'],
    'presentation': ['ACT-COMM-002', 'ACT-SALES-003'],
    'customer service': ['ACT-CS-001', 'ACT-CS-002', 'ACT-CS-003'],
    
    # Analysis skills
    'research': ['ACT-ANLY-003', 'ACT-ANLY-001'],
    'critical thinking': ['ACT-ANLY-001', 'ACT-ANLY-002'],
    'problem solving': ['ACT-ANLY-001', 'ACT-PM-003'],
    'attention to detail': ['ACT-DATA-003', 'ACT-QC-001'],
    
    # Management skills
    'scheduling': ['ACT-SCHED-001', 'ACT-COMM-003'],
    'project management': ['ACT-PM-001', 'ACT-PM-002', 'ACT-PM-003'],
    'team leadership': ['ACT-HR-003', 'ACT-PM-001'],
    'coordination': ['ACT-SCHED-002', 'ACT-COMM-003'],
    
    # Technical skills
    'accounting': ['ACT-FIN-001', 'ACT-FIN-002', 'ACT-FIN-003'],
    'bookkeeping': ['ACT-FIN-001', 'ACT-FIN-002', 'ACT-DOC-002'],
    'compliance': ['ACT-QC-002', 'ACT-DOC-003'],
    'quality control': ['ACT-QC-001', 'ACT-QC-002'],
    
    # Sales skills
    'sales': ['ACT-SALES-001', 'ACT-SALES-002', 'ACT-SALES-003'],
    'lead generation': ['ACT-SALES-001', 'ACT-SALES-002'],
    'marketing': ['ACT-SALES-004', 'ACT-ANLY-003'],
    'social media': ['ACT-SALES-004'],
    
    # HR skills
    'recruiting': ['ACT-HR-001', 'ACT-HR-002'],
    'hiring': ['ACT-HR-001', 'ACT-HR-002'],
    'onboarding': ['ACT-HR-002'],
    'performance management': ['ACT-HR-003'],
    
    # AI skills
    'prompt engineering': ['ACT-ANLY-001', 'ACT-DOC-001', 'ACT-COMM-001'],
    'natural language processing': ['ACT-ANLY-001', 'ACT-CS-001', 'ACT-COMM-001'],
    'machine learning': ['ACT-ANLY-002', 'ACT-QC-001'],
    'automation': ['ACT-DATA-001', 'ACT-SCHED-003', 'ACT-COMM-004'],
}

def map_skills_to_actions():
    """Populate skill-to-action mapping"""
    conn = get_db()
    cur = conn.cursor()
    
    print("Mapping skills to actions...")
    mapped = 0
    
    for skill_keyword, action_codes in SKILL_TO_ACTION_MAP.items():
        for action_code in action_codes:
            cur.execute("""
                INSERT INTO skill_to_action_mapping (skill_name, action_id, relevance_score)
                SELECT %s, aa.id, 0.8
                FROM automation_actions aa
                WHERE aa.action_code = %s
                ON CONFLICT DO NOTHING
            """, (skill_keyword, action_code))
            mapped += cur.rowcount
    
    conn.commit()
    print(f"  ✓ Mapped {mapped} skill-action pairs")
    cur.close()
    return mapped

def calculate_occupation_coverage(occupation_id=None):
    """Calculate coverage for an occupation or all occupations"""
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Build occupation list
    if occupation_id:
        cur.execute("SELECT id, title FROM occupations WHERE id = %s", (occupation_id,))
    else:
        cur.execute("SELECT id, title FROM occupations ORDER BY id")
    
    occupations = cur.fetchall()
    print(f"\nCalculating coverage for {len(occupations)} occupations...")
    
    processed = 0
    for occ in occupations:
        # Get task stats
        cur.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE ai_automatable = true) as automatable
            FROM onet_tasks
            WHERE occupation_id = %s
        """, (occ['id'],))
        task_stats = cur.fetchone()
        
        total_tasks = task_stats['total'] or 0
        automatable_tasks = task_stats['automatable'] or 0
        
        if automatable_tasks == 0:
            continue
        
        # Get actions coverage (tasks that have action mappings)
        cur.execute("""
            SELECT COUNT(DISTINCT ot.id) as covered
            FROM onet_tasks ot
            JOIN task_to_action_mapping ttm ON ot.id = ttm.onet_task_id
            WHERE ot.occupation_id = %s AND ot.ai_automatable = true
        """, (occ['id'],))
        covered = cur.fetchone()['covered'] or 0
        
        coverage_pct = (covered / automatable_tasks * 100) if automatable_tasks > 0 else 0
        
        # Get top actions for this occupation
        cur.execute("""
            SELECT 
                aa.action_code,
                aa.action_name,
                aa.category,
                COUNT(ttm.id) as task_count
            FROM automation_actions aa
            JOIN task_to_action_mapping ttm ON aa.id = ttm.action_id
            JOIN onet_tasks ot ON ttm.onet_task_id = ot.id
            WHERE ot.occupation_id = %s AND ot.ai_automatable = true
            GROUP BY aa.id, aa.action_code, aa.action_name, aa.category
            ORDER BY task_count DESC
            LIMIT 5
        """, (occ['id'],))
        top_actions = cur.fetchall()
        
        # Get matching workflows
        action_codes = [a['action_code'] for a in top_actions]
        cur.execute("""
            SELECT DISTINCT
                aw.id,
                aw.workflow_code,
                aw.workflow_name,
                aw.base_price,
                aw.estimated_time_saved_per_day
            FROM automation_workflows aw
            WHERE aw.id IN (
                SELECT DISTINCT ttm.action_id
                FROM task_to_action_mapping ttm
                JOIN automation_actions aa ON ttm.action_id = aa.id
                JOIN onet_tasks ot ON ttm.onet_task_id = ot.id
                WHERE ot.occupation_id = %s AND aa.action_code = ANY(%s)
            )
            ORDER BY aw.base_price ASC
            LIMIT 5
        """, (occ['id'], action_codes))
        top_workflows = cur.fetchall()
        
        # Get recommended packages
        workflow_ids = [w['id'] for w in top_workflows]
        cur.execute("""
            SELECT DISTINCT
                ap.id,
                ap.package_code,
                ap.package_name,
                ap.tier,
                ap.base_price,
                ap.monthly_price,
                ap.roi_multiplier,
                COUNT(DISTINCT aw.id) as matching_workflows
            FROM automation_packages ap
            CROSS JOIN LATERAL unnest(ap.workflow_ids) as wid
            JOIN automation_workflows aw ON aw.id = wid
            WHERE aw.id = ANY(%s)
            GROUP BY ap.id
            ORDER BY matching_workflows DESC, ap.base_price ASC
            LIMIT 3
        """, (workflow_ids,))
        recommended_packages = cur.fetchall()
        
        # Calculate estimated time saved (based on workflow time savings)
        total_time_saved = sum(float(w['estimated_time_saved_per_day'] or 0) for w in top_workflows)
        estimated_hours_saved = min(total_time_saved, 4.0)  # Cap at 4 hours/day
        
        # Helper function to convert Decimal
        def decimal_default(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
        
        from decimal import Decimal
        
        # Upsert coverage record
        cur.execute("""
            INSERT INTO occupation_coverage 
            (occupation_id, total_tasks, automatable_tasks, covered_tasks, coverage_percent,
             top_actions, top_workflows, recommended_packages, estimated_daily_hours_saved, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (occupation_id) DO UPDATE SET
                total_tasks = EXCLUDED.total_tasks,
                automatable_tasks = EXCLUDED.automatable_tasks,
                covered_tasks = EXCLUDED.covered_tasks,
                coverage_percent = EXCLUDED.coverage_percent,
                top_actions = EXCLUDED.top_actions,
                top_workflows = EXCLUDED.top_workflows,
                recommended_packages = EXCLUDED.recommended_packages,
                estimated_daily_hours_saved = EXCLUDED.estimated_daily_hours_saved,
                updated_at = NOW()
        """, (
            occ['id'],
            total_tasks,
            automatable_tasks,
            covered,
            round(coverage_pct, 2),
            json.dumps([dict(a) for a in top_actions], default=str),
            json.dumps([dict(w) for w in top_workflows], default=str),
            json.dumps([dict(p) for p in recommended_packages], default=str),
            estimated_hours_saved
        ))
        
        processed += 1
        if processed % 50 == 0:
            print(f"  Processed {processed}/{len(occupations)}...")
            conn.commit()
    
    conn.commit()
    print(f"  ✓ Processed {processed} occupations with automatable tasks")
    cur.close()
    return processed

def print_coverage_stats():
    """Print coverage statistics"""
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Overall stats
    cur.execute("""
        SELECT 
            COUNT(*) as total_occupations,
            ROUND(AVG(coverage_percent)::numeric, 1) as avg_coverage,
            ROUND(AVG(estimated_daily_hours_saved)::numeric, 2) as avg_hours_saved,
            SUM(covered_tasks) as total_covered_tasks
        FROM occupation_coverage
    """)
    stats = cur.fetchone()
    
    print("\n" + "=" * 60)
    print("COVERAGE STATISTICS")
    print("=" * 60)
    print(f"Occupations with coverage data: {stats['total_occupations']}")
    print(f"Average coverage: {stats['avg_coverage']}%")
    print(f"Average daily time saved: {stats['avg_hours_saved']} hours")
    print(f"Total tasks covered: {stats['total_covered_tasks']}")
    
    # Top coverage occupations
    cur.execute("""
        SELECT 
            o.title,
            oc.coverage_percent,
            oc.estimated_daily_hours_saved,
            oc.automatable_tasks,
            oc.covered_tasks
        FROM occupation_coverage oc
        JOIN occupations o ON oc.occupation_id = o.id
        ORDER BY oc.coverage_percent DESC
        LIMIT 10
    """)
    top = cur.fetchall()
    
    print(f"\n📊 Top 10 Most Automatable Occupations:")
    for row in top:
        print(f"  {row['title']}: {row['coverage_percent']}% coverage, {row['estimated_daily_hours_saved']}h/day saved")
    
    # Coverage distribution
    cur.execute("""
        SELECT 
            CASE 
                WHEN coverage_percent >= 80 THEN '80-100%'
                WHEN coverage_percent >= 60 THEN '60-79%'
                WHEN coverage_percent >= 40 THEN '40-59%'
                WHEN coverage_percent >= 20 THEN '20-39%'
                ELSE '0-19%'
            END as range,
            COUNT(*) as count
        FROM occupation_coverage
        GROUP BY 1
        ORDER BY MIN(coverage_percent) DESC
    """)
    dist = cur.fetchall()
    
    print(f"\n📈 Coverage Distribution:")
    for row in dist:
        bar = '█' * (row['count'] // 5)
        print(f"  {row['range']}: {row['count']} {bar}")
    
    cur.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Job Coverage Calculator")
    print("=" * 60)
    
    map_skills_to_actions()
    calculate_occupation_coverage()
    print_coverage_stats()
