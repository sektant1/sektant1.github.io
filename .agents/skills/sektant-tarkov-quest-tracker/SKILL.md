---
name: sektant-tarkov-quest-tracker
description: Build and maintain a polished React web app for tracking Escape from Tarkov quests, prerequisites, objectives, required items, and player progress. Use the existing Sektant Hideout repository, its shadcn-based component library, Tailwind theme, and established design system.
---

# Sektant Tarkov Quest Tracker

Create and maintain a polished React web application for tracking Escape from Tarkov quest progression.

Work inside the user's current `github.io.sektant1` / Sektant Hideout repository. Treat the existing project as the source of truth for the framework, build tooling, coding conventions, visual language, and component APIs.

## Repository-first workflow

Before implementing changes:

1. Inspect the repository structure, `package.json`, existing routes, components, styles, design tokens, and TypeScript conventions.
2. Find and reuse the existing Sektant Hideout shadcn components and Tailwind utilities.
3. Preserve the current application architecture unless a change is necessary for the requested feature.
4. Do not replace working infrastructure or introduce a second design system.
5. Avoid unrelated refactors.

If the exact repository, package, component, or data source cannot be located, ask one focused clarification instead of guessing.

## Product goal

The application should let a player quickly understand:

- Which quests are available
- Which quests are completed
- Which quests are currently active
- Which quests are locked
- Why a quest is locked
- Which prerequisite quests must be completed
- Which player, trader, reputation, loyalty, map, or skill requirements apply
- Which objectives remain unfinished
- Which items must be found, crafted, handed over, or kept
- Which collected items satisfy future quests
- Overall progression by trader, map, and questline

The experience should be useful during gameplay, not merely a static database.

## Core product areas

Implement or improve these areas as appropriate to the request:

### Dashboard

Show:

- Overall completion percentage
- Available and active quests
- Recently completed quests
- Quests close to unlocking
- Missing prerequisite requirements
- Required items still outstanding
- Progress grouped by trader
- Useful next-quest recommendations

### Quest browser

Support:

- Search by quest, trader, map, objective, or item
- Filtering by status, trader, map, level, and questline
- Sorting by progression relevance, level, trader, or name
- Compact list and information-dense desktop views
- Clear visual distinction between available, active, completed, and locked quests

### Quest details

Show:

- Quest title and trader
- Location or map
- Minimum level
- Quest description or summary
- Objectives as interactive checklists
- Prerequisite quests
- Unlock requirements
- Required and rewarded items
- Follow-up quests
- Current completion state
- A clear explanation for every locked state

### Quest dependency tracking

Represent prerequisites as structured relationships, not duplicated text.

When useful, provide a quest-chain or dependency view. Avoid a visually noisy graph when a short prerequisite list communicates the information better.

Never mark a quest as available until all modeled mandatory requirements are satisfied.

### Item tracking

Track:

- Required quantity
- Quantity already owned
- Found-in-raid requirements
- Items already handed over
- Items required by multiple quests
- Total quantity required by remaining quests
- Whether an item can safely be used or sold

Allow item progress to update related quest progress automatically when the data model supports it.

### Progress management

Support these quest states:

- Locked
- Available
- Active
- Ready to complete
- Completed

Changes should be easy to undo. Destructive progress resets require confirmation.

Persist progress using the repository's existing persistence approach. If none exists, start with a typed storage abstraction backed by local storage, structured so it can later be replaced by a database or account sync without rewriting UI components.

Provide import, export, backup, or reset functionality when requested.

## Data model

Prefer normalized, strongly typed data.

Typical entities include:

- `Quest`
- `Trader`
- `Map`
- `Item`
- `QuestObjective`
- `QuestRequirement`
- `QuestReward`
- `QuestProgress`
- `ItemProgress`

Quest requirements may include:

- Required quests
- Minimum player level
- Trader loyalty level
- Trader reputation
- Required skill level
- Required items
- Edition, faction, or branching conditions

Keep static Tarkov data separate from user progress.

Use stable IDs for relationships. Do not use display names as primary identifiers.

Derived states such as `available`, `readyToComplete`, and `lockedReason` should be calculated from requirements and progress instead of being manually duplicated across the application.

## Tarkov data accuracy

Escape from Tarkov quest information can change between game versions.

When populating or updating real quest data:

- Use current, credible sources or a user-provided dataset.
- Record the game version, data source, and last verification date when practical.
- Do not invent quest requirements, objectives, item quantities, or dependencies.
- Clearly label incomplete, uncertain, or placeholder data.
- Keep source-specific transformation logic separate from the UI.
- Do not silently scrape or copy a complete third-party database if licensing or usage permission is unclear.

If live data cannot be verified, create the schema and use clearly marked sample records.

## UI and visual direction

The result should look like a natural extension of Sektant Hideout.

Use:

- Existing design tokens
- Existing typography
- Existing color variables
- Existing shadcn variants
- Existing layout and spacing conventions
- Existing icon library
- Existing animation utilities

The visual direction should be professional, information-dense, tactical, and restrained. Preserve the repository's military terminal or CRT influence where present, but prioritize legibility and usability.

Avoid:

- Generic dashboard styling
- Excessive neon glow
- Decorative scanlines that reduce readability
- Excessive borders around every element
- Large empty hero sections
- Unnecessary gradients
- Constant animation
- Copying Escape from Tarkov's interface directly
- Introducing arbitrary colors outside the design system

Use color, icons, labels, and text together for statuses. Never rely on color alone.

## UX requirements

The application must be:

- Responsive from mobile through large desktop displays
- Keyboard accessible
- Screen-reader friendly
- Fast to scan during gameplay
- Clear when no results or data are available
- Clear when loading or an operation fails
- Safe against accidental progress loss

Use tooltips only for supplementary information. Essential requirements and locked-state explanations must remain visible without hovering.

On mobile, keep primary progress actions easy to reach. On desktop, take advantage of additional width without allowing excessively long text lines.

When changing progress, provide immediate feedback without disruptive modal dialogs.

## Engineering quality

Follow the repository's existing standards.

Prefer:

- TypeScript
- Small, composable components
- Semantic HTML
- Shared status and progress primitives
- Derived selectors for calculated progression
- Explicit domain types
- Accessible shadcn primitives
- Reusable filtering and sorting logic
- URL-backed filters when supported by the router

Avoid:

- `any` without a strong reason
- Monolithic page components
- Business rules embedded throughout presentation components
- Duplicate quest state
- Hardcoded colors
- Unnecessary dependencies
- Premature backend infrastructure

Add a dependency only when it provides clear value and the existing stack does not already solve the problem.

## Verification

After implementation:

1. Run the repository's formatter, linter, type checker, tests, and production build when available.
2. Fix failures caused by the change.
3. Inspect the final UI at mobile and desktop widths.
4. Verify keyboard navigation, focus states, empty states, and locked-requirement explanations.
5. Test a complete progression path:
   - A locked quest
   - Completion of its prerequisite
   - Automatic unlocking
   - Objective updates
   - Required-item updates
   - Ready-to-complete state
   - Final completion
6. Summarize changed files, major decisions, verification performed, and any remaining data limitations.

Do not claim that a command, visual check, or test passed unless it was actually performed.
