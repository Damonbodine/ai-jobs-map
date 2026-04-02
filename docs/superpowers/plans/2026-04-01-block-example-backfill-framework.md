# Block Example Backfill Framework

## Goal

Fill empty or thin work-area cards on occupation pages with believable, occupation-specific example routines.

This is not a new product feature. It is a derivation layer that turns the data already in the database into better display-ready examples for:

- `Intake`
- `Analysis`
- `Documentation`
- `Coordination`
- `Exceptions`
- `Research`
- `Compliance`
- `Communication`
- `Data & Reporting`
- `Learning`

The outcome should be:

- every visible work-area estimate has 2 to 4 example routines when possible
- the examples are grounded in role-specific source data
- the UI no longer shows empty estimated blocks like `Exceptions 10–15 min` with no supporting routines underneath

## Why This Matters

Right now the pages can calculate minutes by work area, but the evidence layer is inconsistent.

Typical failure mode:

- a block has enough signal to earn a time range
- the page can render the block estimate
- but there are not enough visible `job_micro_tasks` attached to that block
- the block card appears empty or under-explained

That makes the recommendation feel less trustworthy even when the estimate is directionally correct.

## Current Data Sources

There is enough data in the current database to support this backfill.

### Strongest sources

- `job_micro_tasks`
  - best source for UI-ready routines
  - already has:
    - `task_name`
    - `task_description`
    - `frequency`
    - `ai_applicable`
    - `ai_category`
    - `ai_impact_level`
    - `ai_effort_to_implement`
    - `ai_how_it_helps`

- `onet_tasks`
  - good source for role-specific task statements
  - broadest occupation coverage
  - useful when `job_micro_tasks` are sparse

- `detailed_work_activities`
  - useful for more specific routine patterns
  - stronger than generic O*NET work activity labels

- `tasks_to_dwas`
  - useful bridge between `onet_tasks` and `detailed_work_activities`

- `onet_work_activities`
  - useful as a fallback vocabulary and grouping signal

### Existing derived layer

- `occupation_automation_profile.time_range_by_block`
  - already gives block-level ranges
  - can be used as the target block structure we need to populate with examples

## Backfill Strategy

Use a tiered fallback system.

### Tier 1: Microtask-first

For each occupation and block:

1. Start with `job_micro_tasks`
2. Keep only `ai_applicable = true`
3. Map each task into a work area using:
   - explicit `ai_category`
   - task-name cues
   - task-description cues
4. Rank tasks inside each block by:
   - estimated minute contribution
   - `ai_impact_level`
   - frequency
5. Select the best 2 to 4 tasks for display

This should remain the preferred source because it is already phrased for UI consumption.

### Tier 2: O*NET task enrichment

If a block has minutes but fewer than 2 visible tasks from microtasks:

1. Pull `onet_tasks` for the occupation
2. Map those tasks to blocks using the same block taxonomy
3. Score them using:
   - automation score
   - keyword fit to the block
   - connection to existing high-signal microtasks if available
4. Take the best 1 to 3 candidates to fill the gap

These will often need light normalization for UI use.

### Tier 3: Detailed work activity enrichment

If the block is still thin:

1. Pull linked `detailed_work_activities`
2. Use `tasks_to_dwas` if available to connect occupation tasks to DWAs
3. Normalize the DWA labels into display-ready routines
4. Use them as block examples

This is especially useful for:

- `Exceptions`
- `Compliance`
- `Research`
- `Coordination`

### Tier 4: Work-activity fallback

If the block still has minutes but no usable examples:

1. Use `onet_work_activities`
2. Map activity labels into the closest work area
3. Turn the best activity into a simpler display phrase

This should be the weakest fallback, but it is still better than showing an empty block.

## Display Model

The page should not derive this live every render forever.

We should create a derived display layer for each occupation.

### Recommended shape

Store per occupation, per block:

```json
{
  "documentation": {
    "examples": [
      {
        "title": "Review aircraft maintenance logs",
        "source": "microtask",
        "confidence": 0.92,
        "estimated_minutes": 6
      },
      {
        "title": "Record pilot performance metrics",
        "source": "microtask",
        "confidence": 0.88,
        "estimated_minutes": 4
      },
      {
        "title": "Analyze fuel consumption reports",
        "source": "onet_task",
        "confidence": 0.71,
        "estimated_minutes": 3
      }
    ]
  }
}
```

### Storage options

Preferred:

- add a JSON column to `occupation_automation_profile`
  - e.g. `block_example_tasks`

Alternative:

- create a new table:
  - `occupation_block_examples`

For speed and portability, JSON on `occupation_automation_profile` is probably enough for now.

## Mapping Rules

The block mapping should not rely on `ai_category` alone.

Some tasks are currently misclassified because broad categories are too coarse.

### Priority order

1. explicit title/description cues
2. explicit `ai_category`
3. O*NET task keywords
4. DWA / work-activity fallback

### Examples

- `Update crew schedules` -> `Coordination`
- `Review aircraft maintenance logs` -> `Documentation`
- `Maintain communication logs` -> `Documentation` or `Communication`
  - prefer `Documentation` if logging/records dominates
- `Perform flight plan verification` -> `Analysis` or `Compliance`
  - prefer `Analysis` if framed as route/review prep
  - prefer `Compliance` if framed as rule verification
- `Assist in emergency response` -> `Exceptions`

## Ranking Logic

Each candidate routine should receive a score.

### Proposed score

```text
display_score =
  source_weight
  + frequency_weight
  + impact_weight
  + block_keyword_fit
  + minute_contribution_weight
```

### Suggested weights

- source weight
  - microtask: `1.0`
  - onet_task: `0.75`
  - detailed_work_activity: `0.6`
  - work_activity: `0.45`

- frequency weight
  - daily: highest
  - weekly: medium
  - monthly / as-needed: lower

- impact weight
  - use `ai_impact_level` when present
  - otherwise use automation score proxy from O*NET

- block keyword fit
  - strong positive score when the text clearly matches the target block

- minute contribution
  - prefer tasks that contribute materially to the displayed block total

## Minimum Block Coverage Rules

For any block shown on the page:

- target `2 to 4` example routines
- minimum acceptable:
  - `1` example if the block range is very small
- preferred:
  - at least `2` examples for all blocks above `8 min/day`

If a block has `>= 8 min/day` and still no examples after fallback, flag it for manual review.

## UI Rules

The UI should show example tasks only for the most relevant blocks.

### Recommended behavior

- show all block chips at top
- show expanded example-task cards only for the top `2` to `3` blocks
- if a block has no examples, do not render an empty expanded card
- only show blocks with examples in the expanded example row

This avoids the current empty-card problem while preserving the full range view.

## QA Rules

The backfill should be validated by occupation samples, not just row counts.

### Sample set

Review at least:

- one office-heavy role
- one healthcare role
- one field/service role
- one operations/management role
- one transportation role
- one education role
- one legal/finance role

### Example occupations

- `commercial-pilots`
- `air-traffic-controllers`
- `registered-nurses`
- `construction-managers`
- `electricians`
- `accountants-and-auditors`
- `paralegals-and-legal-assistants`

### QA questions

- does each visible block have believable example tasks?
- do tasks feel specific to the occupation?
- do block labels match the tasks under them?
- do empty cards disappear?
- does the recommendation narrative align with the strongest visible block?

## Implementation Plan

### Phase 1: Audit

1. Identify occupations where:
   - block ranges exist
   - but visible example tasks per block are fewer than 2
2. Rank those occupations by severity

### Phase 2: Derivation

1. Build a derivation script that:
   - computes per-block examples from microtasks first
   - falls back to O*NET tasks, DWAs, and work activities
2. Output preview JSON for sampled occupations

### Phase 3: Persistence

1. Persist the results to:
   - `occupation_automation_profile.block_example_tasks`
   - or a dedicated derived table

### Phase 4: UI wiring

1. Update occupation pages to:
   - read block examples from the derived layer
   - only render expanded example cards for blocks with examples
   - keep chip ranges for all blocks

### Phase 5: Calibration

1. Review sampled occupations
2. Adjust keyword/block mapping
3. Adjust scoring rules
4. Repeat until top blocks feel role-native

## Immediate Recommendation

Do not hand-curate these empty blocks one by one.

Instead:

1. create a derived `block example tasks` layer
2. use existing source tables to fill it
3. let the UI read from that layer consistently

That gives us:

- better occupation pages
- fewer empty work-area panels
- cleaner recommendations
- a scalable path for the whole catalog

