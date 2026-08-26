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
  const title = toTitle(name)
  return {
    name,
    type: "registry:ui",
    title,
    description: `${title} component, themed for skt-ui-toolkit.`,
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
