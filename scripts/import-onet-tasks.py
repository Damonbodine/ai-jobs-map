"""
Comprehensive O*NET Task Import and AI Scoring Script
- Scrapes tasks from O*NET OnLine for all occupations
- Scores each task for AI automatability
- Groups tasks by DWA (Detailed Work Activities) for reusable automations
"""
import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os
import psycopg2
from typing import Optional
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:54322/postgres')

# HTTP session
session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
})

# AI automation scoring rules
AI_AUTOMATABLE_KEYWORDS = {
    'high': [
        'data entry', 'record', 'log', 'file', 'organize', 'sort', 'categorize',
        'calculate', 'compute', 'summarize', 'compile', 'generate report',
        'schedule', 'calendar', 'email', 'notification', 'remind',
        'search', 'find', 'lookup', 'retrieve', 'query',
        'translate', 'transcribe', 'convert', 'format',
        'check', 'verify', 'validate', 'review', 'audit',
        'monitor', 'track', 'measure', 'analyze', 'compare'
    ],
    'medium': [
        'prepare', 'draft', 'create', 'develop', 'design',
        'communicate', 'respond', 'reply', 'present', 'explain',
        'evaluate', 'assess', 'recommend', 'suggest', 'advise',
        'plan', 'coordinate', 'organize', 'manage', 'track',
        'research', 'investigate', 'identify', 'determine'
    ],
    'low': [
        'negotiate', 'persuade', 'sell', 'counsel', 'interview',
        'supervise', 'lead', 'train', 'mentor', 'coach',
        'create strategy', 'make decisions', 'exercise judgment',
        'physical', 'manual', 'operate equipment', 'drive'
    ]
}

# AI tool suggestions based on task type
AI_TOOL_SUGGESTIONS = {
    'data_entry': ['AI form fillers', 'OCR scanners', 'Voice-to-text'],
    'analysis': ['ChatGPT', 'Claude', 'Data analysis AI', 'Excel AI'],
    'communication': ['AI email writers', 'Chatbots', 'Translation AI'],
    'research': ['Perplexity', 'AI search engines', 'Document AI'],
    'creative': ['Midjourney', 'DALL-E', 'AI writing assistants'],
    'scheduling': ['AI schedulers', 'Calendar AI', 'Automation tools'],
    'reporting': ['AI report generators', 'BI tools', 'Data visualization AI'],
    'review': ['AI proofreaders', 'Code review AI', 'Document review AI'],
    'coding': ['GitHub Copilot', 'Cursor', 'CodeWhisperer'],
    'support': ['AI chatbots', 'Knowledge base AI', 'Help desk AI'],
}

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def get_occupations_with_soc() -> list:
    """Get all occupations from our database with their O*NET SOC codes"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, title, slug, major_category 
        FROM occupations 
        ORDER BY id
    """)
    occupations = cur.fetchall()
    cur.close()
    conn.close()
    return occupations

def map_slug_to_soc(slug: str, title: str) -> Optional[str]:
    """Map occupation slug/title to O*NET SOC code using common patterns"""
    # This is a simplified mapping - in production, use a comprehensive crosswalk file
    # For now, we'll use O*NET OnLine search
    
    # Try searching O*NET OnLine
    try:
        search_term = title.replace(' ', '+').replace(',', '')
        url = f"https://www.onetonline.org/find/quick?s={search_term}"
        r = session.get(url, timeout=15)
        
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, 'html.parser')
            # Find first SOC link
            for link in soup.find_all('a', href=True):
                href = link.get('href', '')
                if '/link/summary/' in href:
                    soc_code = href.split('/summary/')[-1]
                    if re.match(r'\d{2}-\d{4}\.\d{2}', soc_code):
                        return soc_code
    except Exception as e:
        pass
    
    return None

def scrape_occupation_tasks(soc_code: str) -> list[dict]:
    """Scrape tasks for an occupation from O*NET OnLine"""
    url = f"https://www.onetonline.org/link/summary/{soc_code}"
    
    try:
        r = session.get(url, timeout=30)
        if r.status_code != 200:
            return []
        
        soup = BeautifulSoup(r.text, 'html.parser')
        tasks = []
        
        # Find the Tasks section - O*NET uses id="t2" for tasks
        task_section = soup.find('div', {'id': 't2'})
        
        if not task_section:
            # Alternative: find by heading
            for heading in soup.find_all(['h2', 'h3']):
                if 'Task' in heading.get_text():
                    task_section = heading.find_next('ul') or heading.find_next('ol')
                    break
        
        if task_section:
            for idx, li in enumerate(task_section.find_all('li'), 1):
                task_text = li.get_text(strip=True)
                # Clean up "Related occupations" suffix
                task_text = re.sub(r'Related occupations.*$', '', task_text).strip()
                
                if task_text and len(task_text) > 10:
                    tasks.append({
                        'task_id': f"{soc_code}.T{idx}",
                        'task_title': task_text[:100],  # First 100 chars as title
                        'task_description': task_text,
                        'task_type': 'Core',
                        'onet_soc_code': soc_code,
                    })
        
        return tasks
    
    except Exception as e:
        print(f"  Error scraping {soc_code}: {e}")
        return []

def score_task_ai_automatability(task_text: str) -> dict:
    """Score a task for AI automatability based on text analysis"""
    text_lower = task_text.lower()
    
    # Count keyword matches
    high_matches = sum(1 for kw in AI_AUTOMATABLE_KEYWORDS['high'] if kw in text_lower)
    medium_matches = sum(1 for kw in AI_AUTOMATABLE_KEYWORDS['medium'] if kw in text_lower)
    low_matches = sum(1 for kw in AI_AUTOMATABLE_KEYWORDS['low'] if kw in text_lower)
    
    # Calculate base score
    if low_matches > 2:
        base_score = 20
        difficulty = 'hard'
    elif high_matches > medium_matches:
        base_score = 75 + min(high_matches * 5, 20)
        difficulty = 'easy'
    elif medium_matches > 0:
        base_score = 50 + min(medium_matches * 5, 20)
        difficulty = 'medium'
    else:
        base_score = 40
        difficulty = 'medium'
    
    # Adjust based on task characteristics
    if any(word in text_lower for word in ['physical', 'manual', 'operate', 'repair']):
        base_score = max(10, base_score - 30)
        difficulty = 'hard'
    
    if any(word in text_lower for word in ['routine', 'repetitive', 'standard', 'regular']):
        base_score = min(95, base_score + 15)
        difficulty = 'easy' if base_score > 60 else difficulty
    
    if any(word in text_lower for word in ['complex', 'judgment', 'discretion', 'negotiate']):
        base_score = max(10, base_score - 20)
        difficulty = 'hard'
    
    # Determine automatable threshold
    is_automatable = base_score >= 40
    
    # Estimate time saved
    if base_score >= 80:
        time_saved = 80
    elif base_score >= 60:
        time_saved = 50
    elif base_score >= 40:
        time_saved = 25
    else:
        time_saved = 10
    
    # Suggest AI tools
    tools = []
    if 'data' in text_lower or 'record' in text_lower:
        tools.extend(AI_TOOL_SUGGESTIONS['data_entry'])
    if 'analy' in text_lower or 'report' in text_lower:
        tools.extend(AI_TOOL_SUGGESTIONS['analysis'])
    if 'commun' in text_lower or 'email' in text_lower:
        tools.extend(AI_TOOL_SUGGESTIONS['communication'])
    if 'research' in text_lower or 'find' in text_lower:
        tools.extend(AI_TOOL_SUGGESTIONS['research'])
    if 'creat' in text_lower or 'design' in text_lower:
        tools.extend(AI_TOOL_SUGGESTIONS['creative'])
    if 'schedul' in text_lower or 'calendar' in text_lower:
        tools.extend(AI_TOOL_SUGGESTIONS['scheduling'])
    
    tools = list(set(tools))[:3]  # Top 3 unique tools
    
    return {
        'ai_automatable': is_automatable,
        'ai_automation_score': base_score,
        'ai_difficulty': difficulty,
        'estimated_time_saved_percent': time_saved,
        'ai_tools': json.dumps(tools) if tools else None,
    }

def save_tasks_to_db(tasks: list[dict], occupation_id: int):
    """Save tasks to database"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    for task in tasks:
        score = score_task_ai_automatability(task['task_description'])
        
        cur.execute("""
            INSERT INTO onet_tasks 
            (onet_soc_code, task_id, task_title, task_description, task_type, 
             occupation_id, ai_automatable, ai_automation_score, ai_difficulty,
             estimated_time_saved_percent, ai_tools)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (
            task['onet_soc_code'],
            task['task_id'],
            task['task_title'],
            task['task_description'],
            task['task_type'],
            occupation_id,
            score['ai_automatable'],
            score['ai_automation_score'],
            score['ai_difficulty'],
            score['estimated_time_saved_percent'],
            score['ai_tools'],
        ))
    
    conn.commit()
    cur.close()
    conn.close()

def process_occupation(occupation: tuple, idx: int, total: int) -> dict:
    """Process a single occupation - scrape tasks and save"""
    occ_id, title, slug, category = occupation
    result = {
        'occupation_id': occ_id,
        'title': title,
        'status': 'pending',
        'tasks_found': 0,
        'soc_code': None,
    }
    
    try:
        # Get SOC code
        soc_code = map_slug_to_soc(slug, title)
        
        if not soc_code:
            # Try with O*NET search API directly
            search_url = f"https://www.onetcenter.org/wsAPI/v2.0/json/online/search?keyword={title.replace(' ', '+')}&start=0&end=1"
            try:
                r = session.get(search_url, timeout=15)
                if r.status_code == 200:
                    data = r.json()
                    if data.get('occupation'):
                        soc_code = data['occupation'][0].get('code')
            except:
                pass
        
        if not soc_code:
            result['status'] = 'no_soc_code'
            return result
        
        result['soc_code'] = soc_code
        
        # Scrape tasks
        time.sleep(0.5)  # Rate limiting
        tasks = scrape_occupation_tasks(soc_code)
        
        if tasks:
            save_tasks_to_db(tasks, occ_id)
            result['tasks_found'] = len(tasks)
            result['status'] = 'success'
        else:
            result['status'] = 'no_tasks_found'
        
        print(f"  [{idx}/{total}] {title}: {result['status']} - {result['tasks_found']} tasks")
        
    except Exception as e:
        result['status'] = f'error: {str(e)[:50]}'
        print(f"  [{idx}/{total}] {title}: ERROR - {str(e)[:50]}")
    
    return result

def main():
    print("=" * 60)
    print("O*NET Task Import and AI Scoring")
    print("=" * 60)
    
    occupations = get_occupations_with_soc()
    total = len(occupations)
    print(f"\nProcessing {total} occupations...\n")
    
    stats = {'success': 0, 'no_soc_code': 0, 'no_tasks_found': 0, 'errors': 0}
    
    for idx, occupation in enumerate(occupations, 1):
        result = process_occupation(occupation, idx, total)
        
        if result['status'] == 'success':
            stats['success'] += 1
        elif result['status'] == 'no_soc_code':
            stats['no_soc_code'] += 1
        elif result['status'] == 'no_tasks_found':
            stats['no_tasks_found'] += 1
        else:
            stats['errors'] += 1
        
        # Progress update every 50
        if idx % 50 == 0:
            print(f"\n--- Progress: {idx}/{total} ---")
            print(f"  Success: {stats['success']}")
            print(f"  No SOC: {stats['no_soc_code']}")
            print(f"  No Tasks: {stats['no_tasks_found']}")
            print(f"  Errors: {stats['errors']}\n")
    
    # Final summary
    print("\n" + "=" * 60)
    print("IMPORT COMPLETE")
    print(f"Success: {stats['success']}")
    print(f"No SOC Code: {stats['no_soc_code']}")
    print(f"No Tasks: {stats['no_tasks_found']}")
    print(f"Errors: {stats['errors']}")
    print("=" * 60)
    
    # Print stats from database
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM onet_tasks")
    total_tasks = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM onet_tasks WHERE ai_automatable = true")
    automatable = cur.fetchone()[0]
    print(f"\nDatabase stats:")
    print(f"  Total O*NET tasks: {total_tasks}")
    print(f"  AI-automatable tasks: {automatable} ({100*automatable//max(1,total_tasks)}%)")
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
