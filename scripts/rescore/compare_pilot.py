"""Measure DG3 pilot/full-run test-retest consistency on the 200 pilot tasks."""
import glob
import json
import os
import sys


ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCORING = os.path.join(ROOT, "data", "scoring")
sys.path.insert(0, os.path.join(ROOT, "scripts", "benchmarks"))
from compute_correlations import spearman  # noqa: E402


def main():
    pilot = []
    for path in sorted(glob.glob(os.path.join(SCORING, "pilot", "chunk_*.json"))):
        pilot.extend(json.load(open(path)))
    full = {}
    for path in glob.glob(os.path.join(SCORING, "scores", "chunk_*.json")):
        for row in json.load(open(path)):
            full[(row["kind"], str(row["id"]))] = row
    pairs = [(row, full[(row["kind"], str(row["id"]))]) for row in pilot]
    n = len(pairs)
    result = {
        "n": n,
        "score_spearman": round(spearman(
            [a["score"] for a, _ in pairs], [b["score"] for _, b in pairs]
        ), 3),
        "score_mae": round(sum(abs(a["score"] - b["score"]) for a, b in pairs) / n, 2),
        "score_within_10_points_share": round(
            sum(abs(a["score"] - b["score"]) <= 10 for a, b in pairs) / n, 3
        ),
        "blocker_agreement_share": round(sum(a["blocker"] == b["blocker"] for a, b in pairs) / n, 3),
        "confidence_agreement_share": round(
            sum(a["confidence"] == b["confidence"] for a, b in pairs) / n, 3
        ),
    }
    output = os.path.join(SCORING, "pilot_consistency.json")
    with open(output, "w") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
