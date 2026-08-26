# skt-ui-toolkit — Design

**Date:** 2026-08-26
**Status:** Approved

## Problem

`skt-ui-toolkit` is currently the stock shadcn Vite monorepo template. `@workspace/ui`
is `private: true`, has no build step, and its `exports` point directly at `src/*.tsx`.
It works only inside this monorepo. The goal is the opposite: a single source of design
truth that any future web project can pull from, so every project starts with the same
components and the same visual identity without per-project setup work.

Three concrete defects block that today:

1. **No distribution mechanism.** Nothing outside this repo can consume `@workspace/ui`.
2. **The theme does not fully apply.** `globals.css` declares `--font-sans: Chakra Petch`
   and `--font-mono: IBM Plex Mono`, but neither font is installed or imported. The only
   font dependency present is `@fontsource-variable/geist-mono`, which nothing references.
   Every surface currently renders in `system-ui` fallback.
3. **One component exists.** Only `button.tsx`. Any new project would immediately need
   to add the rest by hand, re-deriving decisions each time.

## Approach

A **shadcn registry**: a set of static JSON files describing each component, served over
HTTP. Consumers run `npx shadcn add <url>` and the component source is copied into their
project. No runtime dependency on this repo, no version lockstep, and each consumer can
edit their copy freely. This is shadcn's native distribution model and it fits the code
that already exists here.

Rejected: publishing an npm package (forces a build pipeline, an `exports` map, peer
dependency management, and makes per-project edits awkward) and git dependencies (same
build burden without a stable URL).

## Architecture

Three units in one repository, each with one purpose:

| Unit | Purpose | Interface |
| --- | --- | --- |
| `packages/ui` | Source of truth: components, tokens, utils, hooks | `exports` in package.json (internal use) + entries in `registry.json` (external use) |
| `registry.json` (repo root) | Manifest: name, dependencies, files, and `cssVars` for each item | Input to `npx shadcn build` |
| `apps/web` | Visual showcase and static host for the generated JSON | `/` for docs, `/r/*.json` for the registry endpoint |

**Build flow:** a component lives in `packages/ui/src` → it is declared in `registry.json`
→ `shadcn build` emits `apps/web/public/r/*.json` → GitHub Pages serves that directory →
an external project runs:

```bash
npx shadcn add https://<GITHUB_USER>.github.io/skt-ui-toolkit/r/button.json
```

The repository has no git remote yet, so `<GITHUB_USER>` is a placeholder recorded in
`README.md` and in the Vite `base` config. It is substituted once the remote exists.

## The theme as a registry item

This is the piece that delivers "consistent design across all projects".

A single item named `skt-theme` of type `registry:theme` carries the entire visual
identity: the light and dark `cssVars` blocks, `--radius: 0rem`, `--spacing: 0.22rem`,
the zeroed shadow scale, and the two font families.

**Every component item declares `registryDependencies: ["skt-theme"]`.** Installing any
component into a fresh project therefore pulls the theme with it. A consumer cannot end
up with skt components rendering under default shadcn styling.

The theme item also declares its font packages as `dependencies`:

- `@fontsource-variable/chakra-petch`
- `@fontsource-variable/ibm-plex-mono`

Both are imported at the top of `globals.css`, above the `@import "tailwindcss"` line so
Tailwind's layers win the cascade. `@fontsource-variable/geist-mono` is removed — it is
an orphan and the wrong typeface.

Self-hosted fonts were chosen over a Google Fonts `@import` so pages work offline, avoid
a render-blocking third-party request, and do not leak visitor IPs to Google.

## Components

The full `aria-lyra` component suite — 62 items built on `react-aria-components` — is
added to `packages/ui/src/components` and declared in the registry.

Adding them is mechanical (`shadcn add`), but the result is not accepted on faith. Every
component must clear a verification gate:

1. `npm run typecheck`, `npm run lint`, and `npm run build` pass across the workspace.
2. The component renders on the showcase's `/components` verification index without a
   console error.
3. Its visual result is consistent with the theme (radius 0, no shadows, correct fonts).

Any component that cannot clear the gate is either fixed or cut from v1, and the omission
is reported explicitly rather than shipped broken. `chart` carries a `recharts` dependency
and `sonner` carries its own; these are declared per-item, not hoisted globally, so a
consumer who installs only `button` does not inherit a charting library.

## Showcase

`apps/web` is rewritten from the template placeholder into **SKT Codex**: a reference and
practice site for software engineering, computer graphics, and game development. The
components are demonstrated inside a plausible product rather than on a grid of isolated
swatches.

This framing is a design decision, not decoration. A component library is judged by how
its parts compose — whether a `sidebar` and a `breadcrumb` and a `tabs` read as one system
on the same screen. A gallery of components in isolation cannot answer that; a real
layout can. It also matches the theme: zero radius, no shadows, Chakra Petch and IBM Plex
Mono read as technical tooling, which is what this content is.

The site has two layers:

**1. The product layer** — four routes, each chosen to exercise a different component
cluster under realistic density:

| Route | Content | Components exercised |
| --- | --- | --- |
| `/` — Codex | Topic index: Rendering, Physics, ECS, Shaders, Netcode, Tooling | sidebar, navigation-menu, card, item, badge, avatar, separator, empty, skeleton |
| `/topic/:slug` — Reference article | A technique write-up with code, math, caveats, and related links | breadcrumb, tabs, accordion, alert, table, kbd, tooltip, hover-card, scroll-area, collapsible, progress |
| `/practice` — Exercise catalogue | Filterable list of practice problems by topic, difficulty, and language | input, combobox, select, checkbox, radio-group, slider, toggle-group, pagination, command, popover, native-select |
| `/submit` — Contribute a resource | Form to submit a technique or exercise to the codex | form, field, label, textarea, input-group, input-otp, switch, button-group, dialog, drawer, sheet, sonner, calendar, spinner |

Content is static fixture data in `apps/web/src/data/` — enough to make the layouts
honest (long titles, empty states, overflow), with no backend.

**2. The verification layer** — `/components`, an exhaustive index rendering every
registered item with every variant and size it exposes, plus a copyable
`npx shadcn add ...` command per item. This is the gate surface: it is where a human
confirms the theme is applied and no component is silently broken. The product layer
proves composition; this layer proves coverage. Both are required.

A dark/light toggle persists in `localStorage` and applies across both layers.

Routing uses `react-router` — four product routes plus the verification index is past
what conditional rendering handles cleanly, and consumers of the registry will use a
router anyway.

## Data flow

There is no runtime data flow — the registry is static JSON and the showcase is a static
site. The only flow is at build time, described under Architecture above.

## Error handling

The failure modes worth designing for are build-time, not runtime:

- **A component references a file missing from `registry.json`.** `shadcn build` fails
  loudly and CI blocks the deploy.
- **A component is added to `packages/ui` but never registered.** Not caught by the
  compiler, so a check script compares the files in `src/components` against the entries
  in `registry.json` and fails on drift. This runs in CI.
- **A consumer installs a component whose theme did not apply.** Prevented structurally
  by the `registryDependencies` rule above rather than detected after the fact.

## Testing

No unit tests for the components themselves. They are thin wrappers over
`react-aria-components`, which carries its own test suite and its own accessibility
guarantees; tests here would assert that `cva` concatenates strings correctly.

What is verified instead, in CI on every pull request:

- `typecheck` across the workspace.
- `lint` across the workspace.
- `build` of both packages.
- `shadcn build` succeeds and emits one JSON per registered item.
- The registry drift check described under Error handling.

On push to the default branch, CI additionally builds `apps/web` and deploys it to
GitHub Pages.

## Out of scope for v1

- Unit tests for component internals (rationale above).
- Semantic versioning and a changelog. The registry serves `latest` only. Pinning is a
  separate design if it becomes a real need.
- npm publication.
- Storybook. The showcase covers the documentation need without a second toolchain.
