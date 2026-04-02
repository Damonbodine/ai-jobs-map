# Custom System Journey Plan

## Core Decision

This product should not be sold like a self-serve SaaS subscription.

The right model is:

- the user discovers time-back potential through their occupation
- the user sees a recommended support system for their role
- the user reviews a starting blueprint
- the user customizes that blueprint
- the user submits an inquiry for a tailored assistant system

So the site should feel like:

`role insight -> recommended system -> editable blueprint -> inquiry`

Not:

`landing page -> pricing table -> checkout`


## Product Framing

The thing being sold is not "AI software."

The thing being sold is:

- a customized internal support system
- built from a vault of proven assistant modules
- shaped around the user's role, tasks, and working style
- refined over time rather than delivered as a fixed app

Good framing language:

- build your personal assistant
- support system for your role
- recommended setup
- assistant modules
- starting blueprint
- tailored request

Language to avoid or de-emphasize:

- SaaS
- automation platform
- buy now
- pricing-first language
- generic package language with no role context


## Buyer Mental Model

The user needs to believe all of these in sequence:

1. You understand my role.
2. You understand where my time goes.
3. You have a credible recommendation for how to help.
4. I can shape this around my actual work.
5. Submitting this is the beginning of a conversation, not a blind purchase.

If any of those break, the journey feels incoherent.


## Target Journey

### 1. Landing Page

Goal:

- help the user find their role quickly
- communicate that this covers many occupations
- set up the core promise: time back from routine work

User question:

- "Do you cover my kind of job?"

Required elements:

- role search
- breadth cue: `Search across 800+ occupations`
- example occupations and categories
- one primary CTA path

Primary CTA:

- `Build your personal assistant`

Secondary CTA:

- `Browse 800+ roles`

Do not do here:

- heavy product explanation
- tier comparisons
- abstract AI education


### 2. Browse Page

Goal:

- let the user find a role if search does not immediately work
- rank occupations by a visible, understandable value

User question:

- "Which roles are covered, and how much help is possible?"

Required elements:

- search/filter/sort
- time-back teaser on cards
- strong category labeling

Metric rule:

- browse cards should use the same shared estimate logic as occupation pages
- this is now true and should remain true

Do not do here:

- too much explanation
- product details


### 3. Occupation Page

Goal:

- prove the recommendation is specific to the user's role
- turn raw time-back into a recommended support direction

User question:

- "What would actually help someone in my job?"

Required hierarchy:

1. occupation title
2. time-back headline
3. recommendation paragraph under the number
4. `Save time with an AI assistant`
5. top work-area cards with example tasks
6. product bridge into blueprint

This page should answer:

- how much time could come back
- what kind of support fits this role
- which routines it would touch
- what the first setup should look like

What should no longer dominate here:

- generic opportunity categories
- related occupations
- raw analytical sections that do not help the user choose


### 4. Blueprint Page

Goal:

- turn the recommendation into something concrete and editable
- close the loop between recommendation and inquiry

User question:

- "What would my starting system actually include, and can I change it?"

This is the most important commercial page in the product.

It should be framed as:

- a recommended starting system
- editable by the user
- built from modules you already offer

It should not feel like a second, separate product.

The blueprint page should contain:

1. top recommendation card
2. estimated time-back for the full setup
3. recommended suite
4. assistant modules
5. editable included modules
6. searchable module library
7. custom requests box
8. inquiry submission form

Primary CTA:

- `Build your personal assistant`

That CTA should effectively mean:

- review the recommended setup
- adjust modules
- send the request

So the blueprint page is not just a viewer.
It is the builder and request surface.


### 5. Products Page

Goal:

- explain what kinds of systems you build
- translate role recommendations into commercial offerings

User question:

- "What are you actually selling me?"

This page should not be the primary conversion surface.
It should support the main journey.

It should lead with:

- support system types
- role examples
- how those systems translate into engagement tiers

Recommended structure:

1. support systems first
   - reporting support
   - documentation support
   - coordination support
   - intake support
   - exception support

2. then commercial packaging
   - Starter Assistant
   - Workflow Bundle
   - Ops Layer

3. then process
   - recommendation
   - blueprint
   - customization
   - inquiry

4. then trust
   - what stays with the human
   - what the first engagement looks like

Do not lead with:

- static pricing
- abstract package names without role context


### 6. Inquiry / Builder Flow

Goal:

- collect a high-quality request without forcing the user to think like a product manager

User question:

- "How do I ask for the version that fits me?"

The builder should use:

- recommended modules already selected
- editable list of modules
- searchable module library
- freeform custom needs
- contact capture

The user should feel like they are:

- shaping a system
- not configuring software

The ideal submission data is:

- occupation
- recommended suite
- selected modules
- removed modules
- added modules
- custom requests
- primary pain points
- contact info


## System Design Principles

### Recommendation-first

Every major surface should begin with:

- your role
- your recommended support direction
- your estimated time back

### One primary action

Across the whole site, the main action should be:

- `Build your personal assistant`

Supporting actions can exist, but that should be the dominant motion.

### Blueprint as the bridge

The blueprint should be the bridge between:

- diagnosis
- product understanding
- inquiry

That means the blueprint page should absorb functionality that would otherwise be split across multiple surfaces.

### Customization over checkout

This is not instant checkout.
It is a tailored system inquiry.

So the page should optimize for:

- confidence
- clarity
- editability
- relevance

Not:

- pricing urgency
- hard conversion tricks


## Information Architecture Recommendation

### Keep

- `/`
- `/browse`
- `/occupation/[slug]`
- `/blueprint/[slug]`
- `/products`

### Reposition

- `/factory`

Recommended role:

- back-end submission / intake route
- potentially hidden from the main user journey
- powered by blueprint selections

The main user should not need to understand the distinction between:

- blueprint
- factory

That distinction is internal.
The user should just feel like they are building a personal assistant.


## Blueprint Page Rewrite Direction

The blueprint page should become:

### Section 1: Recommended setup

- role-specific heading
- estimated time back
- support areas included
- tasks mapped
- recommended suite

### Section 2: Included modules

- recommended modules shown as cards
- each card removable
- each card shows:
  - what it handles
  - estimated time potential
  - whether it is included

### Section 3: Add modules

- searchable library of all modules
- add/remove behavior
- suggestions based on role and tasks

### Section 4: Custom needs

- a simple freeform box:
  - `Anything else you want this assistant to help with?`

### Section 5: Submit request

- name
- email
- optional team/company
- CTA

CTA options:

- `Send my assistant request`
- `Request this setup`
- `Get my custom plan`


## Product Vault Model

Internally, the business model is:

- role-specific systems are assembled from a vault of reusable modules

So the app should eventually operate on three layers:

1. Role signals
   - occupation
   - tasks
   - work areas
   - estimated time back

2. Recommendation logic
   - recommended suite
   - recommended modules
   - recommended order of operations

3. Product vault
   - reusable assistant modules
   - module capabilities
   - tool integrations
   - task coverage

The user only needs to see layers 1 and 2 clearly.
Layer 3 should power the experience, not complicate it.


## What To Build Next

### Phase 1

- rewrite `/products` around support systems first, packages second
- unify CTA language across all routes

### Phase 2

- convert `/blueprint/[slug]` into the single editable recommendation + inquiry surface
- reduce dependence on `/factory` as a distinct user-facing concept

### Phase 3

- expose searchable module library inside blueprint
- allow module add/remove interactions cleanly

### Phase 4

- ensure every selected module ties back to:
  - role routines
  - time-back estimate
  - product capability

### Phase 5

- tighten inquiry workflow
- capture selected modules and custom requests in a single payload
- prepare internal handoff for sales / implementation


## Success Criteria

The journey is working when a user can do all of this without confusion:

1. find their role
2. understand the estimated time-back
3. recognize the recommended support direction
4. open a blueprint that feels specific to their job
5. edit the recommended setup
6. send an inquiry without wondering what happens next

If that happens, the product feels like a tailored system purchase rather than a confusing AI demo.
