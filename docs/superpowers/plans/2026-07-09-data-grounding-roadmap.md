# Data Grounding Roadmap — Methodology v2

> **For agentic workers:** This is the MASTER ROADMAP for grounding Timeback's occupation data. It is not directly executable. At each sub-project's kickoff, write a detailed implementation plan for it (superpowers:writing-plans) using this document as the spec, then execute via subagent-driven-development. Sub-projects are labeled DG1–DG8 to avoid colliding with the Blueprint Light design track (SP1–SP4).

**Goal:** Make every number on timeback.clearroadlabs.com defensible to a skeptical stakeholder — the site is the front door for the consulting business, and the data must be grounded in cited sources, validated models, and eventually measured client outcomes.

**Context (state as of 2026-07-09):** The `worktree-calc-canonical` branch (6 commits, f52635b..e8f1504) consolidated all surfaces onto one canonical formula (`computeDisplayedTimeback(profile, tasks)` = `clamp(max(scaledTaskMinutes, profileHigh), 0, 180)`), removed fabricated inputs (unit bug, fake tasks, slug jitter, ×1.15 floor), and fixed the mechanical pipeline bugs. What remains — this roadmap — is the quality of the *inputs*: task scores are keyword-matching plus free 1–9B-LLM ratings, time assumptions are unsourced, and there is no external validation or provenance.

**Why this order:** DG1/DG2 are decision-free and start immediately. DG3→DG4→DG5 form the re-scoring chain and change public numbers, so they ship together with DG7 as one visible "methodology v2" release with a changelog — numbers must change once, loudly, not drift. DG6 runs alongside. DG8 begins with the first consulting engagement and never ends.

---

## Sub-project index

| ID | Name | Changes public numbers? | Blocked by | Damon decisions needed |
|----|------|------------------------|-----------|------------------------|
| DG1 | Benchmark vs published indices | No | — | None |
| DG2 | Wage completeness + BLS refresh | Dollar figures only | — | Confirm OEWS vintage to pin |
| DG3 | Task re-scoring with one strong model | Not until DG7 cutover | DG1 (informs priorities) | Model + budget approval |
| DG4 | Human validation set | No | DG3 | ~3–4 hrs of Damon labeling time |
| DG5 | Time model grounding | Not until DG7 cutover | DG3 | Recovery fractions; archetype multiplier set |
| DG6 | Provenance & versioning | No | — | None |
| DG7 | Methodology v2 release + honest display | **Yes — the release moment** | DG3, DG4, DG5, DG6 | Midpoint hero; range display; coordinate with design track |
| DG8 | Outcome measurement flywheel | Later (adds "measured" stats) | First engagement | Client data consent approach |

---

## DG1 — Benchmark the composite against published indices

**Why:** Converts "we made up the weights" into "our index correlates ρ=X with published research and diverges where we model task frequency." Cheapest credibility per hour in the whole roadmap. Also a diagnostic: big divergences locate the worst data before a customer does.

**Sources to correlate against (verify URLs at execution via web search — do not trust remembered links):**
1. **Felten, Raj & Seamans — AI Occupational Exposure (AIOE)**: occupation-level exposure scores by SOC code; dataset publicly released alongside the paper.
2. **Eloundou et al. (OpenAI), "GPTs are GPTs"**: occupation/task exposure ratings (human + model rubric) by SOC.
3. **Anthropic Economic Index**: real Claude conversation volume mapped to O*NET tasks/occupations (dataset on Hugging Face). Highest strategic value — it is *observed usage*, not prediction, and on-brand for the consulting pitch.
4. (Optional) Microsoft Research 2025 occupational AI applicability scores (Copilot usage), if downloadable.

**Approach:**
- Crosswalk each dataset's SOC codes to the `occupations` table (seeded from `bls_occupations.csv`; verify which SOC vintage our slugs derive from — AIOE uses SOC 2010, ours is likely SOC 2018; use the BLS crosswalk file if needed).
- Compute Spearman rank correlation of our `composite_score` (and separately our displayed minutes) against each index. Spearman, not Pearson — the claim is about ranking, and our score isn't interval-scaled.
- Produce: `docs/methodology/benchmarks.md` (tables + interpretation) and `data/benchmarks/correlations.json` (machine-readable, for the future methodology page).
- Report top-20 divergent occupations per index with a one-line hypothesis each.

**Deliverables:** correlation report committed; divergence list feeding DG3's rubric design.

**Gate:** if ρ < 0.5 against two or more indices, stop and review with Damon before publishing anything — that would mean the composite needs DG3 *before* it is marketable, and the methodology page copy must not overclaim.

**Effort:** ~1 session. No production code paths touched.

---

## DG2 — Wage completeness + BLS data refresh

**Why:** `lib/pricing.ts` still defaults missing wages to `$100/hr` (~3× median) and every dollar figure inherits that. BLS OEWS publishes mean/median wages for essentially every SOC code — there is no reason any occupation lacks a real wage.

**Approach:**
- Audit: count `occupations` rows with NULL `hourly_wage`/`annual_wage` and rows with stale employment counts.
- Download the latest OEWS national occupation file (May 2025 release expected current; pin the vintage Damon confirms).
- Backfill wages and employment via a new `scripts/import-oews-wages.ts` (follow `scripts/db.ts` helper conventions; two-writes-no-silent-failure per tech-decisions memory).
- Delete the `?? 100` fallback in `computeAnnualValue`/`computeROI` (`lib/pricing.ts:28,42`). Change signature to require a number; where wage is genuinely absent after backfill (should be ~zero rows), display no dollar figure rather than a fabricated one — callers already handle null-ish display paths.
- Record the wage vintage in the `data_versions` table and export a `WAGE_DATA_VINTAGE` constant (e.g. `"BLS OEWS May 2025"`) for provenance chips in DG7.

**Deliverables:** zero occupations with fabricated wages; fallback deleted; vintage recorded.

**Effort:** ~1 session. Changes dollar figures where the fallback previously applied — acceptable to ship quietly since it is a correction toward accuracy, not a methodology change.

---

## DG3 — Task re-scoring with one strong model

**Why:** The headline number is keyword-regex all the way down (`import-onet-tasks.py`: base 75, ±30/±20/+15 adjustments, substring matches like "log" in "geological"), and micro-task impact/effort ratings come from rotating free 1.2B–9B models with no validation. This is the load-bearing fix.

**Design decisions to put to Damon before kickoff:**
- **Model:** recommend `claude-sonnet-5` for the bulk pass (cost/quality balance) with a 5% spot-check subsample re-scored by a stronger model to measure headroom. Rough cost: ~12k O*NET tasks + ~10k micro-tasks × ~700 tokens/call ≈ low tens of dollars — confirm budget.
- **Rubric:** fixed prompt scoring each task on (a) AI automation potential 0–100 *today* with current frontier tools, (b) confidence, (c) primary blocker (physical / judgment / interpersonal / data-access), (d) recoverable-time share. Frozen prompt text stored in-repo; version hash recorded per row.

**Approach:**
- New columns on `onet_tasks` and `job_micro_tasks`: `ai_score_v2`, `score_confidence`, `score_blocker`, `scored_at`, `score_model_id`, `score_prompt_version`. Keep v1 columns untouched for A/B comparison.
- Batch scorer script with structured output (temperature 0, JSON schema enforced, retry on validation failure), checkpointed so it can resume — follow the existing `scripts/pipeline/` orchestrator patterns.
- **Kill the double-count:** the composite's keyword dimension (`scoring-methodology.json` keyword lists, weight 0.20) is replaced by the mean of v2 task scores. The same keyword lists must no longer feed both the composite AND the time-range thresholds.
- Comparison report: v1 vs v2 score distributions, biggest movers, correlation with DG1 benchmarks (v2 should correlate better — if it doesn't, the rubric needs revision before cutover).
- **No production cutover in DG3.** The site keeps reading v1 until DG7 flips it.

**Deliverables:** every task scored by one documented model+rubric; comparison report; composite v2 computed in parallel column.

**Effort:** ~2–3 sessions plus API runtime.

---

## DG4 — Human validation set + agreement stats

**Why:** "One good model with published human agreement beats seven free models with none." This is the sentence a skeptical buyer needs to hear, and it requires Damon's eyes on ~250 tasks.

**Approach:**
- Stratified sample: ~250 O*NET tasks across occupation major-category × v2-score quintile (25 cells, ~10 each).
- Labeling instrument: a CSV (or a 50-line local page, whichever Damon prefers) presenting task text and the same rubric the model saw; Damon labels automation potential on the same 0–100 scale (bucketed 0/25/50/75/100 is fine) blind to model scores.
- Compute: Spearman correlation and quadratic-weighted Cohen's κ between Damon and model; report per-category weak spots.
- Publish the protocol + numbers in `docs/methodology/validation.md`; they become the trust centerpiece of the DG7 methodology page.

**Gate:** κ < 0.4 or ρ < 0.6 → revise the DG3 rubric and re-run the disagreeing strata before cutover. Do not publish agreement stats that embarrass the model or skip publishing — either outcome forces a better rubric first.

**Effort:** ~1 session of tooling + 3–4 hours of Damon's labeling, doable in chunks.

---

## DG5 — Time model grounding

**Why:** The minutes math currently assumes an 8-hour day split *equally* across an occupation's tasks (480/n), applies unsourced 20%/35% recovery fractions, and forces a 5-minute floor and 90-minute cap (239 occupations pinned at 90; several pin at the 180 display cap today). This is what a diligent reviewer screenshots.

**Approach:**
- **Task weights:** import O*NET Task Ratings (importance, relevance, frequency categories — official files; `data/onet/` already holds related workbooks). Replace 480/n with importance-weighted time shares. Task frequency for micro-tasks switches from LLM-invented to O*NET frequency where mappable.
- **Recovery fractions:** anchor to published GenAI productivity studies (observed gains cluster ~15–35% across the RCT literature — Noy & Zhang, Brynjolfsson et al., METR; cite exact numbers in the methodology doc at execution time after verifying). Damon picks the conservative/optimistic pair from the cited range; the pair is stored in `scoring-methodology.json` with the citations inline.
- **Kill floors and caps:** occupations may honestly show 0 min/day (firefighters, dancers). Distribution validators (below) replace the caps as the guard against absurd outputs.
- **One archetype multiplier set:** move to `scoring-methodology.json`, consumed by both `calculate_time_ranges.py` and `lib/timeback.ts` (TS already imports JSON). Damon decides the values — the display set (0.58/0.82/1.0) and pipeline set (0.3/0.6/1.0) currently encode different assumptions.
- **Ranges as scenarios:** `time_range_low/high` become named scenario bounds ("conservative: X% recovery on tasks ≥ threshold; optimistic: Y%") instead of threshold arithmetic with cosmetic spreads. The frontend's fabricated per-task ±22% bands die in DG7 when real bounds exist.
- **Distribution validators** added to `scripts/pipeline/validators.py`: <5% of occupations at any bound; monotonicity spot-set (e.g. data-entry keyers > registered nurses > firefighters on automation share); DG1 benchmark correlation must not regress run-over-run.

**Deliverables:** regenerated `occupation_automation_profile` in parallel columns (v2), validators green, before/after distribution report.

**Effort:** ~2 sessions. No cutover until DG7.

---

## DG6 — Provenance & versioning end-to-end

**Why:** Tasks are currently scraped from onetonline.org HTML with fuzzy first-search-result matching — a mis-mapping risk and awkward to defend when official files exist. And no user-visible number carries its source version.

**Approach:**
- Replace the scraper (`scripts/import-onet-tasks.py`) with imports from official O*NET database files (Task Statements + Task Ratings; note `data/onet/Tasks_to_DWAs.xlsx` already exists). Match occupations by SOC code, never by title search. Record the O*NET release number.
- Wire the existing `data_versions` and `pipeline_runs` tables: every profile row gets `onet_release`, `methodology_version`, `scoring_config_hash` (hash of `scoring-methodology.json`), `score_model_id`, `computed_at`.
- Check O*NET licensing/attribution requirements (CC BY 4.0 with attribution — verify current terms) and add the required attribution line to the site footer content for DG7.
- Expose one internal endpoint or JSON export the methodology page can render: current versions of everything.

**Deliverables:** scraper retired; every number traceable to source version + config hash + model id.

**Effort:** ~1 session, parallel-safe with DG3–DG5.

---

## DG7 — Methodology v2 release + honest display

**Why:** This is the release moment where all parallel v2 columns cut over, numbers change once with a changelog, and the site gains the provenance UI. Coordinate the visual work with the design track (Blueprint Light) — DG7 supplies content and data plumbing; the design session owns look and feel.

**Scope:**
- **Cutover:** site reads v2 scores/ranges; v1 columns retained frozen for the changelog's before/after.
- **Hero becomes honest — and stays optimistic (Damon's positioning directive, 2026-07-09):** the voice sells opportunity, not an exposure study. Lead with the *labeled optimistic scenario* ("up to 68 min/day") backed by the documented optimistic bound from DG5, with the conservative bound and assumptions one click away — rather than a clinical midpoint-first framing. What may NOT return is fabricated optimism (max-of-estimates, ×1.15 bumps, fake tasks): optimism lives in scenario framing and copy, never in undocumented math. The canonical formula in `lib/timeback.ts` changes one final time, with the existing test suite updated to the new invariants. Note: fixing DG1's physical-occupation bias likely *raises* knowledge-work estimates (compensation specialists sit at our 1st percentile vs AIOE's 98th) — accuracy and optimism point the same direction for the actual customer base.
- **Kill remaining fabrications:** per-task ±22% display bands (`app/occupation/[slug]/page.tsx:97-98` and `app/build-a-team/page.tsx`) replaced by real scenario bounds from DG5.
- **/methodology page:** what we measure, sources (O*NET release, BLS OEWS vintage, model + prompt version), the actual formula in plain language, DG1 benchmark correlations, DG4 human-agreement stats, DG5 citations, known limitations. Every claim must match the code — that is the whole point.
- **Provenance chips:** "Modeled from O*NET 28.x tasks + BLS May 2025 wages · How we calculate this" under the hero; O*NET attribution in the footer.
- **Changelog entry:** public note that methodology v2 shipped and typical estimates changed, with one worked example.

**Gate:** Damon screenshot-approves the new numbers on 5 representative occupations before deploy (match the design track's gate cadence).

**Effort:** ~1–2 sessions after DG3–DG6 land.

---

## DG8 — Outcome measurement flywheel

**Why:** The unassailable answer to "how do you know?" is "we measured it at clients." No competitor scraping O*NET can match ground truth from real engagements. Starts with the first consulting client and compounds forever.

**Approach:**
- Schema: `engagement_outcomes` table — engagement id (anonymized client), occupation id, module/task, modeled minutes/day at proposal time (snapshot, not live-computed — the model will keep changing), measured minutes/day after implementation, measurement method (time study / self-report / system logs), measured_at.
- Capture: lightweight entry script (`scripts/record-outcome.ts`) run at each engagement review; the PDF/proposal generation snapshots its modeled numbers into the table automatically at send time.
- Consent: one clause in the engagement agreement permitting anonymized aggregate use. Damon decides wording with whatever legal review he uses.
- Publishing threshold: at n≥10 task-level measurements, add "modeled vs measured" to the methodology page (e.g. "across early engagements, measured savings ran 70–110% of modeled"). Never publish with n small enough to identify a client.

**Effort:** ~half a session of tooling now; the value accrues per engagement.

---

## Sequencing at a glance

```
now ──► DG1 (benchmarks) ──┐
        DG2 (wages)        ├──► DG3 (re-score) ──► DG4 (validate) ──► DG5 (time model) ──► DG7 (v2 RELEASE)
        DG6 (provenance) ──┘                                                                 ▲
        DG8 tooling (anytime; data starts with first client) ────────────────────────────────┘ (content inputs)
```

- **Quiet releases:** DG2 (wage corrections), DG6 (provenance plumbing), DG8 tooling.
- **The loud release:** DG7 bundles every number-changing decision (v2 scores, grounded time model, midpoint hero) into one changelog moment.
- **Damon's decision queue, in the order they'll be needed:** (1) OEWS vintage [DG2], (2) model + budget [DG3], (3) labeling time commitment [DG4], (4) recovery-fraction pair + archetype multiplier set [DG5], (5) midpoint hero + range display [DG7], (6) client consent wording [DG8].

## Out of scope for this roadmap

- Visual design of the methodology page and provenance chips (design track owns it).
- Retiring the decompose/aggregate micro-skill branch and dropping the orphaned `occupation_browse_metrics` table — flagged ops cleanups, not data grounding.
- Real-time model-capability tracking (re-run DG3 quarterly instead; the provenance stamps make staleness visible).
