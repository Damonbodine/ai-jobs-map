# AI Jobs Map Go-To-Market Funnel Plan

## Objective

Turn the current application into a focused commercial funnel that:

1. helps a person quickly understand how much routine time their role could recover with AI support,
2. translates that insight into a clear product recommendation, and
3. converts interest into a qualified conversation or scoped build.

This plan assumes the winning narrative is:

`Role-based time-back insight -> recommended product -> lightweight qualification -> sales conversation`

Not:

`data exploration -> deep analysis -> internal tooling catalog -> custom configuration`

---

## Core Strategic Decision

The company is not primarily selling a map, a builder, or a marketplace.

It is selling a simple commercial promise:

**We identify where time is being lost in a role, then package AI support around the routines most worth removing.**

That means the product experience needs to be reorganized around one buyer journey:

1. **Discover** time-back potential
2. **Understand** where that time goes
3. **See** the best starting product
4. **Raise hand** for a recommendation or build

---

## Current Problems

### 1. The site has multiple competing product stories

- `/ai-jobs` acts like a search tool and a category browser
- occupation pages act like dense analytical reports
- `/factory` acts like a guided intake form
- `/factory/marketplace` acts like a workflow and package catalog

Each of these is reasonable in isolation, but together they create confusion about what the company actually sells.

### 2. The commercial bridge is underdefined

Users can see a role-level estimate, but the next step is not yet obvious:

- Are they buying an assistant?
- Are they buying a workflow?
- Are they buying a services engagement?
- Are they buying software plus implementation?

This ambiguity weakens conversion.

### 3. The product surfaces are out of sequence

The current flow exposes too much detail before the offer is simple.

Users should first understand:

- what problem you solve,
- what outcome they can expect,
- what package is right for them.

Only later should they see catalog depth, blueprint logic, or implementation structure.

### 4. The visual language splits in two

The `AI Jobs Map` experience communicates calm, editorial, and insight-first value.

The `Factory/Marketplace` experience communicates a much more technical, system-heavy, catalog-like product.

That makes the app feel like two businesses stitched together.

---

## Target End State

The application should behave like a coherent funnel with four layers.

### Layer 1: Discovery

**Primary route:** `/ai-jobs`

Purpose:

- capture attention,
- let someone search their role,
- immediately frame value as minutes recovered per day.

### Layer 2: Diagnosis

**Primary route:** `/ai-jobs/[slug]`

Purpose:

- reveal the role-specific number,
- explain the top routines driving that opportunity,
- recommend the best starting product.

### Layer 3: Commercial Packaging

**Primary route:** `/products`

Purpose:

- explain what you actually sell,
- package the work into 3 clear offers,
- connect role-level insights to commercial offerings.

### Layer 4: Qualification

**Primary route:** `/factory`

Purpose:

- collect only the information needed to follow up with a tailored recommendation,
- confirm role, package fit, systems, and contact info,
- feel like a guided handoff, not software configuration.

### Deferred / Secondary Layer

**Secondary route:** `/factory/marketplace`

Purpose:

- support deeper exploration later,
- help internal demos, advanced buyers, and future packaging strategy,
- remain de-emphasized until the main funnel is converting.

---

## Information Architecture

### Primary navigation

Top nav should become:

- `Map`
- `Products`
- `About`

Optional later:

- `Browse`

`Browse` should not dominate the primary nav if the main GTM motion is search-first.

### Primary conversion path

The main user path should be:

1. Search role
2. See time-back estimate
3. See top 3 routines
4. See recommended starting package
5. Click to `Products` or `Get your plan`
6. Complete lightweight qualification form

### Secondary paths

- browse occupations
- read methodology
- explore marketplace
- inspect deeper blueprint details

These paths are useful, but they should not compete with the primary commercial path.

---

## Product Packaging Strategy

The product catalog should be intentionally small.

### Product 1: Starter Assistant

For:

- one role,
- one main recurring pain point,
- one clear wedge into time-back.

Best for:

- solo operators,
- managers testing the category,
- teams wanting a first deployment.

Commercial promise:

- reduce one painful routine cluster,
- prove value quickly,
- establish trust.

### Product 2: Workflow Bundle

For:

- teams with several linked routines,
- cross-functional processes like intake, coordination, reporting, follow-up.

Best for:

- operational teams,
- department heads,
- organizations with moderate system complexity.

Commercial promise:

- connect multiple routine bottlenecks,
- recover meaningful daily time across a workflow,
- create a stronger operational lift.

### Product 3: Ops Layer

For:

- higher-complexity organizations,
- multi-system processes,
- exception handling, approvals, governance, and support needs.

Best for:

- mature teams,
- heavier process environments,
- buyers who need confidence around operational risk.

Commercial promise:

- durable operating layer for AI support,
- broader workflow coverage,
- managed implementation and oversight.

---

## Phase Plan

## Phase 0: Narrative Lock

### Goal

Lock the commercial story before additional design or engineering work expands scope.

### Outcomes

- one sentence company explanation
- one sentence homepage explanation
- one sentence occupation-page CTA explanation
- one sentence explanation for each package

### Deliverables

- messaging brief
- navigation decision
- package naming decision
- CTA language decision

### Key decisions to finalize

- Are you positioning this as software, implementation, or a hybrid?
- Is the primary conversion goal a demo, a contact request, or a scoped recommendation?
- Do you want price transparency on `/products`, or “contact for scoping”?

### Exit criteria

You can explain the company in 20 seconds without mentioning “marketplace,” “blueprints,” or internal taxonomy.

---

## Phase 1: Simplify the Top of Funnel

### Goal

Make the `AI Jobs Map` side of the product feel immediate, legible, and conversion-oriented.

### Workstreams

#### 1. Landing page simplification

Change `/ai-jobs` into a true search-first landing page.

Keep:

- headline
- subline
- search bar
- autocomplete
- quick-start examples
- quiet proof line

Move off this page:

- category grid
- heavy exploration behavior

#### 2. Occupation page restructuring

Restructure `/ai-jobs/[slug]` into a three-beat page:

1. the reveal
2. what is eating time
3. best place to start

Move secondary material below the fold into collapsed sections:

- methodology
- day architecture
- evidence
- human edge
- upskilling

#### 3. Browse page simplification

Make `/ai-jobs/browse` the place for exploration.

Keep:

- search
- category filter
- pagination

Simplify cards to:

- role name
- category
- one time-back number

Remove unnecessary visual and conceptual noise.

### Deliverables

- cleaner landing page
- clearer occupation page
- simplified browse page

### Exit criteria

A first-time visitor can understand the value proposition in under 10 seconds and move from search to recommended next step without confusion.

---

## Phase 2: Build the Commercial Bridge

### Goal

Create the missing layer between role insight and contact capture.

### Main deliverable

New `/products` page.

### What `/products` must do

- define what the company sells
- present 3 package tiers
- explain who each package is for
- explain expected type of time-back
- explain what implementation includes
- show how a role insight connects to a package

### Recommended sections

1. Hero
Purpose:
Explain the product in plain language.

2. How it works
Purpose:
Show: identify routine drag -> package support -> implement -> recover time.

3. Three product cards
Purpose:
Show `Starter Assistant`, `Workflow Bundle`, and `Ops Layer`.

4. Role examples
Purpose:
Translate abstract packaging into concrete examples by occupation.

5. Engagement model
Purpose:
Explain what happens after someone raises their hand.

6. CTA section
Purpose:
Send qualified users to `/factory`.

### CTA changes from occupation pages

Occupation pages should stop sending users into a generic “get started” experience.

Instead, they should say something like:

- `See the best starting package`
- `Get a plan for this role`
- `Talk through your workflow`

### Exit criteria

Someone who sees a role page can answer:

- what the company sells,
- which package is probably right,
- what happens next if they engage.

---

## Phase 3: Reposition the Factory

### Goal

Turn `/factory` into a qualification and recommendation flow, not a product explanation layer.

### Strategic change

The factory should no longer feel like the user is designing automation software.

It should feel like:

- confirming fit,
- clarifying context,
- helping your team scope the right engagement.

### Recommended flow

#### Step 1: Confirm role and recommendation

Show:

- detected role or selected role
- recommended package
- expected time-back range

#### Step 2: Confirm systems and constraints

Ask:

- what tools they use
- whether they need approvals or human review
- team size or environment context if relevant

#### Step 3: Clarify important routines

Allow:

- selection of major pain areas
- short freeform notes

#### Step 4: Contact and handoff

Collect:

- name
- email
- optional company
- optional timeline / urgency

### What to remove or de-emphasize

- anything that implies the buyer must compose the architecture themselves
- excessive block-level or agent-level configuration
- internal implementation framing too early in the flow

### Exit criteria

The user feels they are requesting a tailored recommendation, not operating an unfinished product builder.

---

## Phase 4: De-emphasize the Marketplace Until It Earns Its Place

### Goal

Prevent the marketplace from diluting the main GTM story.

### Options

#### Option A: Hide from primary navigation

Best short-term choice.

#### Option B: Reframe as “catalog” or “capabilities library”

Use only for advanced buyers and demos.

#### Option C: Keep internal-only for now

Use for team demos, packaging development, and future product maturity.

### Why this matters

The current marketplace introduces:

- too many SKUs,
- too much technical framing,
- too much visual divergence,
- too much decision load.

That is useful later, but harmful if shown too early in the funnel.

### Exit criteria

No primary user is forced into the marketplace to understand the offer.

---

## Phase 5: Add Trust and Conversion Infrastructure

### Goal

Support launch readiness without expanding product complexity.

### Must-have trust additions

#### 1. Methodology trust

Keep methodology, but collapse it by default.

Users need:

- enough confidence that the estimate is grounded,
- not a research paper before they care.

#### 2. Delivery trust

Add language explaining:

- what gets built,
- how long a first engagement usually takes,
- where human review stays involved.

#### 3. Proof and examples

Add:

- example occupations
- example before/after workflows
- small case-style narratives as they become available

### Must-have operational additions

- event tracking for funnel stages
- CTA click tracking
- occupation-to-contact conversion tracking
- package-interest tracking

### Exit criteria

You can measure:

- landing search rate
- occupation page engagement
- package click-through
- factory completion rate
- qualified lead rate

---

## Phase 6: Launch Readiness

### Goal

Ship a coherent version that is credible enough for real external conversations.

### Launch checklist

- landing is search-first
- occupation page is simplified
- products page exists
- factory is qualification-first
- marketplace is de-emphasized
- messaging is consistent across all routes
- nav reflects the commercial journey
- funnel analytics are live
- mobile experience is acceptable on core routes

### Launch standard

The site is ready when a new user can:

1. find their role,
2. understand the time-back opportunity,
3. understand what the company sells,
4. choose a likely package,
5. request a tailored plan.

If that sequence is smooth, the product is ready for market testing even if deeper surfaces remain unfinished.

---

## Prioritization

### Highest priority

1. Phase 0 narrative lock
2. Phase 1 top-of-funnel simplification
3. Phase 2 `/products` page
4. Phase 3 factory repositioning

### Medium priority

5. Phase 5 trust and analytics

### Lower priority for launch

6. Phase 4 marketplace refinement
7. additional blueprint sophistication
8. deeper package catalog expansion

---

## Recommended Immediate Build Order

If implementation starts now, the order should be:

1. finalize package names and CTA language
2. update header/navigation
3. simplify landing page
4. simplify occupation page
5. simplify browse page
6. create `/products`
7. rework `/factory`
8. remove marketplace from the main path
9. add funnel tracking

---

## Success Metrics

The plan is working if you see improvement in:

- search-to-occupation click-through
- occupation-to-product click-through
- product-to-factory conversion
- factory completion rate
- qualified conversations booked

Secondary indicators:

- lower bounce on landing
- lower bounce on occupation pages
- more direct understanding in user interviews of “what the company sells”

---

## Final Principle

The application should make one promise clearly:

**Show me where my role is losing time, then help me buy the right AI support to get some of it back.**

Anything that does not strengthen that sequence should be postponed, hidden, collapsed, or removed from the primary path.
