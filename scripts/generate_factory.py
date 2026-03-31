#!/usr/bin/env python3
"""
Dynamic Factory Generator — replaces hardcoded populate-factory.py.

Generates automation actions, workflows, and packages from actual DWA patterns
rather than manually defined lists. The factory is now data-driven:

  1. ACTIONS: Generated from the most common DWAs across occupations
  2. WORKFLOWS: Composed by clustering co-occurring actions within GWA groups
  3. PACKAGES: Tiered bundles matched to occupation categories by coverage

Run: python scripts/generate_factory.py
"""
import sys
import os
import json
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from scripts.pipeline.db import get_db

# ──────────────────────────────────────────────────────────────
# GWA → Category mapping for organizing actions into workflows
# ──────────────────────────────────────────────────────────────

GWA_CATEGORIES = {
    '4.A.1': ('information_input', 'Information Gathering'),
    '4.A.2': ('mental_processes', 'Analysis & Decision Making'),
    '4.A.3.a': ('physical_work', 'Physical Work'),
    '4.A.3.b': ('technical_work', 'Technical & Computer Work'),
    '4.A.4.a': ('communication', 'Communication & Interpersonal'),
    '4.A.4.b': ('management', 'Management & Leadership'),
    '4.A.4.c': ('administrative', 'Administrative Operations'),
}

# Tool suggestions by category
CATEGORY_TOOLS = {
    'information_input': ['web_scraping', 'api_connectors', 'rss_feeds', 'document_ai'],
    'mental_processes': ['analytics_ai', 'ml_models', 'bi_tools', 'decision_support'],
    'technical_work': ['code_assistants', 'cad_ai', 'documentation_tools', 'automation_platforms'],
    'communication': ['email_ai', 'chatbots', 'translation_ai', 'summarization'],
    'management': ['project_tools', 'scheduling_ai', 'workload_optimization'],
    'administrative': ['form_automation', 'filing_systems', 'compliance_tools', 'reporting'],
}

# Workflow trigger types by category
CATEGORY_TRIGGERS = {
    'information_input': 'event',
    'mental_processes': 'scheduled',
    'technical_work': 'manual',
    'communication': 'event',
    'management': 'scheduled',
    'administrative': 'scheduled',
}


def categorize_dwa(dwa_id):
    """Map a DWA ID to its GWA category."""
    for prefix, (cat, label) in GWA_CATEGORIES.items():
        if dwa_id.startswith(prefix):
            return cat, label
    return 'other', 'Other'


def generate_actions(cur, min_occupations=20, max_actions=50):
    """Generate automation actions from the most common DWAs."""
    print("\n  Generating actions from DWA patterns...")

    # Find DWAs that appear across many occupations
    cur.execute("""
        SELECT d.dwa_id, d.dwa_title, d.occupation_count, d.avg_automation_score
        FROM detailed_work_activities d
        WHERE d.occupation_count >= %s
        ORDER BY d.occupation_count DESC
        LIMIT %s
    """, (min_occupations, max_actions))

    dwas = cur.fetchall()
    if not dwas:
        print("    No DWAs found with sufficient coverage. Falling back to top DWAs by any count...")
        cur.execute("""
            SELECT d.dwa_id, d.dwa_title, d.occupation_count, d.avg_automation_score
            FROM detailed_work_activities d
            WHERE d.occupation_count > 0
            ORDER BY d.occupation_count DESC
            LIMIT %s
        """, (max_actions,))
        dwas = cur.fetchall()

    # Clear existing actions and dependent mappings
    cur.execute("DELETE FROM task_to_action_mapping")
    cur.execute("DELETE FROM skill_to_action_mapping")
    cur.execute("DELETE FROM occupation_coverage")
    cur.execute("DELETE FROM automation_packages")
    cur.execute("DELETE FROM automation_workflows")
    cur.execute("DELETE FROM automation_actions")

    actions = []
    action_id_map = {}

    for i, (dwa_id, dwa_title, occ_count, avg_score) in enumerate(dwas):
        category, _ = categorize_dwa(dwa_id)

        # Skip physical work DWAs — they're not automatable
        if category == 'physical_work':
            continue

        # Generate action code from index
        code = f"ACT-{category[:4].upper()}-{i+1:03d}"

        # Complexity: 1-4 based on inverse automation score
        if avg_score and avg_score > 0:
            complexity = max(1, min(4, 5 - int(avg_score / 25)))
        else:
            complexity = 2

        # Estimated hours based on complexity
        hours_map = {1: 2.0, 2: 4.0, 3: 6.0, 4: 8.0}
        hours = hours_map.get(complexity, 4.0)

        tools = CATEGORY_TOOLS.get(category, ['ai_automation'])

        cur.execute("""
            INSERT INTO automation_actions
            (action_code, action_name, action_description, category, dwa_ids,
             base_complexity, estimated_hours, common_integrations, reusable_across_occupations)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            code,
            dwa_title[:80],  # Action name = DWA title
            f"Automate: {dwa_title}. Used across {occ_count} occupations.",
            category,
            [dwa_id],  # Link back to source DWA
            complexity,
            hours,
            tools,
            occ_count,
        ))
        action_id = cur.fetchone()[0]
        actions.append({
            'id': action_id,
            'code': code,
            'category': category,
            'dwa_id': dwa_id,
            'occ_count': occ_count,
            'complexity': complexity,
        })
        action_id_map[code] = action_id

    print(f"    Generated {len(actions)} actions from DWA patterns")
    return actions, action_id_map


def generate_workflows(cur, actions, action_id_map):
    """Compose workflows by clustering actions within categories."""
    print("\n  Generating workflows from action clusters...")

    # Group actions by category
    by_category = defaultdict(list)
    for action in actions:
        by_category[action['category']].append(action)

    # Workflows already cleared in generate_actions

    workflows = []
    wf_id_map = {}

    for category, cat_actions in by_category.items():
        if len(cat_actions) < 2:
            continue

        _, label = next(
            (v for k, v in GWA_CATEGORIES.items() if v[0] == category),
            (category, category.replace('_', ' ').title())
        )

        # Sort by occupation count (most universal first)
        cat_actions.sort(key=lambda a: a['occ_count'], reverse=True)

        # Generate a "core" workflow from top 3-5 actions in this category
        top_actions = cat_actions[:min(5, len(cat_actions))]
        action_ids = [a['id'] for a in top_actions]
        total_occ = sum(a['occ_count'] for a in top_actions)

        # Pricing from complexity
        avg_complexity = sum(a['complexity'] for a in top_actions) / len(top_actions)
        base_price = int(1500 + avg_complexity * 800)
        monthly = int(base_price * 0.05)
        time_saved = round(0.5 * len(top_actions), 1)

        trigger = CATEGORY_TRIGGERS.get(category, 'manual')
        tools = CATEGORY_TOOLS.get(category, [])

        code = f"WF-{category[:4].upper()}-001"

        cur.execute("""
            INSERT INTO automation_workflows
            (workflow_code, workflow_name, workflow_description, category,
             action_ids, trigger_type, input_sources, output_destinations,
             requires_human_approval, base_price, monthly_maintenance,
             estimated_time_saved_per_day, occupation_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            code,
            f"{label} Automation",
            f"End-to-end {label.lower()} automation covering {len(top_actions)} core activities used across {total_occ}+ occupation tasks.",
            category,
            action_ids,
            trigger,
            tools[:3],
            ['dashboard', 'email', 'api'],
            avg_complexity > 2.5,
            base_price,
            monthly,
            time_saved,
            total_occ // len(top_actions),
        ))
        wf_id = cur.fetchone()[0]
        workflows.append({
            'id': wf_id,
            'code': code,
            'category': category,
            'label': label,
            'action_count': len(top_actions),
            'base_price': base_price,
            'monthly': monthly,
        })
        wf_id_map[code] = wf_id

        # If there are more than 5 actions, make an "advanced" workflow too
        if len(cat_actions) > 5:
            adv_actions = cat_actions[:min(10, len(cat_actions))]
            adv_ids = [a['id'] for a in adv_actions]
            adv_code = f"WF-{category[:4].upper()}-002"

            adv_price = int(base_price * 1.6)
            adv_monthly = int(adv_price * 0.05)

            cur.execute("""
                INSERT INTO automation_workflows
                (workflow_code, workflow_name, workflow_description, category,
                 action_ids, trigger_type, input_sources, output_destinations,
                 requires_human_approval, base_price, monthly_maintenance,
                 estimated_time_saved_per_day, occupation_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                adv_code,
                f"Advanced {label} Suite",
                f"Comprehensive {label.lower()} suite covering {len(adv_actions)} activities.",
                category,
                adv_ids,
                trigger,
                tools,
                ['dashboard', 'email', 'api', 'webhook'],
                True,
                adv_price,
                adv_monthly,
                round(0.5 * len(adv_actions), 1),
                total_occ // len(adv_actions),
            ))
            adv_id = cur.fetchone()[0]
            workflows.append({
                'id': adv_id,
                'code': adv_code,
                'category': category,
                'label': f"Advanced {label}",
                'action_count': len(adv_actions),
                'base_price': adv_price,
                'monthly': adv_monthly,
            })
            wf_id_map[adv_code] = adv_id

    print(f"    Generated {len(workflows)} workflows")
    return workflows, wf_id_map


def generate_packages(cur, workflows, wf_id_map):
    """Generate tiered packages from workflow combinations."""
    print("\n  Generating packages from workflow clusters...")

    # Packages already cleared in generate_actions

    # Group workflows by category
    by_category = defaultdict(list)
    for wf in workflows:
        by_category[wf['category']].append(wf)

    packages = []

    # Get occupation categories for targeting
    cur.execute("SELECT DISTINCT major_category FROM occupations ORDER BY major_category")
    all_categories = [r[0] for r in cur.fetchall()]

    # Category → occupation targeting hints
    CATEGORY_OCCUPATIONS = {
        'information_input': ['Management', 'Business and Financial Operations', 'Computer and Mathematical'],
        'mental_processes': ['Management', 'Business and Financial Operations', 'Life Physical and Social Science'],
        'technical_work': ['Computer and Mathematical', 'Architecture and Engineering'],
        'communication': ['Sales and Related', 'Office and Administrative Support', 'Management'],
        'management': ['Management', 'Business and Financial Operations'],
        'administrative': ['Office and Administrative Support', 'Business and Financial Operations'],
    }

    for category, cat_wfs in by_category.items():
        target_occs = CATEGORY_OCCUPATIONS.get(category, all_categories[:3])
        _, label = next(
            (v for k, v in GWA_CATEGORIES.items() if v[0] == category),
            (category, category.replace('_', ' ').title())
        )

        # Starter: single core workflow
        core_wf = cat_wfs[0]
        starter_code = f"PKG-{category[:4].upper()}-STARTER"
        cur.execute("""
            INSERT INTO automation_packages
            (package_code, package_name, package_description, tier,
             workflow_ids, base_price, monthly_price, setup_hours,
             includes_self_healing, includes_integrations, target_occupations, roi_multiplier)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            starter_code,
            f"{label} Starter",
            f"Essential {label.lower()} automation. Get started with core capabilities.",
            'starter',
            [core_wf['id']],
            core_wf['base_price'],
            core_wf['monthly'],
            round(core_wf['action_count'] * 2.0, 1),
            True, 1,
            target_occs,
            4.0,
        ))
        packages.append(starter_code)

        # Growth: all workflows in category
        if len(cat_wfs) >= 2:
            all_ids = [wf['id'] for wf in cat_wfs]
            total_price = sum(wf['base_price'] for wf in cat_wfs)
            total_monthly = sum(wf['monthly'] for wf in cat_wfs)
            growth_code = f"PKG-{category[:4].upper()}-GROWTH"

            cur.execute("""
                INSERT INTO automation_packages
                (package_code, package_name, package_description, tier,
                 workflow_ids, base_price, monthly_price, setup_hours,
                 includes_self_healing, includes_integrations, target_occupations, roi_multiplier)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                growth_code,
                f"{label} Growth Pack",
                f"Complete {label.lower()} automation suite with advanced capabilities.",
                'growth',
                all_ids,
                int(total_price * 0.85),  # Bundle discount
                int(total_monthly * 0.85),
                round(sum(wf['action_count'] for wf in cat_wfs) * 1.5, 1),
                True, 3,
                target_occs,
                6.0,
            ))
            packages.append(growth_code)

    # Enterprise: cross-category bundles
    # Combine the top workflow from each category
    cross_wfs = []
    for cat_wfs in by_category.values():
        if cat_wfs:
            cross_wfs.append(cat_wfs[0])

    if len(cross_wfs) >= 3:
        cross_ids = [wf['id'] for wf in cross_wfs]
        total_price = sum(wf['base_price'] for wf in cross_wfs)
        total_monthly = sum(wf['monthly'] for wf in cross_wfs)

        cur.execute("""
            INSERT INTO automation_packages
            (package_code, package_name, package_description, tier,
             workflow_ids, base_price, monthly_price, setup_hours,
             includes_self_healing, includes_integrations, target_occupations, roi_multiplier)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            'PKG-ENTERPRISE-FULL',
            'Full Operations Automation',
            f"Enterprise-grade automation across {len(cross_wfs)} functional areas. Information gathering, analysis, communication, and administration — all automated.",
            'enterprise',
            cross_ids,
            int(total_price * 0.75),  # Enterprise discount
            int(total_monthly * 0.75),
            round(sum(wf['action_count'] for wf in cross_wfs) * 1.2, 1),
            True, 6,
            ['Management', 'Business and Financial Operations', 'Office and Administrative Support'],
            8.0,
        ))
        packages.append('PKG-ENTERPRISE-FULL')

    print(f"    Generated {len(packages)} packages")
    return packages


def run():
    conn = get_db()
    cur = conn.cursor()

    print("="*60)
    print("  Dynamic Factory Generator")
    print("  Generating from DWA patterns (not hardcoded)")
    print("="*60)

    actions, action_id_map = generate_actions(cur, min_occupations=10, max_actions=50)
    workflows, wf_id_map = generate_workflows(cur, actions, action_id_map)
    packages = generate_packages(cur, workflows, wf_id_map)

    conn.commit()

    # Summary
    cur.execute("SELECT COUNT(*) FROM automation_actions")
    a_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM automation_workflows")
    w_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM automation_packages")
    p_count = cur.fetchone()[0]

    print(f"\n{'='*60}")
    print(f"  Factory Generation Complete")
    print(f"  Actions:   {a_count} (from DWA patterns)")
    print(f"  Workflows: {w_count} (from action clusters)")
    print(f"  Packages:  {p_count} (tiered bundles)")
    print(f"{'='*60}")

    # Show a sample
    print("\nSample actions (top 5 by occupation coverage):")
    cur.execute("""
        SELECT action_name, category, reusable_across_occupations, dwa_ids
        FROM automation_actions ORDER BY reusable_across_occupations DESC LIMIT 5
    """)
    for name, cat, count, dwas in cur.fetchall():
        print(f"  {count:>4} occs  [{cat:20s}]  {name[:60]}")

    print("\nWorkflows:")
    cur.execute("""
        SELECT workflow_name, category, base_price, monthly_maintenance
        FROM automation_workflows ORDER BY base_price DESC
    """)
    for name, cat, bp, mp in cur.fetchall():
        print(f"  ${bp:>5} + ${mp:>3}/mo  [{cat:20s}]  {name}")

    print("\nPackages:")
    cur.execute("""
        SELECT package_name, tier, base_price, monthly_price
        FROM automation_packages ORDER BY base_price DESC
    """)
    for name, tier, bp, mp in cur.fetchall():
        print(f"  ${bp:>5} + ${mp:>3}/mo  [{tier:12s}]  {name}")

    conn.close()


if __name__ == "__main__":
    run()
