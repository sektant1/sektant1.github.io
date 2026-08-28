import { readdirSync } from "node:fs"

export const THEME_ITEM_NAME = "skt-theme"

export function componentNames(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.replace(/\.tsx$/, ""))
    .sort()
}

/**
 * Finds the workspace modules a component imports. A component that imports a
 * sibling, a hook or a lib module is not self-contained, so the registry item
 * has to carry that along or the consumer installs code that cannot resolve
 * its imports.
 *
 * `lib/utils` is excluded: `shadcn init` writes it into every project.
 */
export function parseImports(source) {
  const components = new Set()
  const hooks = new Set()
  const libs = new Set()

  const pattern = /["']@workspace\/ui\/(components|hooks|lib)\/([\w-]+)["']/g
  let match
  while ((match = pattern.exec(source)) !== null) {
    if (match[1] === "components") components.add(match[2])
    else if (match[1] === "hooks") hooks.add(match[2])
    else if (match[2] !== "utils") libs.add(match[2])
  }

  return { components: [...components], hooks: [...hooks], libs: [...libs] }
}

export function buildItem(name, dependenciesByComponent, imports) {
  const dependencies = dependenciesByComponent[name]
  const { components = [], hooks = [], libs = [] } = imports ?? {}
  const title = toTitle(name)

  return {
    name,
    type: "registry:ui",
    title,
    description: `${title} component, themed for skt-ui-toolkit.`,
    registryDependencies: [
      THEME_ITEM_NAME,
      ...components.filter((component) => component !== name),
    ],
    ...(dependencies ? { dependencies } : {}),
    files: [
      {
        path: `packages/ui/src/components/${name}.tsx`,
        type: "registry:ui",
        target: `components/ui/${name}.tsx`,
      },
      ...hooks.map((hook) => ({
        path: `packages/ui/src/hooks/${hook}.ts`,
        type: "registry:hook",
        target: `hooks/${hook}.ts`,
      })),
      ...libs.map((lib) => ({
        path: `packages/ui/src/lib/${lib}.ts`,
        type: "registry:lib",
        target: `lib/${lib}.ts`,
      })),
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
