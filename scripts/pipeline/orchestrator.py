#!/usr/bin/env python3
"""
Pipeline Orchestrator — single entry point for the entire data pipeline.

Usage:
    python scripts/pipeline/orchestrator.py                    # Run full pipeline
    python scripts/pipeline/orchestrator.py --stage import     # Run from 'import' stage forward
    python scripts/pipeline/orchestrator.py --stage score      # Just re-score
    python scripts/pipeline/orchestrator.py --validate         # Run validators only
    python scripts/pipeline/orchestrator.py --dry-run          # Show what would run
"""
import sys
import os
import argparse
import time
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from scripts.pipeline.db import get_db

# ──────────────────────────────────────────────────────────────
# Pipeline DAG — stages in dependency order
# ──────────────────────────────────────────────────────────────

STAGES = [
    {
        'name': 'seed',
        'description': 'Seed occupations from BLS CSV',
        'command': 'npx tsx scripts/seed-occupations.ts',
        'type': 'shell',
    },
    {
        'name': 'import_abilities',
        'description': 'Import O*NET Abilities (Importance + Level)',
        'module': 'scripts.import_onet_abilities',
        'function': 'import_dimension',
        'args': {
            'excel_path': 'data/onet/Abilities.xlsx',
            'table_name': 'onet_abilities',
            'source_label': 'onet_abilities',
        },
        'depends_on': ['seed'],
        'parallel_group': 'import',
    },
    {
        'name': 'import_knowledge',
        'description': 'Import O*NET Knowledge domains',
        'module': 'scripts.import_onet_knowledge',
        'function': 'import_dimension',
        'args': {
            'excel_path': 'data/onet/Knowledge.xlsx',
            'table_name': 'onet_knowledge',
            'source_label': 'onet_knowledge',
        },
        'depends_on': ['seed'],
        'parallel_group': 'import',
    },
    {
        'name': 'import_work_activities',
        'description': 'Import O*NET Work Activities (GWAs)',
        'module': 'scripts.import_onet_work_activities',
        'function': 'import_dimension',
        'args': {
            'excel_path': 'data/onet/Work_Activities.xlsx',
            'table_name': 'onet_work_activities',
            'source_label': 'onet_work_activities',
        },
        'depends_on': ['seed'],
        'parallel_group': 'import',
    },
    {
        'name': 'import_skills',
        'description': 'Import O*NET Skills data',
        'command': 'python3 scripts/import_onet_skills.py',
        'type': 'shell',
        'depends_on': ['seed'],
        'parallel_group': 'import',
    },
    {
        'name': 'import_tasks',
        'description': 'Import O*NET task statements',
        'command': 'python3 scripts/import-onet-tasks.py',
        'type': 'shell',
        'depends_on': ['seed'],
        'parallel_group': 'import',
    },
    {
        'name': 'score',
        'description': 'Calculate composite automation scores',
        'module': 'scripts.calculate_composite_scores',
        'function': 'run',
        'depends_on': ['import_abilities', 'import_knowledge', 'import_work_activities'],
    },
    {
        'name': 'generate_factory',
        'description': 'Generate data-driven actions, workflows, packages from DWA patterns',
        'module': 'scripts.generate_factory',
        'function': 'run',
        'depends_on': ['score', 'import_tasks'],
    },
    {
        'name': 'calculate_coverage',
        'description': 'Calculate occupation coverage metrics',
        'command': 'python3 scripts/calculate_coverage.py',
        'type': 'shell',
        'depends_on': ['generate_factory'],
    },
    {
        'name': 'validate',
        'description': 'Run data quality validators',
        'module': 'scripts.pipeline.validators',
        'function': 'run_all',
        'depends_on': ['score'],
    },
]

STAGE_NAMES = [s['name'] for s in STAGES]


def record_run(cur, conn, stage, status, records=None, error=None):
    """Record a pipeline stage execution."""
    if status == 'running':
        cur.execute(
            "INSERT INTO pipeline_runs (stage, status) VALUES (%s, %s) RETURNING id",
            (stage, status)
        )
        conn.commit()
        return cur.fetchone()[0]
    else:
        cur.execute(
            "UPDATE pipeline_runs SET status=%s, records_processed=%s, error_message=%s, completed_at=NOW() WHERE stage=%s AND status='running' ORDER BY started_at DESC LIMIT 1",
            (status, records, error, stage)
        )
        conn.commit()


def run_stage(stage_def, conn, cur, dry_run=False):
    """Execute a single pipeline stage."""
    name = stage_def['name']
    print(f"\n{'='*60}")
    print(f"  Stage: {name} — {stage_def['description']}")
    print(f"{'='*60}")

    if dry_run:
        print(f"  [DRY RUN] Would execute {name}")
        return True

    run_id = record_run(cur, conn, name, 'running')
    start = time.time()

    try:
        if stage_def.get('type') == 'shell':
            import subprocess
            result = subprocess.run(
                stage_def['command'], shell=True,
                capture_output=True, text=True, timeout=600
            )
            if result.returncode != 0:
                raise RuntimeError(f"Command failed:\n{result.stderr[-500:]}")
            print(result.stdout[-1000:] if result.stdout else "  (no output)")
        else:
            # Import and call Python function
            import importlib
            mod = importlib.import_module(stage_def['module'])
            func = getattr(mod, stage_def['function'])
            if 'args' in stage_def:
                func(**stage_def['args'])
            else:
                func()

        elapsed = time.time() - start
        record_run(cur, conn, name, 'completed')
        print(f"  Completed in {elapsed:.1f}s")
        return True

    except Exception as e:
        elapsed = time.time() - start
        error_msg = str(e)[:500]
        record_run(cur, conn, name, 'failed', error=error_msg)
        print(f"  FAILED after {elapsed:.1f}s: {error_msg}")
        return False


def get_stages_from(start_stage):
    """Return stages from start_stage onward in DAG order."""
    if start_stage not in STAGE_NAMES:
        print(f"Unknown stage: {start_stage}")
        print(f"Available: {', '.join(STAGE_NAMES)}")
        sys.exit(1)

    idx = STAGE_NAMES.index(start_stage)
    return STAGES[idx:]


def main():
    parser = argparse.ArgumentParser(description='Pipeline Orchestrator')
    parser.add_argument('--stage', help='Start from this stage (skip earlier stages)')
    parser.add_argument('--validate', action='store_true', help='Run validators only')
    parser.add_argument('--dry-run', action='store_true', help='Show what would run')
    parser.add_argument('--list', action='store_true', help='List all stages')
    args = parser.parse_args()

    if args.list:
        print("Pipeline stages (in order):")
        for i, s in enumerate(STAGES):
            deps = s.get('depends_on', [])
            dep_str = f" (after: {', '.join(deps)})" if deps else ""
            print(f"  {i+1}. {s['name']:25s} {s['description']}{dep_str}")
        return

    conn = get_db()
    cur = conn.cursor()

    # Ensure pipeline_runs table exists
    cur.execute("""
        CREATE TABLE IF NOT EXISTS pipeline_runs (
            id SERIAL PRIMARY KEY,
            stage TEXT NOT NULL,
            status TEXT NOT NULL,
            records_processed INTEGER,
            error_message TEXT,
            started_at TIMESTAMP DEFAULT NOW() NOT NULL,
            completed_at TIMESTAMP
        )
    """)
    conn.commit()

    if args.validate:
        stages = [s for s in STAGES if s['name'] == 'validate']
    elif args.stage:
        stages = get_stages_from(args.stage)
    else:
        stages = STAGES

    print(f"\nPipeline starting at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Stages to run: {', '.join(s['name'] for s in stages)}")

    failed = []
    for stage in stages:
        success = run_stage(stage, conn, cur, dry_run=args.dry_run)
        if not success:
            failed.append(stage['name'])
            print(f"\n  Stage '{stage['name']}' failed. Continuing with remaining stages...")

    print(f"\n{'='*60}")
    if failed:
        print(f"Pipeline completed with {len(failed)} failure(s): {', '.join(failed)}")
    else:
        print(f"Pipeline completed successfully ({len(stages)} stages)")
    print(f"{'='*60}")

    conn.close()


if __name__ == '__main__':
    main()
