#!/usr/bin/env python3
"""
Shared helpers for block example audits and preview generation.
"""
from __future__ import annotations

from typing import Iterable
import json
import re


BLOCKS = [
    "intake",
    "analysis",
    "documentation",
    "coordination",
    "exceptions",
    "learning",
    "research",
    "compliance",
    "communication",
    "data_reporting",
]


BLOCK_LABELS = {
    "intake": "Intake",
    "analysis": "Analysis",
    "documentation": "Documentation",
    "coordination": "Coordination",
    "exceptions": "Exceptions",
    "learning": "Learning",
    "research": "Research",
    "compliance": "Compliance",
    "communication": "Communication",
    "data_reporting": "Data & Reporting",
}


FREQUENCY_WEIGHT = {
    "daily": 1.0,
    "weekly": 0.6,
    "monthly": 0.35,
    "as-needed": 0.4,
}


SOURCE_WEIGHT = {
    "microtask": 1.0,
    "onet_task": 0.75,
    "dwa": 0.6,
    "work_activity": 0.45,
}


BLOCK_PATTERNS = [
    (
        "coordination",
        re.compile(
            r"schedule|reschedul|timeline|calendar|crew|coordinate|coordinat|handoff|assign|dispatch|route|follow[- ]?up",
            re.IGNORECASE,
        ),
    ),
    (
        "documentation",
        re.compile(
            r"report|document|record|log|note|write|paperwork|summary|form|file|maintain.*record",
            re.IGNORECASE,
        ),
    ),
    (
        "communication",
        re.compile(
            r"email|message|communication|communicat|stakeholder|briefing|brief|update|notify|respond|present",
            re.IGNORECASE,
        ),
    ),
    (
        "data_reporting",
        re.compile(
            r"data|metric|dashboard|monitor|track|usage|analytics|status report|kpi|forecast|calculate",
            re.IGNORECASE,
        ),
    ),
    (
        "compliance",
        re.compile(
            r"compliance|regulat|audit|policy|verify|validation|safety|protocol|standard|inspection",
            re.IGNORECASE,
        ),
    ),
    (
        "research",
        re.compile(
            r"research|search|find|compare|gather|source|weather|trend|scan|investigat",
            re.IGNORECASE,
        ),
    ),
    (
        "analysis",
        re.compile(
            r"analyz|review|assess|evaluate|decide|decision|plan|estimate|interpret|determin|recommend",
            re.IGNORECASE,
        ),
    ),
    (
        "exceptions",
        re.compile(
            r"exception|incident|emergency|escalat|alert|anomaly|issue|critical|disruption|irregular",
            re.IGNORECASE,
        ),
    ),
    (
        "learning",
        re.compile(
            r"train|teach|educat|coach|onboard|mentor|certif|learning|brief new",
            re.IGNORECASE,
        ),
    ),
]


MICROTASK_CATEGORY_TO_BLOCK = {
    "task_automation": "intake",
    "decision_support": "analysis",
    "research_discovery": "research",
    "communication": "communication",
    "creative_assistance": "documentation",
    "data_analysis": "data_reporting",
    "learning_education": "learning",
}


WORK_ACTIVITY_HINTS = {
    "communicating with supervisors peers or subordinates": "communication",
    "scheduling work and activities": "coordination",
    "organizing planning and prioritizing work": "coordination",
    "documenting recording information": "documentation",
    "analyzing data or information": "analysis",
    "getting information": "research",
    "monitoring processes materials or surroundings": "exceptions",
    "updating and using relevant knowledge": "learning",
    "processing information": "data_reporting",
    "evaluating information to determine compliance with standards": "compliance",
}


def safe_load_json(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def midpoint(low: int, high: int) -> float:
    return (low + high) / 2


def normalize_title(text: str | None) -> str:
    value = (text or "").strip()
    value = re.sub(r"Related occu.*$", "", value, flags=re.IGNORECASE).strip()
    value = re.sub(r"\s+", " ", value).strip()
    return value


def infer_block_from_text(*parts: str | None) -> str:
    combined = " ".join(part or "" for part in parts)
    for block, pattern in BLOCK_PATTERNS:
        if pattern.search(combined):
            return block
    return "intake"


def infer_block_for_microtask(task_name: str, task_description: str | None, ai_category: str | None) -> str:
    text_block = infer_block_from_text(task_name, task_description)
    if text_block != "intake":
        return text_block
    if ai_category:
        return MICROTASK_CATEGORY_TO_BLOCK.get(ai_category, "intake")
    return "intake"


def infer_block_for_onet_task(task_title: str, task_description: str | None, gwa_title: str | None) -> str:
    text_block = infer_block_from_text(task_title, task_description, gwa_title)
    if text_block != "intake":
        return text_block

    gwa = (gwa_title or "").strip().lower()
    if gwa in WORK_ACTIVITY_HINTS:
        return WORK_ACTIVITY_HINTS[gwa]
    return "intake"


def infer_block_for_dwa(dwa_title: str | None) -> str:
    return infer_block_from_text(dwa_title)


def infer_block_for_work_activity(element_name: str | None) -> str:
    name = (element_name or "").strip().lower()
    if name in WORK_ACTIVITY_HINTS:
        return WORK_ACTIVITY_HINTS[name]
    return infer_block_from_text(element_name)


def rank_microtask(row: dict) -> float:
    freq = FREQUENCY_WEIGHT.get(row.get("frequency") or "", 0.35)
    impact = float(row.get("ai_impact_level") or 2)
    effort = float(row.get("ai_effort_to_implement") or 3)
    ease = max(0.5, 6 - effort)
    return SOURCE_WEIGHT["microtask"] + impact * 0.7 + freq * 1.2 + ease * 0.2


def rank_onet_task(row: dict) -> float:
    automation = float(row.get("ai_automation_score") or 50)
    time_saved = float(row.get("estimated_time_saved_percent") or 20)
    return SOURCE_WEIGHT["onet_task"] + automation / 25.0 + time_saved / 40.0


def rank_dwa(row: dict) -> float:
    automation = float(row.get("avg_automation_score") or 40)
    occupation_count = float(row.get("occupation_count") or 1)
    return SOURCE_WEIGHT["dwa"] + automation / 35.0 + min(occupation_count, 25) / 50.0


def rank_work_activity(row: dict) -> float:
    importance = float(row.get("importance") or 1)
    level = float(row.get("level") or 1)
    return SOURCE_WEIGHT["work_activity"] + importance * 0.8 + level * 0.15


def dedupe_examples(rows: Iterable[dict], limit: int = 4) -> list[dict]:
    seen: set[str] = set()
    results: list[dict] = []
    for row in rows:
        title = normalize_title(row.get("title"))
        if not title:
            continue
        key = title.lower()
        if key in seen:
            continue
        seen.add(key)
        results.append(row)
        if len(results) >= limit:
            break
    return results
