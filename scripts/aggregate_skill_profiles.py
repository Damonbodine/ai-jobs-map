"""
Skill Aggregation - Calculates occupation-level skill profiles from decomposed tasks
Runs after task decomposition to create summary profiles
"""
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')

def get_db():
    return psycopg2.connect(DATABASE_URL)

def aggregate_occupation_profiles():
    """Build skill profiles for each occupation from their tasks"""
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("=" * 60)
    print("Occupation Skill Profile Aggregation")
    print("=" * 60)
    
    # Get all occupations with decomposed tasks
    cur.execute("""
        SELECT DISTINCT ot.occupation_id
        FROM task_skill_mapping tsm
        JOIN onet_tasks ot ON tsm.onet_task_id = ot.id
    """)
    occupation_ids = [row['occupation_id'] for row in cur.fetchall()]
    print(f"\nAggregating profiles for {len(occupation_ids)} occupations...")
    
    processed = 0
    for occ_id in occupation_ids:
        # Get all skills for this occupation's tasks
        cur.execute("""
            SELECT 
                ms.id,
                ms.skill_name,
                ms.skill_category,
                ms.skill_type,
                ms.base_automation_potential,
                tsm.importance,
                tsm.complexity,
                tsm.ai_automation_potential,
                tsm.is_differentiator,
                COUNT(DISTINCT tsm.onet_task_id) as used_in_tasks
            FROM task_skill_mapping tsm
            JOIN micro_skills ms ON tsm.micro_skill_id = ms.id
            JOIN onet_tasks ot ON tsm.onet_task_id = ot.id
            WHERE ot.occupation_id = %s
            GROUP BY ms.id, ms.skill_name, ms.skill_category, ms.skill_type, 
                     ms.base_automation_potential, tsm.importance, tsm.complexity,
                     tsm.ai_automation_potential, tsm.is_differentiator
        """, (occ_id,))
        
        skills = cur.fetchall()
        if not skills:
            continue
        
        # Calculate aggregates
        total_skills = len(skills)
        avg_automation = sum(float(s['ai_automation_potential']) for s in skills) / total_skills
        
        hard_skills = [s for s in skills if s['skill_type'] == 'hard_skill']
        soft_skills = [s for s in skills if s['skill_type'] == 'soft_skill']
        tools = [s for s in skills if s['skill_type'] == 'tool']
        
        # Differentiator skills (humans win)
        differentiators = [
            {'name': s['skill_name'], 'potential': float(s['ai_automation_potential']), 'importance': s['importance']}
            for s in skills if s['is_differentiator'] or float(s['ai_automation_potential']) < 30
        ]
        differentiators.sort(key=lambda x: x['importance'], reverse=True)
        
        # High automation skills (AI wins)
        high_automation = [
            {'name': s['skill_name'], 'potential': float(s['ai_automation_potential']), 'importance': s['importance']}
            for s in skills if float(s['ai_automation_potential']) >= 70
        ]
        high_automation.sort(key=lambda x: x['potential'], reverse=True)
        
        # Skill breakdown by category
        breakdown = {}
        for s in skills:
            cat = s['skill_category']
            if cat not in breakdown:
                breakdown[cat] = {'count': 0, 'avg_automation': 0, 'skills': []}
            breakdown[cat]['count'] += 1
            breakdown[cat]['avg_automation'] += float(s['ai_automation_potential'])
            breakdown[cat]['skills'].append(s['skill_name'])
        
        for cat in breakdown:
            breakdown[cat]['avg_automation'] = round(breakdown[cat]['avg_automation'] / breakdown[cat]['count'], 1)
        
        # Upsert profile
        cur.execute("""
            INSERT INTO occupation_skill_profile
            (occupation_id, total_micro_skills, avg_automation_potential, 
             hard_skills_count, soft_skills_count, tools_count,
             differentiator_skills, high_automation_skills, skill_breakdown, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (occupation_id) DO UPDATE SET
                total_micro_skills = EXCLUDED.total_micro_skills,
                avg_automation_potential = EXCLUDED.avg_automation_potential,
                hard_skills_count = EXCLUDED.hard_skills_count,
                soft_skills_count = EXCLUDED.soft_skills_count,
                tools_count = EXCLUDED.tools_count,
                differentiator_skills = EXCLUDED.differentiator_skills,
                high_automation_skills = EXCLUDED.high_automation_skills,
                skill_breakdown = EXCLUDED.skill_breakdown,
                updated_at = NOW()
        """, (
            occ_id,
            total_skills,
            round(avg_automation, 2),
            len(hard_skills),
            len(soft_skills),
            len(tools),
            json.dumps(differentiators[:10]),
            json.dumps(high_automation[:10]),
            json.dumps(breakdown),
        ))
        
        processed += 1
        if processed % 50 == 0:
            print(f"  Processed {processed}/{len(occupation_ids)}...")
            conn.commit()
    
    conn.commit()
    
    # Print stats
    cur.execute("SELECT COUNT(*) FROM occupation_skill_profile")
    profiles = cur.fetchone()['count']
    cur.execute("SELECT COUNT(*) FROM micro_skills")
    skills = cur.fetchone()['count']
    cur.execute("SELECT COUNT(*) FROM task_skill_mapping")
    mappings = cur.fetchone()['count']
    cur.execute("SELECT ROUND(AVG(avg_automation_potential)::numeric, 1) as avg FROM occupation_skill_profile")
    avg_auto = cur.fetchone()['avg']
    
    print(f"\n{'=' * 60}")
    print("AGGREGATION COMPLETE")
    print(f"Occupation profiles: {profiles}")
    print(f"Unique micro-skills: {skills}")
    print(f"Task-skill mappings: {mappings}")
    print(f"Average automation potential: {avg_auto}%")
    print(f"{'=' * 60}")
    
    # Top 10 most automatable occupations
    cur.execute("""
        SELECT o.title, osp.avg_automation_potential, osp.total_micro_skills
        FROM occupation_skill_profile osp
        JOIN occupations o ON osp.occupation_id = o.id
        ORDER BY osp.avg_automation_potential DESC
        LIMIT 10
    """)
    print(f"\n📊 Most Automatable (by skill analysis):")
    for row in cur.fetchall():
        print(f"  {row['title']}: {row['avg_automation_potential']}% ({row['total_micro_skills']} skills)")
    
    # Top 10 least automatable (human advantage)
    cur.execute("""
        SELECT o.title, osp.avg_automation_potential, osp.total_micro_skills,
               jsonb_array_length(osp.differentiator_skills) as diff_skills
        FROM occupation_skill_profile osp
        JOIN occupations o ON osp.occupation_id = o.id
        WHERE jsonb_array_length(osp.differentiator_skills) > 0
        ORDER BY osp.avg_automation_potential ASC
        LIMIT 10
    """)
    print(f"\n👤 Most Human-Advantage (low automation, many differentiators):")
    for row in cur.fetchall():
        print(f"  {row['title']}: {row['avg_automation_potential']}% auto | {row['diff_skills']} differentiator skills")
    
    cur.close()

if __name__ == "__main__":
    aggregate_occupation_profiles()
