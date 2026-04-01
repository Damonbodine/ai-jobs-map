# Example Recommendation Outputs

## Purpose

This document translates the actionable recommendation framework into concrete occupation-level outputs in the voice the site should use.

The goal is to test whether the recommendation layer feels:

- specific
- believable
- low-jargon
- useful to non-technical buyers

These are not final product requirements. They are content prototypes meant to validate the recommendation pattern before we implement it in the app.

## Voice Rules

The recommendation layer should:

- describe the work, not the technology
- explain how the day changes
- stay concrete and operational
- emphasize support, not replacement
- avoid technical language

Avoid:

- AI agent
- automation
- model
- orchestration
- copilot
- replacement

Prefer:

- support system
- keeps work moving
- prepares the next step
- handles the repetitive setup
- gives time back in the day

## Reusable Content Pattern

Each occupation recommendation should be able to render these blocks:

1. `Best place to start`
2. `Here’s how your day changes`
3. `What it handles`
4. `What stays with you`
5. `Why this fits the role`

## Example 1: Electrician

### Best place to start

Start with scheduling support.

### Here’s how your day changes

Instead of spending time moving appointments around, answering repeat customer questions, and chasing the next open job, the support system keeps the schedule moving in the background. Job requests get organized, openings get surfaced, reminders go out, and the next step is prepared before someone has to stop and handle it manually.

### What it handles

- inbound job requests
- appointment confirmations and reschedules
- missing customer details
- reminders and follow-up messages
- daily schedule changes

### What stays with you

- final schedule decisions
- customer conversations
- on-site judgment
- pricing and scope changes

### Why this fits the role

The biggest drag in this role usually is not the hands-on work itself. It is the scheduling, follow-up, and customer coordination wrapped around the work. This support system removes that admin layer first.

### Secondary recommendation

Estimate and proposal support.

### Secondary explanation

If quote turnaround is a bigger problem than schedule movement, the better starting point is estimate support: organize job details, prepare draft scopes, and keep open quotes from going cold.

## Example 2: Project Manager

### Best place to start

Start with status and follow-through support.

### Here’s how your day changes

Instead of spending the day collecting updates, rewriting the same status information, and chasing action items after meetings, the support system gathers what changed, prepares the summary, and keeps the next step moving. You review, adjust, and send instead of assembling everything from scratch.

### What it handles

- update collection
- status-summary prep
- meeting follow-up
- action-item tracking
- reminder and handoff prep

### What stays with you

- stakeholder judgment
- priority calls
- exception handling
- final communication

### Why this fits the role

This role often loses time to coordination overhead. The support system is not replacing management. It is reducing the repetitive work required to keep the project visible and moving.

### Secondary recommendation

Documentation support.

### Secondary explanation

If reporting and deck preparation are heavier than follow-up, documentation support can be the better first move.

## Example 3: Accountant

### Best place to start

Start with documentation support.

### Here’s how your day changes

Instead of rebuilding recurring reports, gathering the same supporting details, and manually preparing draft outputs, the support system prepares the first version of the work so the accountant can spend more time reviewing, correcting, and deciding. The work starts closer to finished.

### What it handles

- recurring report prep
- documentation assembly
- record organization
- draft summaries
- routine data pull support

### What stays with you

- final review
- accounting judgment
- exception handling
- sign-off

### Why this fits the role

The time drain here usually comes from recurring documentation and preparation work, not from the final professional judgment. That makes documentation support the cleanest first step.

### Secondary recommendation

Exception review support.

### Secondary explanation

If the bigger problem is combing through records to find what needs attention, exception review support may be the better lead system.

## Example 4: Registered Nurse

### Best place to start

Start with documentation and follow-through support.

### Here’s how your day changes

Instead of the day being split between care and documentation cleanup, the support system helps structure notes, organize the next follow-up step, and keep routine communication moving. More of the shift stays with care, and less of it gets pulled into repetitive record work.

### What it handles

- draft documentation structure
- follow-up prompts
- recurring communication prep
- routine record organization
- missing-information flags

### What stays with you

- patient judgment
- care decisions
- sensitive communication
- final accountability

### Why this fits the role

The support opportunity is around the admin load that surrounds care, not the care itself. That makes this a documentation-and-follow-through story rather than a decision story.

### Secondary recommendation

Intake and triage support.

### Secondary explanation

In higher-volume settings, organizing inbound requests and routing routine items may be the better first step.

## Example 5: Paralegal

### Best place to start

Start with intake and documentation support.

### Here’s how your day changes

Instead of every new matter starting as a manual collection process, the support system organizes incoming details, prepares the next document step, and keeps follow-up from stalling. The work enters the day cleaner, and less time is spent rebuilding context by hand.

### What it handles

- matter intake organization
- document collection follow-up
- packet prep
- status updates
- routine drafting setup

### What stays with you

- legal judgment
- attorney coordination
- sensitive communications
- final review

### Why this fits the role

This role often loses time at the front of the workflow: collecting, organizing, and preparing. That makes intake and documentation support the strongest fit.

### Secondary recommendation

Follow-through support.

### Secondary explanation

If the bigger pain is open loops rather than intake volume, follow-through support becomes the better first recommendation.

## Example 6: Construction Manager

### Best place to start

Start with status and coordination support.

### Here’s how your day changes

Instead of spending time chasing updates, coordinating changes across people, and preparing the same progress information over and over, the support system gathers status, prepares the next communication, and keeps follow-through moving. The manager steps into decisions instead of spending the day stitching together updates.

### What it handles

- status collection
- schedule-related updates
- follow-up reminders
- documentation prep
- coordination packets

### What stays with you

- site judgment
- sequencing decisions
- stakeholder management
- exceptions and escalations

### Why this fits the role

The time drain is usually in coordination and reporting around the job, not the leadership of the job itself. This support system removes that routine overhead first.

### Secondary recommendation

Estimate and proposal support.

### Secondary explanation

Where pre-job scoping and proposal turnaround are heavier than status work, estimate support may be the better first package.

## Example 7: School Administrator

### Best place to start

Start with intake and scheduling support.

### Here’s how your day changes

Instead of the day getting consumed by inbound requests, calendar movement, and repeat coordination work, the support system organizes requests, prepares the next response, and keeps appointments and follow-ups moving. The administrator spends less time sorting and more time handling the cases that actually need attention.

### What it handles

- incoming requests
- meeting and calendar movement
- routine parent or staff follow-up
- information gathering
- reminder prep

### What stays with you

- people decisions
- sensitive conversations
- exceptions
- final approvals

### Why this fits the role

This role often gets buried by volume and coordination. Intake and scheduling support remove the front-end drag without touching the human judgment at the center of the work.

## Product Page Translation

These recommendations also imply a clearer product-page structure.

Instead of presenting product packages as abstract offers, the page can show plain-language support patterns such as:

- scheduling support
- intake support
- estimate support
- documentation support
- follow-through support
- reporting support
- exception review support

Each should be described as:

- where it shows up in the day
- what repetitive work it takes off the plate
- what still stays with the person

## What To Validate Next

Before implementation, review these examples for:

1. credibility
2. clarity
3. role fit
4. language simplicity
5. whether the recommendation feels more actionable than the current package layer

## Recommended Immediate Follow-Up

Take 5 anchor roles from the live site and compare:

- current `best place to start`
- current package recommendation
- new support-system recommendation

Then decide:

1. whether occupation pages should lead with support-system language
2. whether `/products` should be reorganized around support systems first and package tiers second
3. whether the recommendation engine should produce a primary and secondary support-system fit for every role
