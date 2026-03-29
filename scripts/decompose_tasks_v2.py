#!/usr/bin/env python3
"""
Fast Task-to-Skill Decomposition Engine (Self-Healing)
====================================================
Optimized for speed with:
- Multiple model round-robin to avoid rate limits
- Self-healing restart on failures
- Parallel processing with staggered delays
"""

import os
import sys
import time
import json
import random
import psycopg2
import requests
import signal
from datetime import datetime

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
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY') or env.get('OPENROUTER_API_KEY')

# Free models - rotate to avoid rate limits
MODELS = [
    "liquid/lfm-2.5-1.2b-instruct:free",
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "mistralai/mistral-nemo:free",
    "qwen/qwen-2.5-7b-instruct:free",
    "google/gemma-2-2b-it:free",
    "microsoft/phi-3-mini-128k-instruct:free",
]

model_index = 0

def get_db():
    return psycopg2.connect(DATABASE_URL)

def call_llm(prompt: str) -> dict:
    """Call OpenRouter API with model rotation"""
    global model_index
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Damonbodine/ai-jobs-map",
    }
    
    model = MODELS[model_index % len(MODELS)]
    
    for attempt in range(3):
        try:
            response = requests.post(
                url,
                headers=headers,
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                    "max_tokens": 1200,
                },
                timeout=30,
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                return {"success": True, "content": content}
            elif response.status_code == 429:
                # Rate limited - try next model
                model_index += 1
                model = MODELS[model_index % len(MODELS)]
                wait = 2 * (attempt + 1)
                time.sleep(wait)
            else:
                time.sleep(1)
                
        except:
            model_index += 1
            model = MODELS[model_index % len(MODELS)]
            time.sleep(1)
    
    return {"success": False, "error": "Failed"}

DECOMPOSE_PROMPT = """Break this work task into 8-12 micro-skills.

TASK: {title}
{desc}

Return JSON array. Each skill: {{"skill_code":"SK-CAT-NUM","skill_name":"name","proficiency_level":3,"is_core_skill":true,"is_differentiator":false,"ai_dependence":0.5}}

Categories: ANAL COMM TECH MGMT FINA HR SALE OPS INFO SOFT LEGAL EDU MATH
Codes: SK-ANAL-001 to SK-MATH-020
JSON only:"""

def decompose_task(title: str, desc: str) -> list:
    prompt = DECOMPOSE_PROMPT.format(title=title, desc=f"DESCRIPTION: {desc}" if desc else "")
    result = call_llm(prompt)
    
    if not result.get("success"):
        return []
    
    try:
        content = result["content"]
        start = content.find("[")
        end = content.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(content[start:end])
    except:
        pass
    return []

def save_skills(cur, conn, task_id, skills):
    """Save skills and mappings to database"""
    for skill in skills:
        code = skill.get("skill_code", "")
        name = skill.get("skill_name", "")
        prof = skill.get("proficiency_level", 3)
        is_core = skill.get("is_core_skill", False)
        is_diff = skill.get("is_differentiator", False)
        ai_dep = skill.get("ai_dependence", 0.5)
        
        if not code or not name:
            continue
        
        # Get or create skill
        cur.execute("SELECT id FROM micro_skills WHERE skill_code = %s", (code,))
        row = cur.fetchone()
        
        if row:
            skill_id = row[0]
        else:
            cat = code.split("-")[1] if "-" in code else "INFO"
            cur.execute("""
                INSERT INTO micro_skills (skill_code, skill_name, category, skill_description, importance_level, difficulty_level, ai_assistance_level)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (skill_code) DO UPDATE SET skill_name = %s
                RETURNING id
            """, (code, name, cat, f"Task skill", prof, "intermediate", int(ai_dep * 5), name))
            skill_id = cur.fetchone()[0] if cur.fetchone() else None
            
            # Re-fetch if needed
            if not skill_id:
                cur.execute("SELECT id FROM micro_skills WHERE skill_code = %s", (code,))
                skill_id = cur.fetchone()[0]
        
        if skill_id:
            cur.execute("""
                INSERT INTO task_skill_mapping 
                (onet_task_id, micro_skill_id, skill_proficiency_level, is_core_skill, is_differentiator_skill, ai_dependence_score)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (task_id, skill_id, prof, is_core, is_diff, ai_dep))

def run_batch(start_offset=0, batch_size=100):
    """Run one batch of task processing"""
    conn = get_db()
    cur = conn.cursor()
    
    # Get unmapped tasks
    cur.execute("""
        SELECT ot.id, ot.task_title, COALESCE(ot.task_description, ''), o.title
        FROM onet_tasks ot
        JOIN occupations o ON ot.occupation_id = o.id
        LEFT JOIN task_skill_mapping tsm ON ot.id = tsm.onet_task_id
        WHERE tsm.id IS NULL
        ORDER BY ot.id
        LIMIT %s OFFSET %s
    """, (batch_size, start_offset))
    
    tasks = cur.fetchall()
    
    if not tasks:
        print("All tasks mapped!")
        conn.close()
        return 0
    
    success = 0
    errors = 0
    
    for i, (tid, title, desc, occ) in enumerate(tasks):
        print(f"[{i+1}/{len(tasks)}] {occ[:30]}: {title[:50]}...", end="", flush=True)
        
        skills = decompose_task(title, desc)
        
        if skills:
            save_skills(cur, conn, tid, skills)
            conn.commit()
            success += 1
            print(f" ✓ {len(skills)}")
        else:
            errors += 1
            print(f" ✗")
        
        # Small delay to avoid hitting rate limits too hard
        time.sleep(0.3)
    
    conn.close()
    return success

def self_healing_loop():
    """Main loop that runs batches until all tasks are processed"""
    print("=" * 60)
    print("SELF-HEALING TASK DECOMPOSITION")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Models: {len(MODELS)} free models rotating")
    print("=" * 60)
    
    total_mapped = 0
    batch_num = 1
    
    while True:
        print(f"\n[BATCH {batch_num}] Starting new batch...")
        
        try:
            mapped = run_batch(batch_size=50)
            
            if mapped == 0:
                print("\n✅ ALL TASKS COMPLETE!")
                break
            
            total_mapped += mapped
            print(f"[BATCH {batch_num}] Done: {mapped} tasks processed")
            print(f"Total processed this run: {total_mapped}")
            
            batch_num += 1
            time.sleep(2)  # Brief pause between batches
            
        except KeyboardInterrupt:
            print("\n\n⚠️ Interrupted. Progress saved.")
            break
        except Exception as e:
            print(f"\n❌ Batch error: {e}")
            print("Restarting in 5 seconds...")
            time.sleep(5)
            continue

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--loop":
        self_healing_loop()
    else:
        # Single batch mode (legacy)
        run_batch()
