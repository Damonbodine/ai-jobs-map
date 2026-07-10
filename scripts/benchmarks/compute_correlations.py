"""
DG1: Spearman rank correlation of Timeback's occupation scores against
three published AI-exposure indices.

Inputs (see data/benchmarks/raw/SOURCES.md for provenance):
  data/benchmarks/our_scores.csv                 — our composite + displayed minutes, keyed by SOC
  data/benchmarks/raw/AIOE_DataAppendix.xlsx     — Felten/Raj/Seamans AIOE (Appendix A)
  data/benchmarks/raw/openai_occ_level.csv       — Eloundou et al. exposure (beta measures)
  data/benchmarks/raw/aei_task_pct_v2.csv        — Anthropic Economic Index task usage shares
  data/benchmarks/raw/aei_onet_task_statements.csv — task text -> O*NET-SOC join

Outputs:
  data/benchmarks/correlations.json — machine-readable results
  stdout summary

Method notes:
- Spearman = Pearson on average ranks (tie-aware), computed per pairwise
  overlap of SOC codes. No SOC-vintage crosswalk is applied (AIOE uses SOC
  2010; most 6-digit codes are unchanged in 2018) — unmatched codes simply
  drop out and the overlap count is reported.
- AEI occupation usage = sum of task_pct over an occupation's tasks. This is
  observed usage (popularity x exposure), not a pure exposure rating; noted
  in the report.
- Where several of our occupations map to one SOC (or several O*NET detail
  codes map to one SOC), values are averaged before ranking.

Usage: python3 scripts/benchmarks/compute_correlations.py
"""
import csv
import json
import math
import os
from collections import defaultdict

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BENCH = os.path.join(ROOT, "data", "benchmarks")
RAW = os.path.join(BENCH, "raw")


def average_ranks(values):
    """Ranks (1-based), ties get the average rank."""
    order = sorted(range(len(values)), key=lambda i: values[i])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
            j += 1
        avg = (i + j) / 2 + 1
        for k in range(i, j + 1):
            ranks[order[k]] = avg
        i = j + 1
    return ranks


def spearman(xs, ys):
    if len(xs) < 3:
        return None
    rx, ry = average_ranks(xs), average_ranks(ys)
    mx, my = sum(rx) / len(rx), sum(ry) / len(ry)
    cov = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    vx = math.sqrt(sum((a - mx) ** 2 for a in rx))
    vy = math.sqrt(sum((b - my) ** 2 for b in ry))
    if vx == 0 or vy == 0:
        return None
    return cov / (vx * vy)


def soc_trim(code):
    """'11-1011.00' -> '11-1011'; passthrough for already-6-digit codes."""
    return code.split(".")[0].strip()


def load_ours():
    ours = defaultdict(list)  # soc -> list of (composite, displayed, slug, title)
    path = os.path.join(BENCH, "our_scores.csv")
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            soc = row["soc_code"].strip()
            if not soc or not row["composite_score"]:
                continue
            ours[soc].append(
                (
                    float(row["composite_score"]),
                    float(row["displayed_minutes"]),
                    row["slug"],
                    row["title"],
                )
            )
    return ours


def load_aioe():
    wb = openpyxl.load_workbook(os.path.join(RAW, "AIOE_DataAppendix.xlsx"), read_only=True)
    ws = wb["Appendix A"]
    out = {}
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0 or row[0] is None:
            continue
        out[soc_trim(str(row[0]))] = float(row[2])
    return out


def load_openai():
    """Average beta measures across O*NET detail codes per 6-digit SOC."""
    acc = defaultdict(list)
    with open(os.path.join(RAW, "openai_occ_level.csv"), newline="") as f:
        for row in csv.DictReader(f):
            soc = soc_trim(row["O*NET-SOC Code"])
            try:
                human = float(row["human_rating_beta"])
                model = float(row["dv_rating_beta"])
            except ValueError:
                continue
            acc[soc].append((human, model))
    return {
        soc: (
            sum(h for h, _ in vals) / len(vals),
            sum(m for _, m in vals) / len(vals),
        )
        for soc, vals in acc.items()
    }


def load_aei():
    """Sum Claude-usage share per SOC via task-text join."""
    task_to_soc = defaultdict(set)
    with open(os.path.join(RAW, "aei_onet_task_statements.csv"), newline="") as f:
        for row in csv.DictReader(f):
            task_to_soc[row["Task"].strip().lower()].add(soc_trim(row["O*NET-SOC Code"]))

    usage = defaultdict(float)
    matched, unmatched = 0, 0
    with open(os.path.join(RAW, "aei_task_pct_v2.csv"), newline="") as f:
        for row in csv.DictReader(f):
            socs = task_to_soc.get(row["task_name"].strip().lower())
            if not socs:
                unmatched += 1
                continue
            matched += 1
            pct = float(row["pct"])
            for soc in socs:
                usage[soc] += pct / len(socs)
    return usage, matched, unmatched


def top_divergences(pairs, n=20):
    """pairs: list of (soc, title, ours_value, theirs_value). Rank both,
    return the n largest absolute rank differences."""
    ours_ranks = average_ranks([p[2] for p in pairs])
    theirs_ranks = average_ranks([p[3] for p in pairs])
    total = len(pairs)
    rows = []
    for (soc, title, ov, tv), ro, rt in zip(pairs, ours_ranks, theirs_ranks):
        rows.append(
            {
                "soc": soc,
                "title": title,
                "our_percentile": round(100 * ro / total, 1),
                "index_percentile": round(100 * rt / total, 1),
                "rank_gap_pct_points": round(100 * abs(ro - rt) / total, 1),
                "our_value": round(ov, 2),
                "index_value": round(tv, 4),
            }
        )
    rows.sort(key=lambda r: -r["rank_gap_pct_points"])
    return rows[:n]


def main():
    ours = load_ours()
    # Collapse multi-occupation SOCs by mean
    ours_flat = {
        soc: (
            sum(v[0] for v in vals) / len(vals),
            sum(v[1] for v in vals) / len(vals),
            vals[0][3] if len(vals) == 1 else f"{vals[0][3]} (+{len(vals)-1} more)",
        )
        for soc, vals in ours.items()
    }

    indices = {}
    aioe = load_aioe()
    indices["felten_aioe"] = {"data": aioe, "n_index": len(aioe)}
    openai_data = load_openai()
    indices["openai_human_beta"] = {
        "data": {k: v[0] for k, v in openai_data.items()},
        "n_index": len(openai_data),
    }
    indices["openai_model_beta"] = {
        "data": {k: v[1] for k, v in openai_data.items()},
        "n_index": len(openai_data),
    }
    aei_usage, aei_matched, aei_unmatched = load_aei()
    indices["anthropic_economic_index_usage"] = {"data": aei_usage, "n_index": len(aei_usage)}

    results = {
        "generated": "2026-07-09",
        "our_occupations_with_soc": len(ours_flat),
        "aei_task_join": {"matched_tasks": aei_matched, "unmatched_tasks": aei_unmatched},
        "correlations": {},
        "divergences": {},
    }

    for name, idx in indices.items():
        pairs = []
        for soc, (comp, disp, title) in ours_flat.items():
            if soc in idx["data"]:
                pairs.append((soc, title, comp, disp, idx["data"][soc]))
        comp_pairs = [(s, t, c, v) for s, t, c, d, v in pairs]
        disp_pairs = [(s, t, d, v) for s, t, c, d, v in pairs]
        rho_comp = spearman([p[2] for p in comp_pairs], [p[3] for p in comp_pairs])
        rho_disp = spearman([p[2] for p in disp_pairs], [p[3] for p in disp_pairs])
        results["correlations"][name] = {
            "overlap_n": len(pairs),
            "spearman_composite": round(rho_comp, 3) if rho_comp is not None else None,
            "spearman_displayed_minutes": round(rho_disp, 3) if rho_disp is not None else None,
        }
        results["divergences"][name] = top_divergences(comp_pairs)

    # Context: how strongly the published indices agree with each other on
    # their own SOC overlap. This calibrates what "good" looks like for us.
    def cross(a, b):
        common = sorted(set(a) & set(b))
        rho = spearman([a[s] for s in common], [b[s] for s in common])
        return {"overlap_n": len(common), "spearman": round(rho, 3) if rho is not None else None}

    oa_human = indices["openai_human_beta"]["data"]
    results["cross_index_context"] = {
        "aioe_vs_openai_human": cross(aioe, oa_human),
        "aioe_vs_aei_usage": cross(aioe, aei_usage),
        "openai_human_vs_aei_usage": cross(oa_human, aei_usage),
    }

    out_path = os.path.join(BENCH, "correlations.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"Our occupations with SOC: {len(ours_flat)}")
    for name, r in results["correlations"].items():
        print(
            f"{name:36s} n={r['overlap_n']:4d}  "
            f"rho(composite)={r['spearman_composite']}  "
            f"rho(displayed)={r['spearman_displayed_minutes']}"
        )
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
