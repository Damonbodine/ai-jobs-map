"""Generate the DG3 occupation-level v1 versus parallel-v2 comparison report."""
import csv
import json
import os
import statistics
import sys


ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BENCH = os.path.join(ROOT, "data", "benchmarks")
SCORING = os.path.join(ROOT, "data", "scoring")
sys.path.insert(0, os.path.join(ROOT, "scripts", "benchmarks"))
from compute_correlations import spearman  # noqa: E402


def summary(values):
    return {
        "min": round(min(values), 3),
        "mean": round(statistics.mean(values), 3),
        "median": round(statistics.median(values), 3),
        "max": round(max(values), 3),
    }


def main():
    v1 = {
        row["occupation_id"]: row
        for row in csv.DictReader(open(os.path.join(BENCH, "our_scores.csv"), newline=""))
    }
    rows = []
    for row in csv.DictReader(open(os.path.join(BENCH, "our_scores_v2.csv"), newline="")):
        old = v1[row["occupation_id"]]
        old_score = float(old["composite_score"])
        new_score = float(row["composite_score_v2"])
        rows.append({
            "occupation_id": int(row["occupation_id"]),
            "slug": row["slug"],
            "title": row["title"],
            "soc_code": row["soc_code"],
            "composite_v1": round(old_score, 3),
            "composite_v2": round(new_score, 3),
            "delta": round(new_score - old_score, 3),
        })
    old_values = [row["composite_v1"] for row in rows]
    new_values = [row["composite_v2"] for row in rows]
    result = {
        "generated": "2026-07-10",
        "n": len(rows),
        "v1_distribution": summary(old_values),
        "v2_distribution": summary(new_values),
        "v1_v2_spearman": round(spearman(old_values, new_values), 3),
        "largest_increases": sorted(rows, key=lambda row: -row["delta"])[:20],
        "largest_decreases": sorted(rows, key=lambda row: row["delta"])[:20],
    }
    output = os.path.join(SCORING, "comparison_v1_v2.json")
    with open(output, "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps({k: v for k, v in result.items() if not isinstance(v, list)}, indent=2))
    print("Top increases:")
    for row in result["largest_increases"][:5]:
        print(f"  {row['delta']:+6.2f}  {row['title']}")
    print("Top decreases:")
    for row in result["largest_decreases"][:5]:
        print(f"  {row['delta']:+6.2f}  {row['title']}")
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
