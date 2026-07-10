"""Benchmark DG3 occupation task scores against the published DG1 indices."""
import csv
import json
import os
import sys
from collections import defaultdict


ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BENCH = os.path.join(ROOT, "data", "benchmarks")
sys.path.insert(0, os.path.join(ROOT, "scripts", "benchmarks"))

from compute_correlations import (  # noqa: E402
    load_aei,
    load_aioe,
    load_openai,
    spearman,
    top_divergences,
)


def load_ours():
    grouped = defaultdict(list)
    with open(os.path.join(BENCH, "our_scores_v2.csv"), newline="") as f:
        for row in csv.DictReader(f):
            soc = row["soc_code"].strip()
            if not soc:
                continue
            grouped[soc].append((
                float(row["task_score_v2"]),
                float(row["recoverable_share_v2"]),
                float(row["composite_score_v2"]),
                row["title"],
            ))
    return {
        soc: (
            sum(v[0] for v in values) / len(values),
            sum(v[1] for v in values) / len(values),
            sum(v[2] for v in values) / len(values),
            values[0][3] if len(values) == 1 else f"{values[0][3]} (+{len(values)-1} more)",
        )
        for soc, values in grouped.items()
    }


def main():
    ours = load_ours()
    openai = load_openai()
    aei, matched, unmatched = load_aei()
    indices = {
        "felten_aioe": load_aioe(),
        "openai_human_beta": {k: v[0] for k, v in openai.items()},
        "openai_model_beta": {k: v[1] for k, v in openai.items()},
        "anthropic_economic_index_usage": aei,
    }
    results = {
        "generated": "2026-07-10",
        "rubric_version": "v2.0-0bc6e57d39a2",
        "occupation_score": "unweighted mean of task-level AI score v2",
        "our_occupations_with_soc": len(ours),
        "aei_task_join": {"matched_tasks": matched, "unmatched_tasks": unmatched},
        "correlations": {},
        "divergences": {},
    }
    for name, index in indices.items():
        common = sorted(set(ours) & set(index))
        score_pairs = [(soc, ours[soc][3], ours[soc][0], index[soc]) for soc in common]
        composite_pairs = [(soc, ours[soc][3], ours[soc][2], index[soc]) for soc in common]
        score_rho = spearman([p[2] for p in score_pairs], [p[3] for p in score_pairs])
        recovery_rho = spearman([ours[s][1] for s in common], [index[s] for s in common])
        composite_rho = spearman([p[2] for p in composite_pairs], [p[3] for p in composite_pairs])
        results["correlations"][name] = {
            "overlap_n": len(common),
            "spearman_task_score_v2": round(score_rho, 3),
            "spearman_composite_score_v2": round(composite_rho, 3),
            "spearman_recoverable_share_v2": round(recovery_rho, 3),
        }
        results["divergences"][name] = top_divergences(score_pairs)

    output = os.path.join(BENCH, "correlations_v2.json")
    with open(output, "w") as f:
        json.dump(results, f, indent=2)
    for name, row in results["correlations"].items():
        print(
            f"{name:36s} n={row['overlap_n']:4d}  "
            f"rho(score_v2)={row['spearman_task_score_v2']}  "
            f"rho(composite_v2)={row['spearman_composite_score_v2']}  "
            f"rho(recoverable_v2)={row['spearman_recoverable_share_v2']}"
        )
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
