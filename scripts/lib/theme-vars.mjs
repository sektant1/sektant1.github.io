import { readFileSync } from "node:fs"

/**
 * The published theme, read out of the stylesheet that defines it.
 *
 * This used to be `scripts/theme-vars.json`, a hand-kept copy of the same
 * tokens, and it had drifted exactly the way the dependency map before it did:
 *
 *   `--font-sans` said `Chakra Petch, …` where the stylesheet says
 *   `var(--font-display, Play), …`, so a consumer installed a theme with no
 *   --font-display hook at all and FontPicker had nothing to write to.
 *
 *   None of the eight `terminal-*` roles were in it. Ten shipped components —
 *   chart, tabs, field, terminal-frame, boot-log, command-strip, log-console,
 *   signal-trace, ascii-meter, font-picker — style themselves with
 *   `border-terminal-rule` and `text-terminal-chrome`, so `shadcn add chart`
 *   installed a component whose borders resolved to nothing.
 *
 * Deriving it means the manifest cannot disagree with the stylesheet, and
 * `make registry-check` fails on drift the way it already does for everything
 * else in the registry.
 */

const THEME_CSS = "packages/ui/src/styles/globals.css"

/**
 * Effect internals rather than theme tokens. They are the raster gradients,
 * which only mean anything alongside the `@utility` blocks that paint them —
 * and a registry:theme carries custom properties, not utilities. Shipping them
 * would hand a consumer two long gradients nothing in their build reads.
 */
const NOT_THEME = new Set(["crt-beam-image", "crt-interlace-image"])

/**
 * Selectors whose declarations belong to the theme, and which scheme each one
 * feeds. `:root, .dark` is how the terminal roles are written — one rule for
 * both schemes, because a color-mix() resolves against whichever colours won
 * on the element — so it lands in both maps.
 */
const SCHEME_SELECTORS = [
  { selector: ":root", schemes: ["light", "dark"] },
  { selector: ".dark", schemes: ["dark"] },
  { selector: ":root,.dark", schemes: ["light", "dark"] },
]

/**
 * Every top-level `selector { … }` rule, in document order.
 *
 * Comments come out first. This file is more comment than code in places, and
 * a selector is read as "the text since the previous rule closed" — so a
 * paragraph sitting above `:root` becomes part of its name and the rule stops
 * matching. Stripping them first is also what keeps a stray brace inside prose
 * from moving the nesting depth.
 */
function* topLevelRules(source) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "")
  let depth = 0
  let start = 0
  let selectorStart = 0
  for (let i = 0; i < css.length; i += 1) {
    const char = css[i]
    if (char === "{") {
      if (depth === 0) start = i
      depth += 1
    } else if (char === "}") {
      depth -= 1
      if (depth === 0) {
        yield {
          selector: css.slice(selectorStart, start).trim(),
          body: css.slice(start + 1, i),
        }
        selectorStart = i + 1
      }
    }
  }
}

/**
 * Declarations directly in a rule body, skipping anything nested — a media
 * query inside the block is a conditional value, and a theme map has no way to
 * express one.
 */
function declarations(body) {
  const flat = body.replace(/[^{}]*\{[^{}]*\}/g, "")
  const out = new Map()
  for (const [, name, value] of flat.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out.set(name.slice(2), value.replace(/\s+/g, " ").trim())
  }
  return out
}

/**
 * `cssVars` for the registry theme item: the `light` and `dark` maps, plus the
 * `theme` map that turns the terminal roles into real Tailwind utilities in a
 * consumer's build. Without that last one a consumer gets the custom properties
 * but no `text-terminal-chrome` to spend them through.
 */
export function readThemeVars(cssPath = THEME_CSS) {
  const css = readFileSync(cssPath, "utf8")
  const light = new Map()
  const dark = new Map()
  const theme = new Map()

  for (const { selector, body } of topLevelRules(css)) {
    const key = selector.replace(/\s+/g, "")

    if (key === "@themeinline") {
      // Tailwind's theme namespace: the entries that name a colour are what
      // generate the utilities the components are written against.
      for (const [name, value] of declarations(body)) {
        if (name.startsWith("color-")) theme.set(name, value)
      }
      continue
    }

    const match = SCHEME_SELECTORS.find((entry) => entry.selector === key)
    if (!match) continue

    for (const [name, value] of declarations(body)) {
      if (NOT_THEME.has(name)) continue
      if (match.schemes.includes("light")) light.set(name, value)
      if (match.schemes.includes("dark")) dark.set(name, value)
    }
  }

  const sorted = (map) =>
    Object.fromEntries([...map].sort(([a], [b]) => a.localeCompare(b)))

  return { theme: sorted(theme), light: sorted(light), dark: sorted(dark) }
}
