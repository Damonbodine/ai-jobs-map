"""Aggregate validated DG3 task scores to occupation-level benchmark inputs."""
import csv
import json
import os
from collections import defaultdict


ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCORING = os.path.join(ROOT, "data", "scoring")
BENCH = os.path.join(ROOT, "data", "benchmarks")


def main():
    with open(os.path.join(ROOT, "data", "scoring-methodology.json")) as f:
        weights = json.load(f)["dimension_weights"]
    task_meta = {}
    with open(os.path.join(SCORING, "tasks_to_score.csv"), newline="") as f:
        for row in csv.DictReader(f):
            task_meta[(row["kind"], row["id"])] = row

    by_title = defaultdict(lambda: {"scores": [], "recoverable": []})
    with open(os.path.join(SCORING, "scores_v2.csv"), newline="") as f:
        for row in csv.DictReader(f):
            meta = task_meta[(row["kind"], row["id"])]
            bucket = by_title[meta["occupation_title"]]
            bucket["scores"].append(float(row["score"]))
            bucket["recoverable"].append(float(row["recoverable_share"]))

    baseline_path = os.path.join(BENCH, "our_scores.csv")
    output_path = os.path.join(BENCH, "our_scores_v2.csv")
    fields = [
        "occupation_id", "slug", "title", "soc_code", "soc_confidence",
        "task_score_v2", "recoverable_share_v2", "composite_score_v2", "task_count",
    ]
    matched = 0
    with open(baseline_path, newline="") as src, open(output_path, "w", newline="") as dst:
        writer = csv.DictWriter(dst, fieldnames=fields)
        writer.writeheader()
        for occupation in csv.DictReader(src):
            bucket = by_title.get(occupation["title"])
            if not bucket:
                continue
            matched += 1
            task_score = sum(bucket["scores"]) / len(bucket["scores"]) / 100
            dimensions = {
                "ability": occupation.get("ability_automation_potential"),
                "work_activity": occupation.get("work_activity_automation_potential"),
                "keyword": task_score,
                "knowledge": occupation.get("knowledge_digital_readiness"),
                "frequency": occupation.get("task_frequency_weight"),
            }
            available = {
                name: (weights[name], float(value))
                for name, value in dimensions.items()
                if value not in (None, "")
            }
            total_weight = sum(weight for weight, _ in available.values())
            composite_v2 = sum(weight * value for weight, value in available.values()) / total_weight
            writer.writerow({
                "occupation_id": occupation["occupation_id"],
                "slug": occupation["slug"],
                "title": occupation["title"],
                "soc_code": occupation["soc_code"],
                "soc_confidence": occupation["soc_confidence"],
                "task_score_v2": round(task_score * 100, 4),
                "recoverable_share_v2": round(sum(bucket["recoverable"]) / len(bucket["recoverable"]), 6),
                "composite_score_v2": round(composite_v2 * 100, 4),
                "task_count": len(bucket["scores"]),
            })

    if matched != len(by_title):
        missing = sorted(set(by_title) - {
            row["title"] for row in csv.DictReader(open(baseline_path, newline=""))
        })
        raise SystemExit(f"occupation-title mismatch: {len(missing)} missing: {missing[:5]}")
    print(f"Wrote {matched} occupations to {output_path}")


if __name__ == "__main__":
    main()
