# skt-ui-toolkit

A shadcn registry plus the two sites that publish it. `README.md` covers what
is deployed where and how a consuming project installs a component; this file
covers what is not obvious from the tree.

## Layout

| Path                       | What it is                                               |
| -------------------------- | -------------------------------------------------------- |
| `packages/ui`              | `@workspace/ui` — components, hooks, lib, theme. Source.  |
| `apps/web`                 | Vite showcase, served at `/showcase`                      |
| `apps/hideout`             | Next.js `sektant.dev` — devlog, project index, MDX CMS    |
| `scripts`                  | registry generator, Pages assembler                       |
| `registry.json`            | **generated** from `packages/ui/src/components`           |
| `apps/hideout/assets`      | source assets you edit; compiled into `public/`           |
| `apps/hideout/public/models` | **generated** from `assets/models`, git-ignored          |

`apps/hideout` has its own `AGENTS.md`: its Next.js version differs from
training data, so read that before writing code there.

## Commands

`make` on its own lists every target. `make check` is the CI gate minus the
builds — run it before calling work done. Prefer the Makefile over raw npm
scripts; it is the documented interface.

## Rules that bite

- **The registry is generated.** Adding a file to `packages/ui/src/components`
  is half the change: run `make registry` and commit `registry.json` with it.
  CI fails on drift (`make registry-check`).
- **A new runtime dependency needs registering.** When a component's generated
  source imports a package the consumer must install, add it to `DEPENDENCIES`
  in `scripts/build-registry.mjs`, or `shadcn add` produces a broken install.
- **Models are compiled, not committed.** Edit the GLB in
  `apps/hideout/assets/models`; `make models` writes the served copy. The
  textures are downscaled and re-encoded there because the ASCII pass reduces
  the render to nine glyph levels and cannot resolve 2048².
- **Three and figlet must stay out of the shared bundle.** The scene is
  reached through `ascii-planet-lazy`, and banner art is rendered on the
  server with `renderAsciiArt` into `AsciiBannerView`. Importing
  `AsciiPlanetScene` or `AsciiBanner` directly from a page puts ~700 KB back
  into every route.
- **The published URL lives in two places** — `apps/web/src/lib/registry-url.ts`
  and `homepage` in `scripts/build-registry.mjs` — and they have to agree.
- **`dist-pages/` is build output**, assembled by `make pages`. Never hand-edit.
- **Copy and chrome follow a register system.** Cyrillic caps for signage,
  Latin caps for readouts, lowercase Latin for the human voice — and readouts
  carry real values, never invented telemetry. `CONTEXT.md` is the rule; a
  string that ignores it is a bug.
- Formatting is Prettier with no semicolons and double quotes; `make format`
  settles it.

## Branches

Work lands on `development`. `master` is what the world runs, and pushing to it
deploys — `make release` is the only way it should get there.
