# Product Suite Integration Roadmap

Date: 2026-04-02

## Purpose

This roadmap defines the work required to bring four things into one coherent system:

1. the role recommendation engine
2. the product suite
3. the blueprint page
4. the assistant request / inquiry flow

The current app has made strong progress on the user journey, but the product definition is still split across:

- package tiers
- work-area modules
- role-specific recommendations
- blueprint architecture
- builder request flow

This document defines the phases required to unify those layers.

## Current State

### What is already working

- The user can search and browse occupations.
- The occupation page can estimate time back and recommend a support direction.
- The blueprint page can show a recommended setup and let the user adjust modules.
- The app has a usable package layer:
  - Starter Assistant
  - Workflow Bundle
  - Ops Layer
- The app has a usable module layer:
  - intake
  - analysis
  - documentation
  - coordination
  - exceptions
  - learning
  - research
  - compliance
  - communication
  - data_reporting

### What is not fully unified yet

- Tasks map reasonably well to work areas, but not yet to a formal capability catalog.
- The product page still reads more like a brochure than the natural next step from the occupation flow.
- The blueprint page is becoming the primary commercial bridge, but the module library is not yet tied to a fully defined product vault.
- The builder/request flow still reflects “selected modules” more than a fully specified customized system.

## Target End State

The user should feel like they are buying one thing:

`a personal assistant system built for their role`

That system should be:

- recommended from occupation-specific data
- assembled from reusable modules
- backed by a defined capability catalog
- editable on the blueprint page
- submitted as one clear request

The user journey should be:

1. Search role
2. See time-back estimate
3. See support recommendation
4. Open blueprint
5. Edit included modules
6. Search and add more modules
7. Submit one assistant request

## Guiding Principles

- The occupation page should explain why the recommendation fits.
- The blueprint page should be the main product decision surface.
- `/products` should support the journey, not interrupt it.
- Package tiers should describe engagement scope.
- Modules should describe the actual support the user receives.
- Capabilities should describe the concrete work each module performs.

## Phase 1: Lock The Journey

### Goal

Freeze the main user path so product integration work does not keep shifting under the UI.

### Required decisions

- Primary CTA across the app:
  - `Build your personal assistant`
- Primary commercial bridge:
  - blueprint page
- Occupation page role:
  - recommendation and proof
- Blueprint page role:
  - configure and submit
- Products page role:
  - explain the system and engagement model

### Exit criteria

- One dominant CTA across the main routes
- No duplicate “configure/build/blueprint” concepts competing with each other
- Occupation -> blueprint -> request feels like one continuous path

## Phase 2: Lock The Module Taxonomy

### Goal

Stabilize the support-module layer so everything else can map to it.

### Existing module set

- intake
- analysis
- documentation
- coordination
- exceptions
- learning
- research
- compliance
- communication
- data_reporting

### Work required

1. Rename modules into customer-facing terms where needed.
2. Define what each module is responsible for.
3. Define what each module is not responsible for.
4. Define example task patterns each module should absorb.

### Example

#### Documentation support

Handles:
- report drafting
- summary creation
- notes
- logs
- record upkeep

Does not handle:
- final approval
- judgment-heavy interpretation

### Exit criteria

- Each module has:
  - a plain-English name
  - a one-sentence definition
  - example tasks
  - a clear boundary

## Phase 3: Define The Capability Catalog

### Goal

Turn broad modules into actual sellable product capabilities.

This is the main missing layer today.

### Structure

Each module should have:

1. module name
2. capability list
3. user-facing description
4. example tasks
5. likely systems touched

### Example

#### Coordination support

Capabilities:
- scheduling assistant
- follow-up assistant
- status tracking assistant
- handoff assistant

Example tasks:
- update crew schedules
- coordinate with ground staff
- track open items
- prepare weather disruption follow-through

Likely systems touched:
- calendar
- task tracker
- dispatch board
- email

### Why this matters

Without this layer, the app can say what support area fits, but cannot cleanly say what specific product the user is getting.

### Exit criteria

- Every module has a capability list
- The capability list is reusable across occupations
- The capability list is strong enough to power product copy and blueprint customization

## Phase 4: Map Tasks To Capabilities

### Goal

Move from:

`task -> module`

to:

`task -> module -> capability`

### Work required

For each task:

- map to a work area
- map to a module
- map to one or more capabilities
- assign confidence

### Example

Task:
- `Update crew schedules`

Maps to:
- work area: coordination
- module: coordination support
- capability: scheduling assistant

Task:
- `Maintain communication logs`

Maps to:
- work area: documentation
- module: documentation support
- capability: records assistant

### Exit criteria

- Selected blueprint modules can show the actual capabilities they include
- Module search can surface capability-backed additions
- Builder payload can capture requested capabilities, not only module names

## Phase 5: Unify Blueprint And Builder

### Goal

Make the blueprint page the one screen where the user:

- understands the recommendation
- edits the setup
- adds modules
- submits the request

### Product behavior

The blueprint page should include:

1. recommended starting system
2. estimated time-back impact
3. selected modules
4. capabilities inside those modules
5. searchable module library
6. optional custom requests
7. request submission

### Things to avoid

- separate “builder” concept that feels unrelated to the blueprint
- duplicated recommendation text on multiple surfaces
- forcing the user to mentally translate between blueprint and builder

### Exit criteria

- One page can support recommendation, editing, and inquiry
- No second surface is needed for the user to complete the request

## Phase 6: Rebuild `/products`

### Goal

Turn `/products` into a support-system explainer instead of a disconnected pricing-style page.

### Recommended structure

#### Section 1: Support systems first

Explain support-system types such as:
- reporting support
- documentation support
- coordination support
- intake support
- exception support

#### Section 2: How they bundle into engagement tiers

Then explain:
- Starter Assistant
- Workflow Bundle
- Ops Layer

#### Section 3: What you actually get

- recommended modules
- connected support setup
- human review points
- module customization
- tailored request flow

#### Section 4: How to begin

- find your role
- review your blueprint
- adjust modules
- submit request

### Exit criteria

- `/products` matches the rest of the journey
- package tiers feel like commercial wrappers around real module systems
- users understand what they are buying

## Phase 7: Inquiry Payload And Internal Fulfillment

### Goal

Capture enough structured detail in the request so fulfillment can turn it into a real scoped product.

### The request should include

- occupation
- selected modules
- removed modules
- added modules
- selected capabilities
- custom tasks
- pain points
- desired tools or systems
- contact details

### Internal output should support

- scope review
- module reuse
- capability selection
- role-specific tailoring
- future improvement of recommendations

### Exit criteria

- request payload is structured enough to scope work
- module and capability selections are visible internally
- the system gets smarter from request patterns over time

## Recommended Implementation Order

### Immediate

1. Lock module taxonomy
2. Define capability catalog
3. Start task-to-capability mapping

### Next

4. Unify blueprint and builder into one real request screen
5. Rebuild `/products` around support systems first

### After

6. Improve inquiry payload and internal fulfillment tooling

## What To Build First

If only one area should be built next, it should be:

### The capability catalog

Because that is the missing bridge between:

- role recommendation
- module selection
- blueprint editing
- actual product definition

Without it, the app can recommend support areas, but not fully explain the actual product being bought.

## Deliverables For The Next Workstream

### Doc 1

Module taxonomy spec:
- module names
- definitions
- task boundaries

### Doc 2

Capability catalog:
- capabilities under each module
- customer-facing names
- examples

### Doc 3

Task mapping framework:
- task -> module -> capability rules

### Doc 4

Blueprint-builder unification spec:
- UI structure
- selected modules
- searchable library
- request submission

## Final Principle

The user should not feel like they are buying software parts.

They should feel like:

- the app understood their role
- recommended the right support system
- showed them a starting setup
- let them adjust it
- and helped them request a personal assistant built around the work they actually do
