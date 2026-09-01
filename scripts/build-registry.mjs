import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { argv, exit } from "node:process"
import {
  buildItem,
  collectItemImports,
  componentNames,
  diffManifest,
} from "./lib/registry-items.mjs"
// The theme is read out of the stylesheet that defines it, for the same reason
// the dependencies below are read out of the components: a second copy drifts.
import { readThemeVars } from "./lib/theme-vars.mjs"
// The showcase owns the published address; the manifest borrows it rather than
// restating it, so `homepage` and the `shadcn add` command cannot drift apart.
import { SHOWCASE_URL } from "../apps/web/src/lib/registry-url.ts"

const COMPONENTS_DIR = "packages/ui/src/components"
const SOURCE_DIRS = {
  components: COMPONENTS_DIR,
  hooks: "packages/ui/src/hooks",
  lib: "packages/ui/src/lib",
}
const MANIFEST_PATH = "registry.json"

// The npm dependencies used to be a map maintained here by hand, and 42 of the
// 66 published items were missing one — `shadcn add button` installed a
// component that imports react-aria-components and never installed it. They
// are read out of the source now, so the item cannot disagree with the file.
const EXTENSIONS = { components: ".tsx", hooks: ".ts", lib: ".ts" }

function readSource(kind, name) {
  const path = `${SOURCE_DIRS[kind]}/${name}${EXTENSIONS[kind]}`
  return existsSync(path) ? readFileSync(path, "utf8") : undefined
}

const themeItem = {
  name: "skt-theme",
  type: "registry:theme",
  title: "SKT Theme",
  description:
    "The skt-ui-toolkit visual identity: colors, zero radius, flat shadows and typefaces.",
  // The faces the theme actually falls back to: Play behind --font-display and
  // IBM Plex Mono behind --font-mono and --font-body. It used to name
  // chakra-petch, which matched the stale font-sans in the hand-kept vars file
  // and no longer matches anything the stylesheet says.
  dependencies: ["@fontsource/play", "@fontsource/ibm-plex-mono"],
  cssVars: readThemeVars(),
}

const names = componentNames(COMPONENTS_DIR)
const manifest = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "skt-ui-toolkit",
  homepage: SHOWCASE_URL,
  items: [
    themeItem,
    ...names.map((name) => buildItem(name, collectItemImports(name, readSource))),
  ],
}

// A package derived from an import but absent from the workspace manifest is
// either a typo or a dependency nobody installed. Publishing it would tell the
// consumer to install something that does not exist, so it stops the build.
const workspaceDeps = new Set(
  Object.keys(
    JSON.parse(readFileSync("packages/ui/package.json", "utf8")).dependencies ??
      {}
  )
)
const undeclared = manifest.items
  .flatMap((item) =>
    (item.dependencies ?? []).map((pkg) => [item.name, pkg])
  )
  .filter(([, pkg]) => !workspaceDeps.has(pkg))

if (undeclared.length) {
  console.error("components import packages that packages/ui does not declare:")
  for (const [item, pkg] of undeclared) console.error(`  ${item} → ${pkg}`)
  console.error("Add it to packages/ui/package.json, or fix the import.")
  exit(1)
}

const serialized = JSON.stringify(manifest, null, 2) + "\n"

if (argv.includes("--check")) {
  // Compared whole, not by name. Checking only the component list is what let
  // a missing npm dependency ship: every name matched, and the item was still
  // wrong. Any drift at all — a dependency, a file path, a title — fails here.
  const current = readFileSync(MANIFEST_PATH, "utf8")
  if (current !== serialized) {
    console.error("registry.json is out of sync with", COMPONENTS_DIR)
    const { missing, extra } = diffManifest(JSON.parse(current), names)
    if (missing.length)
      console.error("  on disk but unregistered:", missing.join(", "))
    if (extra.length)
      console.error("  registered but missing on disk:", extra.join(", "))
    if (!missing.length && !extra.length)
      console.error("  same components, different item contents")
    console.error("Run: npm run registry:build")
    exit(1)
  }
  console.log(`registry.json is in sync (${names.length} components)`)
} else {
  writeFileSync(MANIFEST_PATH, serialized)
  console.log(`wrote ${MANIFEST_PATH} with ${names.length} components`)
}
