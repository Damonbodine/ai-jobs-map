# DG1 — Benchmark validation against published AI-exposure indices

**Date:** 2026-07-10 · **Status: DG3 V2 GATE PASSED. Production still reads v1 until the planned DG7 cutover.**

Reproduce v1: `npx tsx scripts/benchmarks/export-our-scores.ts && python3 scripts/benchmarks/compute_correlations.py`. Reproduce v2 after merging scores: `python3 scripts/rescore/build_occupation_scores.py && python3 scripts/rescore/benchmark_v2.py`. Sources and citations: `data/benchmarks/raw/SOURCES.md`. Machine-readable results: `data/benchmarks/correlations.json` (v1) and `data/benchmarks/correlations_v2.json` (v2).

## DG3 v2 results — gate passed

The parallel v2 composite replaces the 20% keyword dimension with the mean validated task-level v2 score; all other dimensions and weights remain unchanged. No production data was overwritten.

| Index | Overlap (n) | ρ vs task score v2 | ρ vs composite v2 | ρ vs recoverable share v2 |
|---|---:|---:|---:|---:|
| Felten/Raj/Seamans AIOE (2021) | 654 | 0.833 | **0.847** | 0.806 |
| OpenAI "GPTs are GPTs" — human ratings (β) | 752 | 0.867 | **0.846** | 0.842 |
| OpenAI "GPTs are GPTs" — model ratings (β) | 752 | 0.902 | **0.881** | 0.885 |
| Anthropic Economic Index — usage share | 493 | 0.538 | 0.527 | 0.522 |

The acceptance target was ρ ≥ 0.70 against AIOE and OpenAI human β. Composite v2 clears both targets by more than 0.14.

The 200-task pilot was independently re-scored during the full run. Test-retest consistency was ρ=0.987, mean absolute score difference 2.54 points, 97.5% within 10 points, and 90% exact blocker agreement. Reproduce with `python3 scripts/rescore/compare_pilot.py`; machine-readable results are in `data/scoring/pilot_consistency.json`.

Across 826 occupations, composite v2 has mean 46.33 and median 46.52 versus v1 mean 53.31 and median 52.10. The largest decreases are manual occupations previously inflated by keywords (tool grinders, food-preparation workers, textile and crushing-machine operators); the largest increases include data scientists and computer occupations. The full mover list is reproducible with `python3 scripts/rescore/compare_v1_v2.py` and stored in `data/scoring/comparison_v1_v2.json`.

## DG1 v1 baseline — gate fired

Spearman rank correlation of our scores against three published indices, on the SOC-code overlap:

| Index | Overlap (n) | ρ vs composite_score | ρ vs displayed minutes |
|---|---|---|---|
| Felten/Raj/Seamans AIOE (2021) | 654 | **0.364** | **0.513** |
| OpenAI "GPTs are GPTs" — human ratings (β) | 752 | 0.289 | 0.455 |
| OpenAI "GPTs are GPTs" — model ratings (β) | 752 | 0.355 | 0.471 |
| Anthropic Economic Index — usage share | 493 | 0.255 | 0.310 |

**Calibration — how well the indices agree with each other:**

| Pair | Overlap (n) | ρ |
|---|---|---|
| AIOE vs OpenAI human β | 683 | **0.859** |
| AIOE vs AEI usage | 587 | 0.568 |
| OpenAI human β vs AEI usage | 519 | 0.577 |

## Interpretation

1. **The published exposure indices agree strongly with each other (ρ = 0.86).** Index disagreement is not an excuse: "good" for an exposure-style score is ρ ≥ 0.7 against AIOE/OpenAI. Our composite manages 0.26–0.36.
2. **The failure mode is systematic, not noise: physical-occupation bias.** The top divergences are all manual occupations we rank near the top while every index ranks them near the bottom — construction helpers (our 99.8th percentile vs AIOE 0.5th), pressers/textile (95.0 vs 0.8), tank/ship loaders, roustabouts, meat cutters, short-order cooks. Root cause matches the audit: the keyword scorer rewards manual task text containing "check / sort / load / measure / monitor," and the "+15 routine/repetitive" bonus fires on repetitive physical work. The inverse also occurs (compensation & benefits specialists: our 1.1 vs AIOE 98.3).
3. **The displayed-minutes model beats the composite everywhere** (0.31–0.51 vs 0.26–0.36) because the archetype multiplier discounts physical occupations — partial, downstream damage control for the upstream keyword bias.
4. **AEI usage correlates only ~0.57 with the exposure indices themselves** — it measures observed usage (popularity × exposure), so 0.31 vs our displayed minutes carries less signal than the exposure comparisons; keep it as a citation for "grounded in observed usage" narratives after DG3, not as the primary target.

## Actions

- **Do not publish the current production v1 composite as validated.** The validated v2 signal remains parallel until DG7 performs the explicit cutover and changelog.
- **DG3 acceptance target: passed.** Composite v2 reaches ρ=0.847 vs AIOE and ρ=0.846 vs OpenAI human β.
- **Next validation gate:** DG4 human labeling and agreement statistics. Published-index agreement does not replace task-level human review.
- **DG5 note:** archetype multipliers proved directionally right (they carry the displayed model from 0.29→0.46+); grounding them properly should come from the re-scored task blockers rather than the physical_ability_avg threshold.
