import { readFileSync, writeFileSync } from "node:fs"
import { argv, exit } from "node:process"
import {
  buildItem,
  componentNames,
  diffManifest,
  parseImports,
} from "./lib/registry-items.mjs"

const COMPONENTS_DIR = "packages/ui/src/components"
const MANIFEST_PATH = "registry.json"

// Components whose generated source imports a package the consumer must
// install. Update this map when `shadcn add` pulls in a new runtime dependency.
const DEPENDENCIES = {
  "ascii-banner": ["figlet", "vault66-crt-effect"],
  "ascii-banner-view": ["vault66-crt-effect"],
  carousel: ["embla-carousel-react"],
  chart: ["recharts"],
  "input-otp": ["input-otp"],
  resizable: ["react-resizable-panels"],
  sonner: ["sonner", "next-themes"],
}

const themeItem = {
  name: "skt-theme",
  type: "registry:theme",
  title: "SKT Theme",
  description:
    "The skt-ui-toolkit visual identity: colors, zero radius, flat shadows and typefaces.",
  dependencies: ["@fontsource/chakra-petch", "@fontsource/ibm-plex-mono"],
  cssVars: JSON.parse(readFileSync("scripts/theme-vars.json", "utf8")),
}

const names = componentNames(COMPONENTS_DIR)
const manifest = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "skt-ui-toolkit",
  homepage: "https://sektant.dev/showcase",
  items: [
    themeItem,
    ...names.map((name) =>
      buildItem(
        name,
        DEPENDENCIES,
        parseImports(readFileSync(`${COMPONENTS_DIR}/${name}.tsx`, "utf8"))
      )
    ),
  ],
}

if (argv.includes("--check")) {
  const current = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
  const { missing, extra } = diffManifest(current, names)
  if (missing.length || extra.length) {
    console.error("registry.json is out of sync with", COMPONENTS_DIR)
    if (missing.length) console.error("  on disk but unregistered:", missing.join(", "))
    if (extra.length) console.error("  registered but missing on disk:", extra.join(", "))
    console.error("Run: npm run registry:build")
    exit(1)
  }
  console.log(`registry.json is in sync (${names.length} components)`)
} else {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n")
  console.log(`wrote ${MANIFEST_PATH} with ${names.length} components`)
}
