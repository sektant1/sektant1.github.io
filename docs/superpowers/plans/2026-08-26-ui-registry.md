# skt-ui-toolkit Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the stock shadcn monorepo template into a distributable component registry with a working theme, the full `aria-lyra` suite, and a showcase site that doubles as the verification surface.

**Architecture:** Components live in `packages/ui/src`. A root `registry.json` declares each one as a registry item; `npx shadcn build` compiles that manifest into static JSON under `apps/web/public/r/`. GitHub Pages serves `apps/web`, so the same deploy is both the documentation site and the `npx shadcn add <url>` endpoint. A `skt-theme` item carries the entire visual identity and every component depends on it, so the theme cannot be omitted by a consumer.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4, `react-aria-components` (shadcn `aria-lyra` style), Vite 8, Turborepo, `react-router` 7, Vitest, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-26-ui-registry-design.md`

## Global Constraints

- Package manager is **npm** (`npm@11.11.0`); never introduce `pnpm` or `yarn` lockfiles. The README's `pnpm dlx` line is stale and gets corrected in Task 17.
- Node `>=20`.
- shadcn style is **`aria-lyra`** (`react-aria-components`), not Radix. Do not add `@radix-ui/*` packages by hand — only what `shadcn add` pulls in itself.
- Icon library is **`@tabler/icons-react`**. Do not introduce `lucide-react`.
- Theme values are frozen and must be copied verbatim from `packages/ui/src/styles/globals.css`: `--radius: 0rem`, `--spacing: 0.22rem`, all shadow tokens at zero opacity, `--font-sans: Chakra Petch, ui-sans-serif, sans-serif, system-ui`, `--font-mono: IBM Plex Mono, ui-monospace, monospace`, `--font-serif: Georgia, serif`, primary `oklch(0.5799 0.2203 25.1911)`.
- Every registry item of type `registry:ui` MUST declare `"registryDependencies": ["skt-theme"]`.
- The repo has **no git remote**. The registry URL uses the literal placeholder `<GITHUB_USER>` wherever it appears, and `REGISTRY_BASE_URL` in `apps/web/src/lib/registry-url.ts` is the single place it is defined.
- Prettier config is authoritative (`.prettierrc`): no semicolons, double quotes, 2-space indent. Run `npm run format` before every commit.
- Commit messages follow Conventional Commits and end with the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer.

---

## File Structure

**Created:**

| Path | Responsibility |
| --- | --- |
| `registry.json` | Registry manifest: one entry per distributable item |
| `scripts/build-registry.mjs` | Generates the `registry:ui` entries from `packages/ui/src/components/` so the manifest cannot drift by hand |
| `scripts/lib/registry-items.mjs` | Pure functions: scan components dir, derive an item, diff manifest vs disk. Imported by both the generator and its tests |
| `scripts/lib/registry-items.test.mjs` | Vitest tests for the pure functions above |
| `apps/web/src/lib/registry-url.ts` | Single definition of the published registry base URL |
| `apps/web/src/routes.tsx` | Route table |
| `apps/web/src/layout/app-shell.tsx` | Sidebar + header chrome shared by all routes |
| `apps/web/src/layout/theme-toggle.tsx` | Dark/light toggle, persisted |
| `apps/web/src/data/topics.ts` | Fixture topic + article data |
| `apps/web/src/data/exercises.ts` | Fixture practice-problem data |
| `apps/web/src/data/courses.ts` | Fixture course tracks, modules, lessons |
| `apps/web/src/data/tasks.ts` | Fixture task queue |
| `apps/web/src/data/snippets.ts` | Fixture snippet library |
| `apps/web/src/lib/use-local-state.ts` | `localStorage`-mirrored state hook, shared by tasks/notes/lessons |
| `apps/web/src/pages/codex.tsx` | `/` topic index |
| `apps/web/src/pages/topic.tsx` | `/topic/:slug` reference article |
| `apps/web/src/pages/courses.tsx` | `/courses` track index |
| `apps/web/src/pages/lesson.tsx` | `/courses/:slug` lesson runner |
| `apps/web/src/pages/tasks.tsx` | `/tasks` task board |
| `apps/web/src/pages/notes.tsx` | `/notes` split-pane notebook |
| `apps/web/src/pages/snippets.tsx` | `/snippets` snippet library |
| `apps/web/src/pages/practice.tsx` | `/practice` filterable catalogue |
| `apps/web/src/pages/submit.tsx` | `/submit` contribution form |
| `apps/web/src/pages/components/index.tsx` | `/components` verification index shell |
| `apps/web/src/pages/components/sections/*.tsx` | One file per component's variant matrix |
| `.github/workflows/ci.yml` | Typecheck, lint, build, registry drift check, Pages deploy |

**Modified:**

- `packages/ui/src/styles/globals.css` — font imports at the top.
- `packages/ui/package.json` — font deps in, orphan out.
- `apps/web/src/App.tsx`, `apps/web/src/main.tsx` — router mount.
- `apps/web/vite.config.ts` — Pages `base`.
- `package.json` (root) — `registry:build`, `registry:check`, `test` scripts; Vitest devDep.
- `turbo.json` — `registry:build` task.
- `README.md` — consumer instructions.

---

### Task 1: Make the theme actually apply

The theme currently declares two typefaces that are not installed. This task is first because every later visual judgement depends on the fonts being real.

**Files:**
- Modify: `packages/ui/package.json`
- Modify: `packages/ui/src/styles/globals.css:1`
- Modify: `apps/web/src/App.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a `globals.css` whose first six lines are the `@fontsource` imports followed by `@import "tailwindcss"`. Task 3 copies the `cssVars` out of this file.

- [ ] **Step 1: Confirm the defect before fixing it**

```bash
cd /home/gfe/Repos/shadcn/skt-ui-toolkit
grep -rn "chakra\|plex" packages/ui/package.json apps/web/package.json
```

Expected: no matches. That is the bug — `globals.css` asks for fonts nobody installed.

- [ ] **Step 2: Install the two typefaces, remove the orphan**

```bash
npm install --workspace @workspace/ui @fontsource/chakra-petch @fontsource/ibm-plex-mono
npm uninstall --workspace @workspace/ui @fontsource-variable/geist-mono
```

- [ ] **Step 3: Import them at the top of `globals.css`**

The imports must sit **above** `@import "tailwindcss"`. CSS `@import` rules must precede all other rules, and Tailwind's layer output should come last so utilities win the cascade.

Replace line 1 of `packages/ui/src/styles/globals.css`:

```css
@import "@fontsource/chakra-petch/400.css";
@import "@fontsource/chakra-petch/500.css";
@import "@fontsource/chakra-petch/600.css";
@import "@fontsource/chakra-petch/700.css";
@import "@fontsource/ibm-plex-mono/400.css";
@import "@fontsource/ibm-plex-mono/500.css";
@import "tailwindcss";
```

- [ ] **Step 4: Prove the fonts load in the browser**

```bash
npm run dev
```

Open the dev server URL. In the browser console:

```js
document.fonts.check("1em 'Chakra Petch'")
```

Expected: `true`. If `false`, the `@import` is below a non-import rule or the package name is wrong — fix before continuing. Stop the dev server when done.

- [ ] **Step 5: Put a font specimen on the page so regressions are visible**

Replace the body of `apps/web/src/App.tsx` with a temporary specimen (Task 6 replaces this file wholesale):

```tsx
import { Button } from "@workspace/ui/components/button"

export function App() {
  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Chakra Petch — sans</h1>
        <p className="text-muted-foreground text-sm">
          The quick brown fox jumps over the lazy dog 0123456789
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-2xl font-medium">IBM Plex Mono</h2>
        <p className="text-muted-foreground font-mono text-sm">
          const shadow = 0; // radius: 0rem
        </p>
      </div>
      <Button className="w-fit">Button</Button>
    </div>
  )
}
```

Reload the dev server and confirm the two headings render in visibly different typefaces, both distinct from the browser default.

- [ ] **Step 6: Verify the workspace still builds**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
npm run format
git add -A
git commit -m "fix: install and import the theme's typefaces

globals.css declared Chakra Petch and IBM Plex Mono but neither was
installed, so every surface fell back to system-ui. Installs both as
self-hosted fontsource packages and imports them ahead of Tailwind.
Drops @fontsource-variable/geist-mono, which nothing referenced.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Add the full component suite

**Files:**
- Create: `packages/ui/src/components/*.tsx` (61 new files)
- Modify: `packages/ui/package.json` (deps pulled in by shadcn)

**Interfaces:**
- Consumes: Task 1's working theme.
- Produces: every component file under `packages/ui/src/components/`. Task 3's generator scans exactly this directory.

- [ ] **Step 1: Add every `ui` item from the registry**

`components.json` in `packages/ui` already points at the `aria-lyra` style and the right aliases, so this writes into `packages/ui/src/components/`.

```bash
cd /home/gfe/Repos/shadcn/skt-ui-toolkit/packages/ui
npx shadcn@latest add --yes --overwrite \
  accordion alert alert-dialog aspect-ratio avatar badge breadcrumb button-group \
  calendar card carousel chart checkbox collapsible combobox command context-menu \
  dialog drawer dropdown-menu empty field form hover-card input input-group input-otp \
  item kbd label menubar native-select navigation-menu pagination popover progress \
  radio-group resizable scroll-area select separator sheet sidebar skeleton slider \
  sonner spinner switch table tabs textarea toggle toggle-group tooltip
```

`button` is omitted — it already exists and is the reference for the theme's look; do not overwrite it. `direction`, `attachment`, `bubble`, `marker`, `message`, and `message-scroller` are omitted from v1: the last four are chat-surface primitives with no place in the Codex showcase, and shipping components no route exercises would defeat the verification gate.

- [ ] **Step 2: Count what landed**

```bash
cd /home/gfe/Repos/shadcn/skt-ui-toolkit
ls packages/ui/src/components/*.tsx | wc -l
```

Expected: 52 or more (some items install several files — `sidebar` brings a hook, `form` brings helpers). Record the number; Step 4 explains any typecheck fallout.

- [ ] **Step 3: Check what dependencies were pulled in**

```bash
git diff packages/ui/package.json
```

Expect additions such as `recharts` (chart), `sonner`, `react-day-picker` or similar (calendar), `cmdk` or an aria equivalent (command), `embla-carousel-react` (carousel), `react-resizable-panels` (resizable). This is expected — the spec declares these per-item rather than hoisting them. Note the list; Task 3 maps each back to its component.

- [ ] **Step 4: Typecheck and fix fallout**

```bash
npm run typecheck
```

Generated components occasionally reference a hook or util that landed in a different alias path. Fix import paths to match this workspace's aliases (`@workspace/ui/lib/utils`, `@workspace/ui/hooks/*`). Do **not** silence errors with `any` or `@ts-expect-error` — if a component cannot typecheck cleanly, delete it and record it in the commit body as cut from v1.

- [ ] **Step 5: Lint and build**

```bash
npm run lint && npm run build
```

Fix genuine lint errors. If a generated file trips a stylistic rule the rest of the codebase does not care about, prefer fixing the file over widening the eslint config.

- [ ] **Step 6: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add the aria-lyra component suite

Adds every aria-lyra ui item except button (already present) and the
chat-surface primitives, which no showcase route exercises.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Registry manifest, generator, and drift check

The manifest must not be hand-maintained — 50+ entries edited by hand drift the moment a component is added. A generator derives it from disk, and a test-backed check fails CI when the two disagree.

**Files:**
- Create: `scripts/lib/registry-items.mjs`
- Create: `scripts/lib/registry-items.test.mjs`
- Create: `scripts/build-registry.mjs`
- Create: `registry.json`
- Modify: `package.json` (root)
- Modify: `turbo.json`

**Interfaces:**
- Consumes: the component files from Task 2, the `cssVars` in `packages/ui/src/styles/globals.css` from Task 1.
- Produces:
  - `scripts/lib/registry-items.mjs` exporting `componentNames(dir): string[]`, `buildItem(name, deps): RegistryItem`, and `diffManifest(manifest, names): { missing: string[], extra: string[] }`.
  - `registry.json` at the repo root.
  - npm scripts `registry:build`, `registry:check`, and `test`.

- [ ] **Step 1: Install Vitest at the root**

```bash
npm install -D -w . vitest
```

- [ ] **Step 2: Write the failing tests**

Create `scripts/lib/registry-items.test.mjs`:

```js
import { describe, expect, it } from "vitest"
import { buildItem, diffManifest } from "./registry-items.mjs"

describe("buildItem", () => {
  it("names the item after the component file", () => {
    expect(buildItem("accordion", {}).name).toBe("accordion")
  })

  it("always depends on the theme so consumers cannot miss it", () => {
    expect(buildItem("accordion", {}).registryDependencies).toEqual(["skt-theme"])
  })

  it("points at the component's source path with type registry:ui", () => {
    expect(buildItem("accordion", {}).files).toEqual([
      {
        path: "packages/ui/src/components/accordion.tsx",
        type: "registry:ui",
        target: "components/ui/accordion.tsx",
      },
    ])
  })

  it("attaches npm dependencies declared for that component", () => {
    expect(buildItem("chart", { chart: ["recharts"] }).dependencies).toEqual(["recharts"])
  })

  it("omits the dependencies key when a component needs none", () => {
    expect(buildItem("accordion", {})).not.toHaveProperty("dependencies")
  })
})

describe("diffManifest", () => {
  const manifest = { items: [{ name: "skt-theme" }, { name: "accordion" }] }

  it("reports a component on disk that the manifest forgot", () => {
    expect(diffManifest(manifest, ["accordion", "dialog"]).missing).toEqual(["dialog"])
  })

  it("reports a manifest entry with no component on disk", () => {
    expect(diffManifest(manifest, []).extra).toEqual(["accordion"])
  })

  it("ignores the theme item, which has no component file", () => {
    expect(diffManifest(manifest, ["accordion"])).toEqual({ missing: [], extra: [] })
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
npx vitest run scripts/lib/registry-items.test.mjs
```

Expected: FAIL — `Cannot find module './registry-items.mjs'`.

- [ ] **Step 4: Write the implementation**

Create `scripts/lib/registry-items.mjs`:

```js
import { readdirSync } from "node:fs"

export const THEME_ITEM_NAME = "skt-theme"

export function componentNames(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.replace(/\.tsx$/, ""))
    .sort()
}

export function buildItem(name, dependenciesByComponent) {
  const dependencies = dependenciesByComponent[name]
  return {
    name,
    type: "registry:ui",
    title: toTitle(name),
    description: `${toTitle(name)} component, themed for skt-ui-toolkit.`,
    registryDependencies: [THEME_ITEM_NAME],
    ...(dependencies ? { dependencies } : {}),
    files: [
      {
        path: `packages/ui/src/components/${name}.tsx`,
        type: "registry:ui",
        target: `components/ui/${name}.tsx`,
      },
    ],
  }
}

export function diffManifest(manifest, names) {
  const declared = manifest.items
    .map((item) => item.name)
    .filter((name) => name !== THEME_ITEM_NAME)
  return {
    missing: names.filter((name) => !declared.includes(name)),
    extra: declared.filter((name) => !names.includes(name)),
  }
}

function toTitle(name) {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
npx vitest run scripts/lib/registry-items.test.mjs
```

Expected: PASS, 8 tests.

- [ ] **Step 6: Write the generator**

Create `scripts/build-registry.mjs`. It writes the whole manifest, theme item included, so the theme's `cssVars` have exactly one source.

```js
import { readFileSync, writeFileSync } from "node:fs"
import { argv } from "node:process"
import { buildItem, componentNames, diffManifest } from "./lib/registry-items.mjs"

const COMPONENTS_DIR = "packages/ui/src/components"
const MANIFEST_PATH = "registry.json"

// Components whose generated source imports a package the consumer must install.
// Update this map when `shadcn add` pulls a new runtime dependency.
const DEPENDENCIES = {
  carousel: ["embla-carousel-react"],
  chart: ["recharts"],
  sonner: ["sonner"],
}

const themeItem = {
  name: "skt-theme",
  type: "registry:theme",
  title: "SKT Theme",
  description:
    "The skt-ui-toolkit visual identity: colors, zero radius, flat shadows and typefaces.",
  dependencies: [
    "@fontsource/chakra-petch",
    "@fontsource/ibm-plex-mono",
  ],
  cssVars: JSON.parse(readFileSync("scripts/theme-vars.json", "utf8")),
}

const names = componentNames(COMPONENTS_DIR)
const manifest = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "skt-ui-toolkit",
  homepage: "https://<GITHUB_USER>.github.io/skt-ui-toolkit",
  items: [themeItem, ...names.map((name) => buildItem(name, DEPENDENCIES))],
}

if (argv.includes("--check")) {
  const current = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
  const { missing, extra } = diffManifest(current, names)
  if (missing.length || extra.length) {
    console.error("registry.json is out of sync with", COMPONENTS_DIR)
    if (missing.length) console.error("  on disk but unregistered:", missing.join(", "))
    if (extra.length) console.error("  registered but missing on disk:", extra.join(", "))
    console.error("Run: npm run registry:build")
    process.exit(1)
  }
  console.log(`registry.json is in sync (${names.length} components)`)
} else {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n")
  console.log(`wrote ${MANIFEST_PATH} with ${names.length} components`)
}
```

- [ ] **Step 7: Extract the theme variables into `scripts/theme-vars.json`**

Copy the values verbatim out of `packages/ui/src/styles/globals.css` — the `:root` block becomes `light`, the `.dark` block becomes `dark`. Shape:

```json
{
  "light": {
    "background": "oklch(1.0000 0 0)",
    "foreground": "oklch(0.2178 0 0)",
    "primary": "oklch(0.5799 0.2203 25.1911)",
    "radius": "0rem",
    "spacing": "0.22rem",
    "font-sans": "Chakra Petch, ui-sans-serif, sans-serif, system-ui",
    "font-mono": "IBM Plex Mono, ui-monospace, monospace",
    "font-serif": "Georgia, serif"
  },
  "dark": {
    "background": "oklch(0.2178 0 0)",
    "foreground": "oklch(0.9612 0 0)"
  }
}
```

Include **every** custom property from both blocks, not just the ones shown. Drop the leading `--` from each key — shadcn adds it back. Verify with:

```bash
grep -c "^  --" packages/ui/src/styles/globals.css
```

and confirm your `light` + `dark` key counts add up to that number.

- [ ] **Step 8: Wire up the npm scripts**

In the root `package.json` `scripts`:

```json
"test": "vitest run",
"registry:build": "node scripts/build-registry.mjs && shadcn build --output apps/web/public/r",
"registry:check": "node scripts/build-registry.mjs --check"
```

In `turbo.json` `tasks`, add:

```json
"registry:build": {
  "dependsOn": ["^build"],
  "outputs": ["apps/web/public/r/**"]
}
```

- [ ] **Step 9: Generate the manifest and the JSON endpoint**

```bash
npm run registry:build
ls apps/web/public/r/ | wc -l
cat apps/web/public/r/button.json
```

Expected: one JSON per item plus `registry.json`; `button.json` shows `"registryDependencies": ["skt-theme"]` and the component source inlined under `files[0].content`.

- [ ] **Step 10: Prove the drift check catches drift**

```bash
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('registry.json'));m.items=m.items.filter(i=>i.name!=='accordion');fs.writeFileSync('/tmp/registry.bak',fs.readFileSync('registry.json'));fs.writeFileSync('registry.json',JSON.stringify(m,null,2))"
npm run registry:check
```

Expected: exits non-zero, prints `on disk but unregistered: accordion`. Restore and re-check:

```bash
cp /tmp/registry.bak registry.json
npm run registry:check
```

Expected: exits zero.

- [ ] **Step 11: Ignore the generated output from prettier**

Add to `.prettierignore`:

```
apps/web/public/r
```

- [ ] **Step 12: Commit**

```bash
npm run format
git add -A
git commit -m "feat: generate the shadcn registry from disk

registry.json is derived from packages/ui/src/components rather than
hand-edited, and registry:check fails when the two drift. Every ui item
depends on skt-theme, so a consumer cannot install a component without
the theme it was designed against.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Router, app shell, and theme toggle

**Files:**
- Modify: `apps/web/package.json`, `apps/web/src/main.tsx`, `apps/web/src/App.tsx`
- Create: `apps/web/src/routes.tsx`, `apps/web/src/layout/app-shell.tsx`, `apps/web/src/layout/theme-toggle.tsx`, `apps/web/src/lib/registry-url.ts`
- Delete: `apps/web/src/components/theme-provider.tsx` if it is superseded

**Interfaces:**
- Consumes: `sidebar`, `button`, `separator`, `breadcrumb` from Task 2.
- Produces:
  - `AppShell` — wraps `<Outlet />` with the sidebar and header. Nav entries: Codex `/`, Practice `/practice`, Submit `/submit`, Components `/components`.
  - `ThemeToggle` — toggles `.dark` on `document.documentElement`, persists under the `localStorage` key `skt-theme`.
  - `REGISTRY_BASE_URL: string` from `registry-url.ts`.

- [ ] **Step 1: Install the router**

```bash
npm install --workspace web react-router
```

- [ ] **Step 2: Define the registry URL in one place**

Create `apps/web/src/lib/registry-url.ts`:

```ts
// Replace <GITHUB_USER> once the repository has a remote. This is the only
// place the published registry URL is defined.
export const REGISTRY_BASE_URL =
  "https://<GITHUB_USER>.github.io/skt-ui-toolkit/r"

export function addCommand(item: string) {
  return `npx shadcn@latest add ${REGISTRY_BASE_URL}/${item}.json`
}
```

- [ ] **Step 3: Write the theme toggle**

Create `apps/web/src/layout/theme-toggle.tsx`. Read the stored value before first paint to avoid a flash, and treat a throwing `localStorage` (private mode) as "no preference":

```tsx
import { useEffect, useState } from "react"
import { IconMoon, IconSun } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"

const STORAGE_KEY = "skt-theme"

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark"
  } catch {
    return false
  }
}

export function ThemeToggle() {
  const [dark, setDark] = useState(readStored)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    try {
      localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light")
    } catch {
      // Private mode — the toggle still works for this session.
    }
  }, [dark])

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onPress={() => setDark((value) => !value)}
    >
      {dark ? <IconSun /> : <IconMoon />}
    </Button>
  )
}
```

- [ ] **Step 4: Build the app shell**

Create `apps/web/src/layout/app-shell.tsx` using the `sidebar` component from Task 2. Requirements:

- `SidebarProvider` + `Sidebar` on the inline-start edge, `SidebarInset` holding `<Outlet />`.
- Brand block at the sidebar header reading `SKT CODEX` in `font-mono`, uppercase, with `tracking-wide`.
- Nav group "Learn" containing Codex, Courses and Practice; nav group "Workspace" containing Tasks, Notes and Snippets; nav group "Toolkit" containing Submit and Components.
- Active route marked with the sidebar's `isActive` prop, driven by `useLocation()`.
- Header bar containing `SidebarTrigger`, a `Separator` with `orientation="vertical"`, a slot where routes render their own breadcrumb, and `ThemeToggle` pushed to the inline-end.

- [ ] **Step 5: Wire the routes**

Create `apps/web/src/routes.tsx` mapping `/` → `Codex`, `/topic/:slug` → `Topic`, `/courses` → `Courses`, `/courses/:slug` → `Lesson`, `/tasks` → `Tasks`, `/notes` → `Notes`, `/snippets` → `Snippets`, `/practice` → `Practice`, `/submit` → `Submit`, `/components` → `ComponentsIndex`, all as children of `AppShell`. Until Tasks 5–15 land, point each at a stub returning its own name so the router can be verified now.

Mount it in `apps/web/src/App.tsx` with `createBrowserRouter` + `RouterProvider`, using `basename: import.meta.env.BASE_URL` so the Pages subdirectory deploy works.

- [ ] **Step 6: Verify navigation and the toggle**

```bash
npm run dev
```

Click through every nav entry — each renders its stub, and the active entry is visibly marked. Toggle the theme, reload, and confirm the choice survived.

- [ ] **Step 7: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 8: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add router, app shell and persisted theme toggle

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Fixture data

Real-shaped content, written before the pages, so the layouts are built against awkward data rather than retrofitted to it.

**Files:**
- Create: `apps/web/src/data/topics.ts`, `apps/web/src/data/exercises.ts`

**Interfaces:**
- Produces:

```ts
export type Difficulty = "intro" | "working" | "deep"

export type Topic = {
  slug: string
  title: string
  area: "Rendering" | "Physics" | "ECS" | "Shaders" | "Netcode" | "Tooling"
  summary: string
  readingMinutes: number
  progress: number // 0–100
  prerequisites: string[] // slugs of other topics
  sections: { heading: string; body: string; code?: { lang: string; source: string } }[]
  caveats: string[]
  references: { label: string; href: string }[]
}

export type Exercise = {
  id: string
  title: string
  area: Topic["area"]
  difficulty: Difficulty
  languages: string[]
  estimateMinutes: number
  summary: string
}

export const topics: Topic[]
export const exercises: Exercise[]
```

- [ ] **Step 1: Write at least eight topics across all six areas**

Cover the areas named in the spec. Suggested subjects: deferred shading and the G-buffer; the rendering equation; GJK collision detection; the fixed timestep accumulator; archetype vs sparse-set ECS storage; signed distance fields; client-side prediction and reconciliation; hot-reloading an asset pipeline.

Each topic needs three or more `sections`, at least two `caveats`, and at least two `references`. Give at least one topic a deliberately long title (60+ characters) and one an empty `prerequisites` array — the layouts must survive both.

- [ ] **Step 2: Write at least twenty exercises**

Spread across all six areas, all three difficulties, and a mix of `languages` drawn from `["C++", "Rust", "TypeScript", "GLSL", "WGSL", "C#"]`. Twenty is the floor because `/practice` paginates, and pagination cannot be verified against a list that fits on one page.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add codex fixture content

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: `/` — the Codex index

**Files:**
- Create: `apps/web/src/pages/codex.tsx`
- Modify: `apps/web/src/routes.tsx` (replace the stub)

**Interfaces:**
- Consumes: `topics` from Task 5; `card`, `item`, `badge`, `avatar`, `separator`, `empty`, `skeleton`, `progress`, `navigation-menu` from Task 2.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Build the page**

Requirements:

- A masthead: `SKT CODEX` in mono uppercase, a one-line subtitle, and a `Badge` showing the topic count.
- Topics grouped by `area`, each group headed by the area name and a `Separator`.
- Each topic is a `Card` linking to `/topic/:slug`, showing title, summary, a `Badge` per area, reading time, and a `Progress` bar bound to `topic.progress`.
- A "Continue" strip at the top listing topics with `progress > 0 && progress < 100` using `Item`. When none match, render `Empty` with a real message — not a blank div.
- A `Skeleton` variant of the card grid behind a 400 ms artificial delay on first mount, so the loading state is actually exercised and reviewable.

- [ ] **Step 2: Review it in the browser, both themes**

```bash
npm run dev
```

Check: no horizontal scroll at 375 px width; the long-titled topic from Task 5 does not break the card grid; the empty state renders when you temporarily zero every `progress`.

- [ ] **Step 3: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 4: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add the codex topic index route

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: `/topic/:slug` — the reference article

**Files:**
- Create: `apps/web/src/pages/topic.tsx`
- Modify: `apps/web/src/routes.tsx`

**Interfaces:**
- Consumes: `topics` from Task 5; `breadcrumb`, `tabs`, `accordion`, `alert`, `table`, `kbd`, `tooltip`, `hover-card`, `scroll-area`, `collapsible`, `progress`, `separator` from Task 2.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Build the page**

Requirements:

- `Breadcrumb`: Codex → area → topic title, rendered into the shell's breadcrumb slot.
- `Tabs` with three panels: **Reference** (the `sections`), **Caveats** (the `caveats` as `Alert`s with `variant="destructive"` where the caveat warns of a correctness trap), **References** (the links in a `Table`).
- Code blocks in `font-mono` inside a `ScrollArea` with `overflow-x: auto`, so a long line scrolls in its own box and never scrolls the page.
- Prerequisites as links, each wrapped in a `HoverCard` previewing the prerequisite's summary. A topic with no prerequisites renders nothing here, not an empty heading.
- A `Kbd` hint in the article footer, and a `Tooltip` on the reading-time figure explaining how it is estimated.
- An unknown `:slug` renders `Empty` with a link back to `/` — never a crash or a blank page.

- [ ] **Step 2: Verify the unknown-slug path**

Visit `/topic/does-not-exist`. Expected: the empty state, no console error.

- [ ] **Step 3: Review in the browser, both themes**

Confirm long code lines scroll inside their own container and the page body does not scroll horizontally at 375 px.

- [ ] **Step 4: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add the topic reference route

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: `useLocalState` — persisted learner state

Tasks, notes, and lesson progress all need the same thing: state a learner expects to
survive a reload, in a browser that may refuse to store anything. One hook, three
consumers.

**Files:**
- Create: `apps/web/src/lib/use-local-state.ts`
- Create: `apps/web/src/lib/use-local-state.test.ts`

**Interfaces:**
- Produces: `useLocalState<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void]`.
  Keys are namespaced `skt:` by the hook, so callers pass `"tasks"`, not `"skt:tasks"`.

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/lib/use-local-state.test.ts` covering: reads the stored value on
mount; falls back to `initial` when nothing is stored; falls back to `initial` when the
stored JSON is corrupt; writes through on update; does not throw when `localStorage`
throws. Use `vitest` with `happy-dom`, and stub a throwing `localStorage` for the last
case.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run apps/web/src/lib/use-local-state.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Namespace the key, JSON round-trip the value, and wrap every `localStorage` access in
`try`/`catch`. A corrupt or unreadable entry resolves to `initial` rather than crashing
the route.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run apps/web/src/lib/use-local-state.test.ts
```

- [ ] **Step 5: Commit**

```bash
npm run format && git add -A
git commit -m "feat: add localStorage-mirrored state hook

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: `/courses` and `/courses/:slug` — tracks and the lesson runner

**Files:**
- Create: `apps/web/src/data/courses.ts`, `apps/web/src/pages/courses.tsx`, `apps/web/src/pages/lesson.tsx`
- Modify: `apps/web/src/routes.tsx`

**Interfaces:**
- Consumes: `useLocalState` (Task 8); `accordion`, `progress`, `card`, `aspect-ratio`, `carousel`, `hover-card`, `avatar`, `badge`, `resizable`, `tabs`, `alert`, `spinner`, `kbd`, `scroll-area` from Task 2.
- Produces:

```ts
export type Lesson = {
  slug: string
  title: string
  brief: string
  starter: string   // code the editor pane opens with
  checks: string[]  // human-readable assertions shown beside the editor
}
export type Module = { title: string; lessons: Lesson[] }
export type Course = {
  slug: string
  title: string
  area: Topic["area"]
  summary: string
  level: Difficulty
  modules: Module[]
}
export const courses: Course[]
```

- [ ] **Step 1: Write at least four courses**

Suggested: "Write a Software Rasterizer", "Build an ECS From Scratch", "Shading Models
From Lambert to GGX", "Rollback Netcode for Fighting Games". Each needs three or more
modules and eight or more lessons total. Give one course a single module — the accordion
must not look broken with one child.

- [ ] **Step 2: Build `/courses`**

- A `Carousel` of featured tracks at the top, each slide a `Card` with an `AspectRatio`
  cover block (a CSS gradient, no image asset).
- Below, every course as an `Accordion` item: modules expand to their lesson list, each
  lesson linking to `/courses/:slug`.
- A `Progress` bar per course driven by completed lessons from `useLocalState`.
- A `HoverCard` on each lesson previewing its brief.

- [ ] **Step 3: Build `/courses/:slug` — the lesson runner**

- A `ResizablePanelGroup` splitting brief (left) from editor (right); the divider drags.
- The editor is a `Textarea` in `font-mono` seeded with `lesson.starter`, its content in
  `useLocalState` keyed by lesson slug.
- `Tabs` over the right pane: **Editor** and **Checks**, the latter listing
  `lesson.checks` as `Alert`s.
- A "Run" button that shows a `Spinner` for 600 ms then marks the lesson complete and
  advances the course `Progress`. No execution — the check result is simulated, and the
  UI says so in a one-line note rather than implying real evaluation.
- `Kbd` hints for the run shortcut.
- An unknown `:slug` renders `Empty` with a link back to `/courses`.

- [ ] **Step 4: Verify persistence and the single-module case**

Complete a lesson, reload — it stays complete. Edit the textarea, reload — the text
survives. Open the single-module course and confirm the accordion renders sanely.

- [ ] **Step 5: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 6: Commit**

```bash
npm run format && git add -A
git commit -m "feat: add course tracks and the lesson runner

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: `/tasks` — the task board

**Files:**
- Create: `apps/web/src/data/tasks.ts`, `apps/web/src/pages/tasks.tsx`
- Modify: `apps/web/src/routes.tsx`

**Interfaces:**
- Consumes: `useLocalState` (Task 8); `checkbox`, `table`, `context-menu`, `dropdown-menu`, `menubar`, `alert-dialog`, `toggle`, `badge`, `skeleton`, `empty` from Task 2.
- Produces:

```ts
export type TaskState = "todo" | "doing" | "done"
export type Task = {
  id: string
  title: string
  state: TaskState
  area: Topic["area"]
  due?: string // ISO date
  linkedTopic?: string // topic slug
}
export const seedTasks: Task[]
```

- [ ] **Step 1: Write at least fifteen seed tasks**

Spread across all three states and all six areas. Give at least two an overdue `due`
date and at least three no `due` at all — the table must render both without a hole.

- [ ] **Step 2: Build the board**

- A `Menubar` across the top: **Task** (new, clear completed), **View** (group by state /
  by area), **Filter** (toggle overdue only).
- Tasks in a `Table`, grouped per the View setting, each row with a `Checkbox` for
  completion, a `Badge` for area, and an overdue `Badge` in the destructive variant.
- A `ContextMenu` on each row: move to state, open linked topic, delete.
- A `DropdownMenu` in the row's trailing cell mirroring those actions for keyboard and
  touch users — a context menu alone is not reachable for either.
- Delete opens an `AlertDialog` to confirm.
- All state through `useLocalState` under the key `tasks`, seeded from `seedTasks` on
  first visit.
- Zero tasks in a group renders `Empty`, not a bare heading.

- [ ] **Step 3: Verify**

Complete a task, reload — still complete. Delete one, confirm the dialog blocks until
answered. Switch grouping and confirm no task disappears; the counts must add up to the
same total in both groupings.

- [ ] **Step 4: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
npm run format && git add -A
git commit -m "feat: add the task board route

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: `/notes` — the notebook

**Files:**
- Create: `apps/web/src/pages/notes.tsx`
- Modify: `apps/web/src/routes.tsx`

**Interfaces:**
- Consumes: `useLocalState` (Task 8), `topics` (Task 5); `resizable`, `textarea`, `scroll-area`, `collapsible`, `sheet`, `separator`, `kbd`, `empty`, `input` from Task 2.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Build the notebook**

- `ResizablePanelGroup`: a note list on the inline-start, the editor on the inline-end.
- The list is grouped by topic area in `Collapsible` sections, filtered by an `Input`.
- The editor is a `Textarea` in `font-mono`, its body in `useLocalState` keyed by note id,
  with a "saved" indicator that appears on write and fades.
- A `Sheet` holds note metadata: linked topic, created date, word count.
- `Kbd` hints for new-note and focus-search shortcuts, wired with a `window` listener that
  is removed on unmount.
- No notes yet renders `Empty` with a "New note" action that actually creates one.

- [ ] **Step 2: Verify**

Write a note, reload — the text survives. Create a note from the empty state and confirm
the list, the editor, and the metadata sheet all agree on it. Resize the split and confirm
neither pane collapses to unusable width.

- [ ] **Step 3: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 4: Commit**

```bash
npm run format && git add -A
git commit -m "feat: add the notebook route

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: `/snippets` — the snippet library

**Files:**
- Create: `apps/web/src/data/snippets.ts`, `apps/web/src/pages/snippets.tsx`
- Modify: `apps/web/src/routes.tsx`

**Interfaces:**
- Consumes: `command`, `tabs`, `scroll-area`, `kbd`, `tooltip`, `dropdown-menu`, `badge`, `popover`, `empty` from Task 2.
- Produces:

```ts
export type Snippet = {
  id: string
  title: string
  language: "C++" | "Rust" | "TypeScript" | "GLSL" | "WGSL" | "C#"
  area: Topic["area"]
  description: string
  source: string
}
export const snippets: Snippet[]
```

- [ ] **Step 1: Write at least twelve snippets**

Real, useful fragments: a GGX distribution term in GLSL, a fixed-timestep loop in C++, a
sparse-set insert in Rust, a ring buffer for input prediction in TypeScript. Include one
with lines past 100 characters — horizontal scroll must be verified, not assumed.

- [ ] **Step 2: Build the library**

- `Tabs` across languages, plus an "All" tab.
- Each snippet in a bordered block: title, `Badge` for language and area, description, and
  the source in `font-mono` inside a `ScrollArea` with `overflow-x: auto`.
- A copy button per snippet with a `Tooltip`, switching to a confirmation state on click.
- A `DropdownMenu` per snippet: copy, copy as import, open linked area.
- `Command` search over title, description, and source, opened with `⌘K` / `Ctrl+K`.
- An empty language tab renders `Empty`.

- [ ] **Step 3: Verify**

Confirm the long-line snippet scrolls inside its own box and the page body does not scroll
horizontally at 375 px. Copy a snippet and paste it somewhere to confirm the clipboard
write actually happened.

- [ ] **Step 4: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
npm run format && git add -A
git commit -m "feat: add the snippet library route

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: `/practice` — the exercise catalogue

**Files:**
- Create: `apps/web/src/pages/practice.tsx`
- Modify: `apps/web/src/routes.tsx`

**Interfaces:**
- Consumes: `exercises` from Task 5; `input`, `combobox`, `select`, `native-select`, `checkbox`, `radio-group`, `slider`, `toggle-group`, `pagination`, `command`, `popover`, `badge`, `table`, `empty` from Task 2.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Build the page**

Requirements:

- A filter bar: text `Input` over title and summary; `ToggleGroup` for area; `RadioGroup` for difficulty; `Checkbox` group for languages; `Slider` capping `estimateMinutes`.
- Results in a `Table` with a `Badge` for difficulty, filtered live, paginated at 8 per page with `Pagination`.
- A `Command` palette in a `Popover`, opened with `⌘K` / `Ctrl+K`, jumping straight to an exercise. Bind the key with an effect on `window`; remove the listener on unmount.
- Filters that match nothing render `Empty` with a "Clear filters" button that actually clears them.
- Changing any filter resets to page 1. A filter change that leaves the reader stranded on a now-empty page 4 is the bug this prevents.

- [ ] **Step 2: Verify the filter and pagination interaction**

Filter to a single result while on page 3. Expected: one result, page 1, no empty table.

- [ ] **Step 3: Verify the palette**

Press `⌘K` / `Ctrl+K`, type an exercise title, press Enter. Expected: navigation to that exercise's row or topic. Press Escape and confirm the listener does not leak — navigate away and back, then confirm the palette still opens exactly once per keypress.

- [ ] **Step 4: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add the practice catalogue route

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 14: `/submit` — the contribution form

**Files:**
- Create: `apps/web/src/pages/submit.tsx`
- Modify: `apps/web/src/routes.tsx`

**Interfaces:**
- Consumes: `form`, `field`, `label`, `input`, `input-group`, `input-otp`, `textarea`, `select`, `switch`, `button-group`, `dialog`, `drawer`, `sheet`, `sonner`, `calendar`, `spinner`, `alert-dialog` from Task 2.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Build the form**

Requirements:

- Fields: title (required, 8–80 chars), area (`Select`), difficulty (`ButtonGroup`), summary (`Textarea`, required, max 280 with a live counter), source URL (`InputGroup` with a `https://` prefix addon), publish date (`Calendar` in a `Popover`), "notify me" (`Switch`), and a six-digit `InputOtp` labelled as a contributor code.
- Validation with `zod` — already a dependency of `packages/ui`. Errors render through the `Field` component's error slot, and the form does not submit while invalid.
- Submit shows a `Spinner` in the button for a simulated 800 ms, then fires a `sonner` toast confirming receipt and resets the form. No network call.
- A "Preview" button opens the submission in a `Dialog` on desktop and a `Drawer` on narrow viewports.
- Navigating away with unsaved changes opens an `AlertDialog` confirming the discard.

- [ ] **Step 2: Verify validation actually blocks**

Submit the empty form. Expected: inline errors on every required field, no toast. Fill it correctly and submit. Expected: spinner, then toast, then a cleared form.

- [ ] **Step 3: Verify the responsive preview switch**

At 1280 px the preview is a `Dialog`; at 375 px it is a `Drawer`.

- [ ] **Step 4: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add the submission form route

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 15: `/components` — the verification index

This is the gate surface from the spec. It must cover **every** registered component, or the coverage claim is false.

**Files:**
- Create: `apps/web/src/pages/components/index.tsx`
- Create: `apps/web/src/pages/components/sections/*.tsx` (one per component)
- Modify: `apps/web/src/routes.tsx`

**Interfaces:**
- Consumes: every component from Task 2; `addCommand` from `apps/web/src/lib/registry-url.ts` (Task 4).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Define the section contract**

Every section file exports a component with this shape, so the index can render them uniformly:

```tsx
export type SectionProps = { name: string }

export const meta = { name: "accordion", title: "Accordion" }
export function Section() {
  return null // every variant and size rendered here
}
```

- [ ] **Step 2: Write one section per component**

Each section renders every `variant` and every `size` the component's `cva` config exposes — read the actual variant keys out of the component source rather than guessing. Interactive components render in both their resting and active states where that is reachable without a click.

- [ ] **Step 3: Build the index page**

A sticky in-page nav listing all sections alphabetically, and each section rendered under a heading with a copy-to-clipboard button carrying `addCommand(meta.name)`.

- [ ] **Step 4: Verify coverage mechanically**

The count of sections must equal the count of registered components:

```bash
ls apps/web/src/pages/components/sections/*.tsx | wc -l
node -e "console.log(JSON.parse(require('fs').readFileSync('registry.json')).items.filter(i=>i.type==='registry:ui').length)"
```

Expected: identical numbers. If they differ, a component is unverified — write the missing section.

- [ ] **Step 5: Check the console is clean**

Load `/components` and read the browser console. Expected: zero errors and zero React warnings. Any component that warns is fixed here, or cut from `packages/ui` and the registry regenerated with `npm run registry:build` — and named in the commit body.

- [ ] **Step 6: Review both themes**

Scroll the whole page in light and dark. Confirm: radius is 0 everywhere, no shadows, both typefaces present, no component falls back to unstyled defaults.

- [ ] **Step 7: Typecheck, lint, build**

```bash
npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 8: Commit**

```bash
npm run format
git add -A
git commit -m "feat: add the component verification index

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 16: CI and GitHub Pages

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `apps/web/vite.config.ts`

**Interfaces:**
- Consumes: the `registry:check`, `typecheck`, `lint`, `build`, `test` scripts.
- Produces: a deployed site at `https://<GITHUB_USER>.github.io/skt-ui-toolkit`.

- [ ] **Step 1: Set the Pages base path**

In `apps/web/vite.config.ts`, add `base: "/skt-ui-toolkit/"` to the config object. Task 4's router already reads `import.meta.env.BASE_URL`, so routing follows automatically.

- [ ] **Step 2: Verify the base path locally**

```bash
npm run build --workspace web
npx vite preview --base /skt-ui-toolkit/ --outDir apps/web/dist
```

Navigate to `/skt-ui-toolkit/components`. Expected: it loads, and assets resolve without 404s.

- [ ] **Step 3: Write the workflow**

`.github/workflows/ci.yml` with two jobs.

`verify` — runs on `pull_request` and `push`:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
- run: npm ci
- run: npm run registry:check
- run: npm run test
- run: npm run typecheck
- run: npm run lint
- run: npm run build
```

`deploy` — `needs: verify`, `if: github.ref == 'refs/heads/master'`, with `permissions: { pages: write, id-token: write }`, running `npm run registry:build`, then `actions/upload-pages-artifact@v3` with `path: apps/web/dist`, then `actions/deploy-pages@v4`.

Note the branch is `master`, not `main`.

- [ ] **Step 4: Verify the whole gate passes locally**

```bash
npm run registry:check && npm run test && npm run typecheck && npm run lint && npm run build
```

Expected: all pass. This is exactly what CI runs.

- [ ] **Step 5: Commit**

```bash
npm run format
git add -A
git commit -m "ci: verify on PR and deploy the registry to GitHub Pages

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 17: Consumer documentation

The registry is worthless if the next project cannot work out how to consume it.

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Rewrite the README**

It currently documents the stock template and tells the reader to run `pnpm dlx`, which is wrong for this npm workspace. Replace with:

- **What this is** — one paragraph.
- **Using it in a new project**: run `npx shadcn@latest init` in the consuming project, then
  `npx shadcn@latest add https://<GITHUB_USER>.github.io/skt-ui-toolkit/r/button.json`.
  State explicitly that the theme installs itself on the first component added.
- **Before first deploy** — replace `<GITHUB_USER>` in `apps/web/src/lib/registry-url.ts`, `scripts/build-registry.mjs`, and this README; confirm the Pages source is set to GitHub Actions.
- **Developing the toolkit** — `npm run dev`, `npm run registry:build`, and the rule that a new component means running `registry:build` or CI fails.
- **Browsing components** — link to `/components`.

- [ ] **Step 2: Verify every command in the README runs**

Copy each command out of the README and run it. A README command that fails is a defect.

- [ ] **Step 3: Commit**

```bash
npm run format
git add -A
git commit -m "docs: document consuming and developing the registry

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Definition of done

- `npm run registry:check && npm run test && npm run typecheck && npm run lint && npm run build` passes.
- `apps/web/public/r/` holds one JSON per registered item, each `registry:ui` item depending on `skt-theme`.
- All nine product routes plus `/components` render, in both themes, with a clean console.
- The `/components` section count equals the registered component count.
- Any component cut from v1 is named, with its reason, in a commit body.
