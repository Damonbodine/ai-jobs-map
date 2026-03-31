"""
Shared database connection management for pipeline scripts.
"""
import os
import psycopg2

def load_env():
    """Load .env.local file if present."""
    env = {}
    for envfile in ['.env.local', '.env']:
        try:
            with open(envfile, 'r') as f:
                for line in f:
                    if '=' in line and not line.startswith('#'):
                        key, val = line.strip().split('=', 1)
                        env[key] = val.strip().strip('"').strip("'")
        except FileNotFoundError:
            pass
    return env

_env = load_env()
DATABASE_URL = os.getenv('DATABASE_URL') or _env.get('DATABASE_URL')

def get_db():
    """Return a new psycopg2 connection."""
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL not set. Check .env.local or environment.")
    return psycopg2.connect(DATABASE_URL)

def get_occupation_lookup(cur):
    """Return {lowercase_title: id} dict for all occupations."""
    cur.execute("SELECT id, LOWER(title) FROM occupations")
    return {row[1]: row[0] for row in cur.fetchall()}

def match_occupation(title, lookup):
    """Try exact match, then prefix match against occupation lookup."""
    title_lower = title.lower()
    occ_id = lookup.get(title_lower)
    if occ_id:
        return occ_id
    # Partial prefix match (first 20 chars)
    for occ_title, oid in lookup.items():
        if occ_title[:20] == title_lower[:20]:
            return oid
    return None
