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
npx shadcn@latest add https://<GITHUB_USER>.github.io/skt-ui-toolkit/r/button.json
```

The theme installs itself with the first component. Every component declares
`skt-theme` as a registry dependency, so a component can never land in a
project without the tokens it was designed against — colors, zero radius, flat
shadows, and the type scale. Components that import siblings (`sidebar` pulls
`button`, `input`, `separator`, `sheet`, `skeleton`, `tooltip` and a hook)
declare those too.

Browse everything at `/components` on the deployed site: each entry shows its
variants and the exact `add` command.

## Before the first deploy

The repository has no git remote yet, so the published URL is a placeholder.
Replace `<GITHUB_USER>` in:

- `apps/web/src/lib/registry-url.ts` — the single definition consumed by the app
- `scripts/build-registry.mjs` — the `homepage` field
- this file

Then set the Pages source to **GitHub Actions** in repository settings. The
workflow deploys on push to `master`.

If the repository is renamed, `base` in `apps/web/vite.config.ts` has to match
the new name.

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
| `docs/superpowers/` | The design spec and implementation plan |

## Theme

Zero radius, no shadows, a red primary, Play for display and IBM Plex Mono for
code. Beyond the standard shadcn tokens, the theme adds:

- `terminal-chrome`, `terminal-chrome-dim` — frame titles, status, brand
- `terminal-ink`, `terminal-ink-dim`, `terminal-ink-faint` — body and metadata
- `terminal-rule`, `terminal-edge`, `terminal-wash` — dividers, edges, fills
- `crt-glow`, `crt-bloom`, `crt-scanfill`, `hazard-stripe`, `ascii-fit` —
  utilities for the terminal idiom

Use those rather than one-off opacities, so the same intent reads the same way
everywhere.

The display face can be switched at runtime from the header; every option
carries a Cyrillic subset.
