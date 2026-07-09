# DG1 — Benchmark validation against published AI-exposure indices

**Date:** 2026-07-09 · **Status: GATE FIRED — do not publish these numbers; DG3 re-scoring is a prerequisite for marketing the composite.**

Reproduce: `npx tsx scripts/benchmarks/export-our-scores.ts && python3 scripts/benchmarks/compute_correlations.py`. Sources and citations: `data/benchmarks/raw/SOURCES.md`. Machine-readable results: `data/benchmarks/correlations.json`.

## Results

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

- **Do not publish** current composite scores as "validated" or cite these correlations in marketing. The methodology-page benchmark section waits for post-DG3 numbers.
- **DG3 rubric requirement (new):** the strong-model re-score must explicitly rate physical embodiment as a blocker, and the composite must drop the keyword dimension (this analysis is the evidence for why).
- **DG3 acceptance target:** post-re-score composite reaches ρ ≥ 0.7 vs AIOE and OpenAI human β; the physical-occupation divergence list shrinks to near-empty. Re-run this script (it is deterministic) and update this document.
- **DG5 note:** archetype multipliers proved directionally right (they carry the displayed model from 0.29→0.46+); grounding them properly should come from the re-scored task blockers rather than the physical_ability_avg threshold.
