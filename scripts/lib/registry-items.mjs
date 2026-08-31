import { readdirSync } from "node:fs"

export const THEME_ITEM_NAME = "skt-theme"

export function componentNames(dir) {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.replace(/\.tsx$/, ""))
    .sort()
}

/**
 * What `shadcn init` already puts in a project. Declaring these again would be
 * harmless but noisy — `lib/utils.ts`, which init writes itself, is built out
 * of clsx and tailwind-merge, and cva comes with the component set.
 */
const PROVIDED_BY_INIT = new Set([
  "react",
  "react-dom",
  "clsx",
  "tailwind-merge",
  "class-variance-authority",
])

/** `figlet/importable-fonts/Big.js` → `figlet`; `@tabler/icons-react` stays whole. */
function packageOf(specifier) {
  const parts = specifier.split("/")
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}

/**
 * Blanks comments so prose cannot be read as code.
 *
 * This file's own components sank the naive version: font-picker.tsx carries
 * the comment `// from "chose the same face the caller defaults to".`, which a
 * bare /from ["']/ match published as an npm package. Scanned rather than
 * regexed because the strings have to be respected in both directions — a
 * `//` inside a URL is not a comment, and a quote inside a comment is not a
 * string.
 */
function stripComments(source) {
  let out = ""
  let i = 0
  while (i < source.length) {
    const two = source.slice(i, i + 2)
    if (two === "//") {
      while (i < source.length && source[i] !== "\n") i++
      continue
    }
    if (two === "/*") {
      i += 2
      while (i < source.length && source.slice(i, i + 2) !== "*/") i++
      i += 2
      continue
    }
    const ch = source[i]
    if (ch === '"' || ch === "'" || ch === "`") {
      out += ch
      i++
      while (i < source.length && source[i] !== ch) {
        if (source[i] === "\\") {
          out += source.slice(i, i + 2)
          i += 2
          continue
        }
        out += source[i]
        i++
      }
      out += ch
      i++
      continue
    }
    out += ch
    i++
  }
  return out
}

/**
 * Finds what one source file imports: the workspace modules it cannot resolve
 * without, and the npm packages a consumer would have to install.
 *
 * A component that imports a sibling, a hook or a lib module is not
 * self-contained, so the registry item has to carry that along or the consumer
 * installs code that cannot resolve its imports. `lib/utils` is excluded:
 * `shadcn init` writes it into every project.
 *
 * Type-only imports count as packages. They do not run, but they still have to
 * resolve the moment the consumer type-checks.
 */
export function parseImports(rawSource) {
  const source = stripComments(rawSource)
  const components = new Set()
  const hooks = new Set()
  const libs = new Set()
  const packages = new Set()

  const workspace = /["']@workspace\/ui\/(components|hooks|lib)\/([\w-]+)["']/g
  let match
  while ((match = workspace.exec(source)) !== null) {
    if (match[1] === "components") components.add(match[2])
    else if (match[1] === "hooks") hooks.add(match[2])
    else if (match[2] !== "utils") libs.add(match[2])
  }

  const specifier = /\bfrom\s+["']([^"']+)["']/g
  while ((match = specifier.exec(source)) !== null) {
    const raw = match[1]
    if (raw.startsWith(".") || raw.startsWith("@workspace/")) continue
    const name = packageOf(raw)
    if (!PROVIDED_BY_INIT.has(name)) packages.add(name)
  }

  return {
    components: [...components],
    hooks: [...hooks],
    libs: [...libs],
    packages: [...packages],
  }
}

/**
 * Everything one registry item needs, gathered across every file it ships.
 *
 * The package a consumer must install is frequently not named in the component
 * file. `ascii-banner.tsx` imports no package at all; `lib/ascii-art.ts`, which
 * it drags along, is what imports figlet — so reading the component alone
 * publishes an item that installs and then fails to build. This walks the hook
 * and lib files the item carries and unions what they import.
 *
 * Sibling components are followed for their name only, never for their
 * packages: each installs as its own registry item and declares its own.
 *
 * `readSource(kind, name)` is the seam — the disk in the build, a plain object
 * in the tests. It may return undefined for a file that is not there.
 */
export function collectItemImports(name, readSource) {
  const own = parseImports(readSource("components", name) ?? "")
  const hooks = new Set(own.hooks)
  const libs = new Set(own.libs)
  const packages = new Set(own.packages)

  const pending = [
    ...own.hooks.map((hook) => ["hooks", hook]),
    ...own.libs.map((lib) => ["lib", lib]),
  ]
  const seen = new Set(pending.map(([kind, file]) => `${kind}/${file}`))

  while (pending.length) {
    const [kind, file] = pending.shift()
    const nested = parseImports(readSource(kind, file) ?? "")
    for (const pkg of nested.packages) packages.add(pkg)
    for (const [nestedKind, names] of [
      ["hooks", nested.hooks],
      ["lib", nested.libs],
    ]) {
      for (const nestedName of names) {
        const key = `${nestedKind}/${nestedName}`
        if (seen.has(key)) continue
        seen.add(key)
        if (nestedKind === "hooks") hooks.add(nestedName)
        else libs.add(nestedName)
        pending.push([nestedKind, nestedName])
      }
    }
  }

  return {
    components: own.components,
    hooks: [...hooks],
    libs: [...libs],
    packages: [...packages],
  }
}

export function buildItem(name, imports) {
  const {
    components = [],
    hooks = [],
    libs = [],
    packages = [],
  } = imports ?? {}
  const dependencies = packages.length ? [...packages].sort() : undefined
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
