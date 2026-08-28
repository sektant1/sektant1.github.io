# skt-ui-toolkit

A shadcn registry: one source of truth for components and visual identity, so
every project starts from the same design without per-project setup.

Components are distributed as copied source, not as a dependency. A consuming
project runs `npx shadcn add <url>` and owns the result — it can edit its copy
freely, and nothing here has to be versioned in lockstep.

## Using it in a project

Once, in the consuming project:

```bash
npx shadcn@latest init
```

Then add whatever you need:

```bash
npx shadcn@latest add https://sektant.dev/r/button.json
```

The theme installs itself with the first component. Every component declares
`skt-theme` as a registry dependency, so a component can never land in a
project without the tokens it was designed against — colors, zero radius, flat
shadows, and the type scale. Components that import siblings (`sidebar` pulls
`button`, `input`, `separator`, `sheet`, `skeleton`, `tooltip` and a hook)
declare those too.

Browse everything at <https://sektant.dev/showcase/components>: each entry
shows its variants and the exact `add` command.

## What is deployed where

Pages serves one artifact, assembled by `npm run pages:build` (`make pages`)
and deployed on every push to `master`:

| Path         | Comes from                             |
| ------------ | -------------------------------------- |
| `/`          | `apps/hideout` static export, CMS off  |
| `/r/*.json`  | the shadcn registry                    |
| `/showcase/` | `apps/web`, the component showcase     |

The hideout sits at the root because the custom domain belongs to it — its
`public/CNAME` is what keeps `sektant.dev` pointed here across deploys. Serve
the exact artifact locally with `make pages-serve`.

The published URLs are defined in two places, and both have to agree with the
domain: `apps/web/src/lib/registry-url.ts` (the `add` command) and the
`homepage` field in `scripts/build-registry.mjs`. If the showcase ever moves,
`base` in `apps/web/vite.config.ts` has to match its new path.

Repository settings need the Pages source set to **GitHub Actions**.

## Branches

`development` is where work lands; `master` is what the world runs.

| Push to       | Workflow | Result                                                     |
| ------------- | -------- | ---------------------------------------------------------- |
| any branch/PR | CI       | registry check, tests, typecheck, lint, both builds, image  |
| `development` | Staging  | image `ghcr.io/sektant1/hideout:development`               |
| `master`      | Release  | image `:latest` + the Pages deploy                          |

`make release` merges `development` into `master` and pushes, which is the
deploy. It refuses to start when the tree is dirty, when there is no `origin`,
or when there is nothing to release — run `make release-preflight` to check
without touching anything. A staging server follows the development image with
`make deploy-staging`.

## Developing the toolkit

```bash
npm install
npm run dev            # showcase at localhost:5173
npm run registry:build # regenerate registry.json and the served JSON
npm run test           # unit tests for the registry generator and storage
```

`registry.json` is generated from `packages/ui/src/components/`, never edited by
hand. Adding a component means adding the file and running `registry:build`;
`npm run registry:check` fails when the manifest and the directory disagree, and
CI runs it on every pull request.

A component's registry dependencies and extra files are derived from its
imports, so importing a sibling or a hook is enough — the manifest follows.

## Layout

| Path | What it is |
| --- | --- |
| `packages/ui` | The components, hooks, utils and theme |
| `registry.json` | Generated manifest, one entry per distributable item |
| `scripts/` | The generator, its pure helpers, and their tests |
| `apps/web` | SKT Codex — the showcase, and the host for `/r/*.json` |
| `apps/hideout` | sektant.dev — the personal site, built on the toolkit |
| `docs/superpowers/` | The design spec and implementation plan |

## Theme

Zero radius, no shadows, a red primary, Play for display and IBM Plex Mono for
code. Beyond the standard shadcn tokens, the theme adds:

- `terminal-chrome`, `terminal-chrome-dim` — frame titles, status, brand
- `terminal-ink`, `terminal-ink-dim`, `terminal-ink-faint` — body and metadata
- `terminal-rule`, `terminal-edge`, `terminal-wash` — dividers, edges, fills
- `crt-glow`, `crt-glow-soft`, `crt-bloom`, `crt-breathe`, `crt-scanfill`,
  `hazard-stripe`, `ascii-fit` — utilities for the terminal idiom

Use those rather than one-off opacities, so the same intent reads the same way
everywhere.

The display face can be switched at runtime with the `font-picker` component.
Bender is the face the identity was drawn against and ships with the package;
it leads the list but is not the default, because it carries no Cyrillic and
every other option does.

### Variants

`globals.css` is the red tube. A project that wants a different one imports a
variant after it, which restates only the colour tokens — radius, shadows, type
and the `terminal-*` roles keep coming from one place:

```css
@import "@workspace/ui/globals.css";
@import "@workspace/ui/themes/phosphor.css";  /* green, dark-only */
```

`phosphor.css` also carries the phosphor pointers: a crosshair reticle for the
default cursor, an arrow for links, drawn as inline SVG.

## sektant.dev

`apps/hideout` is the personal site — devlog, project index, and a local MDX
CMS at `/admin` that writes files under `content/`. It consumes the toolkit as
a workspace dependency and compiles it from source, so an edit in
`packages/ui` shows up there with no publish step.

```bash
npm run dev --workspace hideout    # localhost:3000
```

`/admin/home` edits every string the front page renders — banner, tagline,
panel labels, quick links, the quote, section headings — into
`content/pages/home.json`. That file only carries what was changed: a field
left empty renders the copy the site ships with, defined in
`apps/hideout/lib/content/home-schema.ts`, so the front page survives a
missing or half-written file.

It builds two ways from the same source. `build:pages` produces a static
export with the CMS stripped out, for GitHub Pages. A plain `build` produces a
standalone Node bundle for self-hosting — `scripts/install.sh` sets that up on
a Debian or Ubuntu box, via Docker Compose where Docker is present and a
systemd unit where it is not:

```bash
curl -fsSL https://raw.githubusercontent.com/sektant1/skt-ui-toolkit/master/scripts/install.sh | bash
```

## Consuming from RSC

Every component that holds state or context is marked `"use client"`, so the
library can be imported directly from a React Server Component. Presentational
components stay server-renderable.
