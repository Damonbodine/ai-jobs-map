# Benchmark dataset sources (downloaded 2026-07-09)

| File | Source | Citation |
|------|--------|----------|
| `AIOE_DataAppendix.xlsx` | https://github.com/AIOE-Data/AIOE (raw main branch) | Felten E, Raj M, Seamans R (2021). "Occupational, industry, and geographic exposure to artificial intelligence: A novel dataset and its potential uses." *Strategic Management Journal* 42(12):2195–2217. |
| `openai_occ_level.csv` | https://github.com/openai/GPTs-are-GPTs `data/occ_level.csv` | Eloundou T, Manning S, Mishkin P, Rock D (2024). "GPTs are GPTs: Labor market impact potential of LLMs." *Science* 384. `*_beta` columns = exposure counting full LLM-plus-tools potential at half weight (paper's headline measure). |
| `aei_task_pct_v2.csv`, `aei_onet_task_statements.csv`, `aei_SOC_Structure.csv` | https://huggingface.co/datasets/Anthropic/EconomicIndex `release_2025_03_27/` (CC-BY-4.0) | Anthropic Economic Index (2025 release). Task-level share of real Claude conversations mapped to O*NET task statements. |

Notes:
- AEI `task_pct_v2.csv` keys on lowercased task text; join to `aei_onet_task_statements.csv` (Task column, lowercased) to reach O*NET-SOC codes, then aggregate to occupation level.
- Our scores export: `../our_scores.csv` from `scripts/benchmarks/export-our-scores.ts` (SOC derived by majority vote over onet_tasks; see soc_confidence column).
