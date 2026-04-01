# Actionable Recommendation Framework

## Purpose

The current occupation pages do a good job identifying where time can be recovered, but they are still one layer too abstract for many buyers.

Users can understand:

- `this role has recoverable time`
- `these routines create drag`

But they do not always understand:

- `what specific support system fits this role`
- `what the system would actually do inside the workday`
- `why this recommendation is right for this job rather than a different one`

This framework defines the next recommendation layer so the product can move from time-back analysis into practical, role-shaped advice.

The goal is not to explain AI. The goal is to explain how the day changes.

## Strategic Shift

Move from:

- `occupation -> minutes saved -> package`

To:

- `occupation -> recurring work blocks -> pain patterns -> support-system recommendation -> package`

This gives the recommendation layer more operational specificity and makes the advice feel believable to low-information buyers.

## Core Principle

Recommendations should describe:

1. what enters the workflow
2. what repetitive work slows the role down
3. what support system handles in the background
4. what the human still owns
5. what time comes back

The recommendation should not lead with:

- AI agent
- automation
- orchestration
- model
- technical configuration

It should lead with:

- scheduling support
- estimate prep
- follow-up support
- documentation support
- status update support
- exception review

## New Recommendation Layers

### 1. Workflow Surface

Define where work begins for a role.

Examples:

- inbox
- phone or text
- calendar
- work order queue
- CRM
- spreadsheet
- job intake form
- dispatch board
- document folder

Why it matters:

- tells the user where the system “lives”
- makes the recommendation operational instead of abstract
- helps later with product packaging and implementation scoping

### 2. Deliverable Layer

Define what the role repeatedly produces.

Examples:

- proposals
- estimates
- schedules
- reports
- invoices
- customer updates
- notes
- documentation packets
- compliance logs

Why it matters:

- helps name the support system in plain English
- turns “help with tasks” into “help with outputs”

### 3. Trigger Layer

Define what event causes work to start or move.

Examples:

- new inquiry arrives
- appointment changes
- estimate requested
- missing information detected
- deadline approaching
- status change
- exception flagged
- document requested

Why it matters:

- supports clear before/after explanations
- makes recommendations feel like working systems rather than static tools

### 4. Handoff Layer

Define who receives or acts on the next step.

Examples:

- customer
- project manager
- office coordinator
- field technician
- supervisor
- client
- compliance reviewer
- finance team

Why it matters:

- lets us explain what the system prepares versus what the human decides
- improves credibility around “human stays in control”

### 5. Work Environment Layer

Define the operating environment of the role.

Examples:

- office-based
- field-based
- hybrid
- customer-facing
- internal-facing
- solo
- team-based
- regulated
- high-volume
- high-complexity

Why it matters:

- affects which support system should come first
- distinguishes similar roles with different operational needs

### 6. Pain Pattern Layer

Define the business friction the user actually feels.

Examples:

- scheduling chaos
- slow follow-up
- estimate turnaround
- documentation backlog
- status chasing
- fragmented intake
- repetitive reporting
- compliance admin
- missed handoffs

Why it matters:

- turns recommendations into business advice
- gives the site a stronger go-to-market language layer

## Support-System Archetypes

These are the recommendation archetypes the app should map roles into.

Each archetype is intentionally phrased as job support, not AI terminology.

### 1. Scheduling Support

Best for roles where the friction is calendar movement, appointment setting, rescheduling, and availability coordination.

Typical signals:

- frequent calendar tasks
- customer appointment changes
- dispatch or crew coordination
- follow-up reminders

What it does:

- keeps appointments moving
- handles scheduling logistics
- prepares reminders and updates
- flags conflicts and gaps

Human still owns:

- final schedule decisions
- exception handling
- customer relationships

### 2. Intake and Triage Support

Best for roles where work begins in a messy stream of requests and information.

Typical signals:

- high inbound volume
- fragmented requests
- incomplete requests
- early sorting and prioritization work

What it does:

- organizes incoming work
- pulls key details into one place
- drafts the next step
- routes work to the right person

Human still owns:

- final prioritization
- sensitive requests
- escalation decisions

### 3. Estimate and Proposal Support

Best for roles that repeatedly turn project details into quotes, scopes, proposals, or planning documents.

Typical signals:

- recurring quote prep
- proposal drafting
- scope writing
- pricing inputs
- approval handoffs

What it does:

- organizes job details
- prepares estimate drafts
- assembles proposal language
- keeps follow-up moving

Human still owns:

- pricing approval
- judgment on scope
- client negotiation

### 4. Documentation Support

Best for roles with recurring notes, reports, records, summaries, or compliance paperwork.

Typical signals:

- repeated report generation
- record updates
- documentation backlog
- administrative note-taking

What it does:

- drafts recurring documentation
- structures notes and summaries
- updates records
- prepares packets for review

Human still owns:

- sign-off
- sensitive edits
- final accountability

### 5. Follow-Through Support

Best for roles where work stalls because reminders, updates, and handoffs happen manually.

Typical signals:

- many open loops
- missed follow-ups
- customer update work
- internal status chasing

What it does:

- tracks open items
- prepares follow-up messages
- prompts the next action
- keeps work from going stale

Human still owns:

- relationship management
- exception handling
- priority changes

### 6. Status and Reporting Support

Best for roles that repeatedly gather updates, summarize progress, and communicate state.

Typical signals:

- recurring status updates
- KPI and reporting work
- project summaries
- dashboard prep

What it does:

- gathers the latest information
- prepares summaries
- drafts status outputs
- flags changes that need review

Human still owns:

- interpretation
- stakeholder nuance
- final communication

### 7. Exception Review Support

Best for roles where most of the work is routine but some items require careful human review.

Typical signals:

- auditing
- compliance checks
- anomaly handling
- approval gating
- quality review

What it does:

- scans for issues
- highlights unusual cases
- prepares review packets
- reduces manual checking

Human still owns:

- decisions
- approvals
- edge cases

## Mapping Logic

Each occupation should map into one primary support-system archetype and optionally one secondary archetype.

### Inputs We Already Have

- occupation title
- major category
- micro-tasks
- AI categories
- task descriptions
- task frequencies
- impact and effort fields
- inferred work blocks
- O*NET enrichment

### New Derived Fields We Should Add

- workflow surface tags
- deliverable tags
- trigger tags
- handoff tags
- environment tags
- pain pattern tags

### Recommendation Rule Shape

1. score current tasks into work blocks
2. score work blocks into pain patterns
3. score pain patterns into support-system archetypes
4. choose the top primary archetype
5. optionally choose one secondary archetype if the score is close enough
6. generate role-specific copy from the archetype plus role context

## Example Role Mappings

### Electrician

Likely primary recommendation:

- Scheduling Support

Likely secondary recommendation:

- Estimate and Proposal Support

Likely pain patterns:

- appointment changes
- crew coordination
- quote turnaround
- customer follow-up
- job-detail handoffs

How the recommendation should read:

- keep appointments and job scheduling moving
- prepare estimate drafts from incoming job details
- follow up on open quotes and missing information

### Project Manager

Likely primary recommendation:

- Status and Reporting Support

Likely secondary recommendation:

- Follow-Through Support

Likely pain patterns:

- status chasing
- update drafting
- meeting follow-up
- stakeholder communication

How the recommendation should read:

- gather updates automatically
- draft status summaries
- keep actions and follow-ups moving after meetings

### Accountant

Likely primary recommendation:

- Documentation Support

Likely secondary recommendation:

- Exception Review Support

Likely pain patterns:

- recurring reports
- reconciliation review
- records maintenance
- audit prep

How the recommendation should read:

- prepare recurring reports
- structure supporting records
- surface exceptions that need judgment

### Registered Nurse

Likely primary recommendation:

- Documentation Support

Likely secondary recommendation:

- Follow-Through Support

Likely pain patterns:

- note burden
- documentation backlog
- coordination overhead
- follow-up friction

How the recommendation should read:

- lighten documentation work
- organize follow-through tasks
- keep the day moving without taking judgment away from care

### Paralegal

Likely primary recommendation:

- Intake and Triage Support

Likely secondary recommendation:

- Documentation Support

Likely pain patterns:

- document collection
- client follow-up
- matter intake
- drafting prep

How the recommendation should read:

- organize incoming matter details
- prepare documentation packets
- keep client and team follow-up moving

## UX Implications

This framework should change how occupation advice is presented.

### Current State

- time-back number
- routines
- package recommendation

### Proposed State

- time-back number
- `here’s how your day changes`
- `best place to start`
- `what this support system handles`
- `what still stays with you`
- `why this is the right fit for this role`

## Content Pattern For Occupation Pages

Recommended section structure:

### 1. Best Place To Start

Example:

- `Start with scheduling support`

### 2. Here’s How Your Day Changes

Plain-language before/after:

- before: chasing schedules, answering repeat questions, updating customers manually
- after: requests get organized, the next step is prepared, and you only step in where judgment matters

### 3. What It Handles

Short checklist:

- incoming requests
- estimate prep
- appointment changes
- follow-up reminders

### 4. What Stays With You

Short checklist:

- final decisions
- customer conversations
- scope changes
- exceptions

### 5. Why This Fits The Role

Reference the pain pattern in plain English:

- this role loses time in scheduling, quote prep, and follow-through more than in the core hands-on work

## Product Page Implications

The product page should not just show package tiers.

It should also show support-system patterns users can recognize:

- scheduling support
- follow-through support
- reporting support
- documentation support
- intake support

This is likely the clearest bridge between the role pages and the product page.

## Implementation Plan

### Phase 1: Recommendation Taxonomy

- define final support-system archetypes
- define pain-pattern taxonomy
- define allowed tags for workflow surface, deliverable, trigger, handoff, and environment

### Phase 2: Mapping Layer

- add derived mapping rules from current task and O*NET data
- create a role-to-archetype scoring layer
- generate primary and secondary support-system recommendations

### Phase 3: Copy Layer

- create role-aware plain-language recommendation templates
- build “here’s how your day changes” blocks for each archetype
- build “what stays with you” trust blocks

### Phase 4: UI Layer

- add support-system recommendation section to occupation pages
- add archetype-driven examples to `/products`
- add infographic modules showing day-to-day change

### Phase 5: Calibration

- review recommendations role-by-role
- identify obvious misses
- adjust scoring rules and taxonomy language

## Recommended Immediate Next Step

Before touching app code further:

1. finalize the support-system archetypes
2. finalize the pain-pattern taxonomy
3. choose 5 anchor occupations to test the framework:
   - electrician
   - project manager
   - accountant
   - registered nurse
   - paralegal
4. write example outputs for each one

That will make it much easier to evaluate whether the framework feels believable before implementing it in the product.
