# Task AI-Automation Scoring Rubric — v2.0 (frozen 2026-07-09)

You are scoring work tasks for how much of each task current frontier AI (large language models with tool use, plus standard software integrations) can perform TODAY. Score the task as performed in its real occupational context, not a hypothetical digitized version of it.

For each task, output four fields:

## score (integer 0–100)

How much of the task's total execution AI can perform or draft end-to-end today.

- **90–100** — AI performs the task end-to-end with negligible human involvement: transcription, data entry from digital sources, format conversion, routine lookups, boilerplate generation.
- **70–89** — AI produces a complete draft or output; a human reviews and approves: reports, standard correspondence, routine analysis, documentation, scheduling.
- **40–69** — AI meaningfully accelerates parts of the task, but a human performs substantial portions: analysis requiring situational judgment, planning with stakeholder tradeoffs, novel problem-solving with AI assistance.
- **10–39** — AI helps only at the margins, e.g. the paperwork around a task whose core is physical or interpersonal.
- **0–9** — essentially no AI leverage: physical execution, hands-on care or repair, required in-person presence.

**HARD RULE — physical embodiment dominates.** If executing the task requires physical manipulation, bodily presence, machine operation, or hands-on interaction with people or materials, score ONLY the digitizable slice of the task. A task whose core is physical execution scores ≤15 even when its description is full of words like "check," "sort," "load," "measure," "monitor," or "inspect" — in physical contexts those verbs describe physical acts, not information work. "Load trucks" is not automatable by a language model; "log what was loaded" is.

## blocker (enum)

The PRIMARY reason the score is not higher:

- `physical` — requires body, hands, presence, or equipment operation
- `interpersonal` — requires live human relationship, trust, persuasion, or care
- `judgment` — requires accountable human decision-making, ethics, or expert liability
- `data_access` — AI could do it but the inputs/systems are not digitally accessible today
- `none` — nothing material blocks; the score is already high

## recoverable_share (number 0–1)

Of the time a worker currently spends on this task, the fraction realistically recoverable with a well-implemented AI assist today, after accounting for review/approval time. This is usually LOWER than score/100 (review takes time; edge cases remain human). A score-85 drafting task might recover 0.5–0.65. A score-10 physical task recovers ≤0.05.

## confidence (enum: low | medium | high)

Your confidence in the score given the task text. Use `low` when the text is ambiguous about context or physicality.

## Output format

Output ONLY a JSON array, one object per input task, preserving the input order and ids exactly:

```json
[{"id": 123, "kind": "onet", "score": 72, "blocker": "judgment", "recoverable_share": 0.45, "confidence": "high"}, ...]
```

No commentary, no markdown fences, no omitted or added ids.
