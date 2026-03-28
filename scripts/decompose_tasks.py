#!/usr/bin/env python3
"""
Task-to-Skill Decomposition Engine
==================================
Breaks each O*NET task into 8-15 micro-skills with:
- Skill proficiency level (1-5)
- Is this a core skill for the task?
- Is this a "differentiator" skill (where humans still beat AI)?
- AI dependence score (0-1)

Uses OpenRouter API with free models.
"""

import os
import sys
import time
import json
import random
import psycopg2
import requests
from dotenv import load_dotenv

# Load environment
DATABASE_URL = os.getenv('DATABASE_URL') or os.environ.get('DATABASE_URL')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY') or os.environ.get('OPENROUTER_API_KEY')

# Fallback: read from .env.local manually
if not OPENROUTER_API_KEY:
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                if line.startswith('OPENROUTER_API_KEY='):
                    OPENROUTER_API_KEY = line.split('=', 1)[1].strip()
                    break
    except:
        pass

if not DATABASE_URL:
    try:
        with open('.env.local', 'r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    DATABASE_URL = line.split('=', 1)[1].strip()
                    break
    except:
        pass

# Free model that works
MODEL = "liquid/lfm-2.5-1.2b-instruct:free"

# Retry settings
MAX_RETRIES = 3
RETRY_DELAY = 5

def get_db():
    return psycopg2.connect(DATABASE_URL)

def call_llm(prompt: str) -> dict:
    """Call OpenRouter API with retry logic"""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Damonbodine/ai-jobs-map",
    }
    
    for retry in range(MAX_RETRIES):
        try:
            response = requests.post(
                url,
                headers=headers,
                json={
                    "model": MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 1500,
                },
                timeout=60,
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                return {"success": True, "content": content}
            elif response.status_code == 429:
                wait_time = RETRY_DELAY * (retry + 1) + random.randint(1, 5)
                print(f"    Rate limited, retrying in {wait_time}s...")
                time.sleep(wait_time)
            elif response.status_code == 404:
                # Try fallback model
                print(f"    Model not found, trying fallback...")
                headers["model"] = "openai/gpt-4o-mini:free"
            else:
                print(f"    API error: {response.status_code}")
                time.sleep(RETRY_DELAY)
                
        except requests.exceptions.Timeout:
            print(f"    Timeout, retry {retry + 1}/{MAX_RETRIES}")
            time.sleep(RETRY_DELAY)
        except Exception as e:
            print(f"    Error: {str(e)[:50]}")
            time.sleep(RETRY_DELAY)
    
    return {"success": False, "error": "Failed after retries"}

def decompose_task(task_title: str, task_description: str) -> list:
    """Use AI to decompose a task into micro-skills"""
    
    prompt = f"""You are an expert career analyst. Break down the following work task into 8-15 specific micro-skills that a worker needs to perform this task.

TASK: {task_title}
DESCRIPTION: {task_description}

For each micro-skill, provide:
1. skill_code - Use this format: SK-[CATEGORY]-[NUMBER] where CATEGORY is one of: ANAL, COMM, TECH, MGMT, FINA, HR, SALE, OPS, INFO, SOFT, MED, LEGAL, EDU, MFG, LERN, MATH
2. skill_name - Specific name of the skill
3. proficiency_level - 1-5 (1=beginner, 5=expert) - How skilled must someone be for THIS task?
4. is_core_skill - true/false - Is this essential/required for this task?
5. is_differentiator - true/false - Is this where experienced humans still beat AI/automation?
6. ai_dependence - 0.0-1.0 - How much can AI substitute for this skill? (0=human only, 1=fully automated)

Return as JSON array. Example:
[
  {{"skill_code": "SK-COMM-001", "skill_name": "Active Listening", "proficiency_level": 4, "is_core_skill": true, "is_differentiator": false, "ai_dependence": 0.2}},
  {{"skill_code": "SK-ANAL-001", "skill_name": "Critical Thinking", "proficiency_level": 5, "is_core_skill": true, "is_differentiator": true, "ai_dependence": 0.4}}
]

Respond ONLY with valid JSON, no explanation."""

    result = call_llm(prompt)
    
    if not result.get("success"):
        return []
    
    try:
        content = result["content"]
        # Extract JSON from response
        start = content.find("[")
        end = content.rfind("]") + 1
        if start >= 0 and end > start:
            json_str = content[start:end]
            skills = json.loads(json_str)
            return skills if isinstance(skills, list) else []
    except json.JSONDecodeError as e:
        print(f"    JSON parse error: {e}")
    except Exception as e:
        print(f"    Parse error: {e}")
    
    return []

def main():
    if len(sys.argv) >= 3:
        batch_size = int(sys.argv[1])
        offset = int(sys.argv[2])
    else:
        batch_size = 10
        offset = 0
    
    print(f"============================================================")
    print(f"Task Decomposition Engine - Granular Skill Mapping")
    print(f"============================================================")
    print(f"Batch size: {batch_size}, Offset: {offset}")
    
    conn = get_db()
    cur = conn.cursor()
    
    # Get tasks without skill mappings
    cur.execute("""
        SELECT ot.id, ot.task_title, ot.task_description, o.title as occupation_title
        FROM onet_tasks ot
        JOIN occupations o ON ot.occupation_id = o.id
        LEFT JOIN task_skill_mapping tsm ON ot.id = tsm.onet_task_id
        WHERE tsm.id IS NULL
        ORDER BY ot.id
        LIMIT %s OFFSET %s
    """, (batch_size, offset))
    
    tasks = cur.fetchall()
    
    if not tasks:
        print("No tasks to process!")
        conn.close()
        return
    
    print(f"Found {len(tasks)} tasks to decompose")
    print("")
    
    success_count = 0
    error_count = 0
    
    for idx, (task_id, task_title, task_desc, occ_title) in enumerate(tasks, 1):
        print(f"[{idx}/{len(tasks)}] {occ_title}: {task_title[:50]}...")
        
        skills = decompose_task(task_title or "", task_desc or "")
        
        if skills:
            for skill in skills:
                skill_code = skill.get("skill_code", "")
                skill_name = skill.get("skill_name", "")
                prof_level = skill.get("proficiency_level", 3)
                is_core = skill.get("is_core_skill", False)
                is_diff = skill.get("is_differentiator", False)
                ai_dep = skill.get("ai_dependence", 0.5)
                
                # Get or create skill
                cur.execute("SELECT id FROM micro_skills WHERE skill_code = %s", (skill_code,))
                skill_row = cur.fetchone()
                
                if skill_row:
                    micro_skill_id = skill_row[0]
                else:
                    # Create skill if doesn't exist
                    cat = skill_code.split("-")[1] if "-" in skill_code else "INFO"
                    cur.execute("""
                        INSERT INTO micro_skills (skill_code, skill_name, category, skill_description, importance_level, difficulty_level, ai_assistance_level)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (skill_code, skill_name, cat, f"Auto-generated from task decomposition", prof_level, "intermediate", int(ai_dep * 5)))
                    skill_row = cur.fetchone()
                    micro_skill_id = skill_row[0] if skill_row else None
                
                if micro_skill_id:
                    cur.execute("""
                        INSERT INTO task_skill_mapping 
                        (onet_task_id, micro_skill_id, skill_proficiency_level, is_core_skill, is_differentiator_skill, ai_dependence_score)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (task_id, micro_skill_id, prof_level, is_core, is_diff, ai_dep))
            
            conn.commit()
            success_count += 1
            print(f"    ✓ {len(skills)} skills mapped")
        else:
            error_count += 1
            print(f"    ✗ Failed to decompose")
        
        time.sleep(1)  # Rate limiting
    
    # Update occupation skill profiles
    print("")
    print("Updating occupation skill profiles...")
    
    cur.execute("""
        UPDATE occupation_skill_profile
        SET 
            total_unique_skills = sub.total,
            core_skills_count = sub.core,
            automatable_skills_count = sub.auto,
            human_differentiator_skills_count = sub.diff,
            avg_skill_proficiency_required = sub.avg_prof,
            updated_at = NOW()
        FROM (
            SELECT 
                o.id as occupation_id,
                COUNT(DISTINCT tsm.micro_skill_id) as total,
                COUNT(DISTINCT CASE WHEN tsm.is_core_skill THEN tsm.micro_skill_id END) as core,
                COUNT(DISTINCT CASE WHEN tsm.ai_dependence_score > 0.5 THEN tsm.micro_skill_id END) as auto,
                COUNT(DISTINCT CASE WHEN tsm.is_differentiator_skill THEN tsm.micro_skill_id END) as diff,
                AVG(tsm.skill_proficiency_level) as avg_prof
            FROM occupations o
            JOIN onet_tasks ot ON o.id = ot.occupation_id
            JOIN task_skill_mapping tsm ON ot.id = tsm.onet_task_id
            GROUP BY o.id
        ) sub
        WHERE occupation_skill_profile.occupation_id = sub.occupation_id
    """)
    conn.commit()
    
    # Create profiles for new occupations
    cur.execute("""
        INSERT INTO occupation_skill_profile (occupation_id)
        SELECT o.id
        FROM occupations o
        WHERE NOT EXISTS (SELECT 1 FROM occupation_skill_profile osp WHERE osp.occupation_id = o.id)
    """)
    conn.commit()
    
    print("")
    print("============================================================")
    print(f"DONE! Success: {success_count}, Errors: {error_count}")
    print(f"Next batch: python3 scripts/decompose_tasks.py {batch_size} {offset + batch_size}")
    print("============================================================")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
