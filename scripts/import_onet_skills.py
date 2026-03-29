#!/usr/bin/env python3
"""
Import O*NET official skills data directly
No AI needed - this is authoritative data from USDOL
"""

import os
import sys
import psycopg2
import openpyxl

# Load environment
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

def get_db():
    return psycopg2.connect(DATABASE_URL)

def import_skills():
    """Import O*NET Skills data (Importance scale only)"""
    print("Importing O*NET Skills data...")
    
    conn = get_db()
    cur = conn.cursor()
    
    wb = openpyxl.load_workbook('data/onet/Skills.xlsx', read_only=True)
    ws = wb.active
    
    skills_imported = 0
    mappings_imported = 0
    skipped = 0
    
    # Get all occupations for lookup
    cur.execute("SELECT id, LOWER(title) FROM occupations")
    occ_lookup = {row[1]: row[0] for row in cur.fetchall()}
    
    for row in ws.iter_rows(min_row=2, values_only=True):
        onet_code = row[0]   # O*NET-SOC Code
        title = row[1]       # Title
        element_id = row[2]  # Element ID (e.g., "2.A.1.a")
        element_name = row[3]  # Element Name (e.g., "Reading Comprehension")
        scale_id = row[4]    # Scale ID ("IM" or "LV")
        data_value = row[6]  # Data Value (importance/level score)
        
        if not onet_code or not element_id:
            continue
        
        # Only process Importance scores
        if scale_id != 'IM':
            continue
        
        # Find occupation
        title_lower = title.lower()
        occupation_id = occ_lookup.get(title_lower)
        
        if not occupation_id:
            # Try partial match
            for occ_title, occ_id in occ_lookup.items():
                if occ_title[:20] == title_lower[:20]:
                    occupation_id = occ_id
                    break
        
        if not occupation_id:
            skipped += 1
            continue
        
        # Create skill code from element_id
        skill_category = get_category_from_element(element_id)
        skill_code = f"SK-{skill_category}-{element_id.replace('.', '-')}"
        
        # Get or create skill
        cur.execute("SELECT id FROM micro_skills WHERE skill_code = %s", (skill_code,))
        skill_row = cur.fetchone()
        
        if skill_row:
            skill_id = skill_row[0]
        else:
            cur.execute("""
                INSERT INTO micro_skills (skill_code, skill_name, category, skill_description, importance_level, difficulty_level, ai_assistance_level)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (skill_code) DO UPDATE SET skill_name = EXCLUDED.skill_name
                RETURNING id
            """, (
                skill_code,
                element_name,
                skill_category,
                f"O*NET element {element_id}",
                3,
                "intermediate",
                2
            ))
            cur.execute("SELECT id FROM micro_skills WHERE skill_code = %s", (skill_code,))
            skill_row = cur.fetchone()
            skill_id = skill_row[0] if skill_row else None
            skills_imported += 1
        
        if skill_id and occupation_id:
            importance = float(data_value) if data_value else 3
            ai_score = calculate_ai_score(importance, element_name)
            
            cur.execute("""
                INSERT INTO task_skill_mapping 
                (onet_task_id, micro_skill_id, skill_proficiency_level, is_core_skill, is_differentiator_skill, ai_dependence_score)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                occupation_id,
                skill_id,
                round(importance),
                importance >= 3.5,
                importance < 3,
                ai_score
            ))
            mappings_imported += 1
        
        if mappings_imported % 500 == 0:
            conn.commit()
            print(f"  Processed {mappings_imported} mappings...")
    
    conn.commit()
    wb.close()
    
    print(f"Done! Imported {skills_imported} new skills, {mappings_imported} mappings, {skipped} skipped")
    conn.close()

def get_category_from_element(element_id: str) -> str:
    prefixes = {
        '2.A.1': 'COMM',  # Content Knowledge
        '2.A.2': 'TECH',
        '2.B.1': 'COMM',
        '2.B.2': 'TECH',
        '2.B.3': 'ANAL',
        '2.B.4': 'MGMT',
        '2.B.5': 'OPS',
        '2.B.6': 'ANAL',
        '2.B.7': 'SOFT',
        '2.C.1': 'ANAL',
        '2.C.2': 'SOFT',
        '2.C.3': 'SOFT',
        '2.C.4': 'COMM',
    }
    for prefix, cat in prefixes.items():
        if element_id.startswith(prefix):
            return cat
    return 'INFO'

def calculate_ai_score(importance: float, name: str) -> float:
    name_lower = name.lower()
    if any(w in name_lower for w in ['computing', 'programming', 'mathematics', 'data', 'system', 'processing']):
        return 0.8
    if any(w in name_lower for w in ['writing', 'reading', 'speaking', 'coordination', 'management']):
        return 0.5
    if any(w in name_lower for w in ['listening', 'helping', 'persuading', 'inspiring', 'empathy', 'emotional']):
        return 0.2
    return 0.5

if __name__ == "__main__":
    import_skills()
