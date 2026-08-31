import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

/**
 * The raster numbers that live in three languages at once.
 *
 * CSS, GLSL and TypeScript cannot share a constant, so these values were kept
 * in step by comments asking the next person to remember. That already failed
 * once: a second copy of the banner gradient survived under the name
 * `crt-scanfill` until someone went looking for it. Prose is not a mechanism.
 *
 * Each test below states one relationship the screen depends on and reads both
 * sides out of the real files. They are deliberately narrow — the point is to
 * fail loudly when one side is retuned and the other is not, not to pin down
 * how either file is written.
 */

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url))
const read = (path: string) => readFileSync(repoRoot + path, "utf8")

const policy = read("apps/hideout/components/ascii-planet/policy.ts")
const toolkitCss = read("packages/ui/src/styles/globals.css")
const asciiShader = read(
  "apps/hideout/components/ascii-planet/shaders/ascii-post.frag"
)
const holoShader = read(
  "apps/hideout/components/ascii-planet/shaders/holo-post.frag"
)

/**
 * The one value a pattern finds. More than one match is fine as long as they
 * all say the same thing — `scanline` is declared once per render style, and
 * the point of the guard is lost if those two are allowed to disagree either.
 * Zero matches means the file moved and the guard went blind, which is a
 * failure, not a pass.
 */
function expectOne(source: string, pattern: RegExp, what: string) {
  const values = [...source.matchAll(new RegExp(pattern, "g"))].map((m) => m[1])
  if (values.length === 0) {
    throw new Error(
      `found no ${what}. The guard cannot check what it cannot locate — ` +
        `update the pattern to match how the file is written now.`
    )
  }
  const distinct = [...new Set(values)]
  if (distinct.length > 1) {
    throw new Error(`${what} disagrees with itself: ${distinct.join(", ")}`)
  }
  return distinct[0]
}

describe("the banner raster and the globe's hologram pass", () => {
  /* The CSS comment on crt-holo-fill says the gap "keeps 55% of it, which is
     the alpha the globe's own hologram pass leaves on an unlit row. Same
     surface, same number." This is that sentence, as an assertion. */
  it("leave the same amount of light on an unlit row", () => {
    const scanline = Number(
      expectOne(policy, /scanline:\s*([\d.]+)/, "scanline default")
    )
    const gapKeeps = Number(
      expectOne(
        toolkitCss,
        /--ascii-ink\) (\d+)%, transparent\) 3px 4px/,
        "crt-holo-fill gap stop"
      )
    )
    expect(gapKeeps / 100).toBeCloseTo(1 - scanline, 5)
  })
})

describe("the cell floors in policy.ts and the shaders", () => {
  /* A cell smaller than the shader's floor is a cell the policy thinks it is
     getting and never does, so the two have to name the same number. */
  it("agree on the ASCII pass's minimum cell height", () => {
    const fromPolicy = expectOne(
      policy,
      /MIN_DEVICE_CELL_HEIGHT = (\d+)/,
      "MIN_DEVICE_CELL_HEIGHT"
    )
    const fromShader = expectOne(
      asciiShader,
      /max\(floor\(uCell\), vec2\([\d.]+, ([\d.]+)\)\)/,
      "ascii-post cell floor"
    )
    expect(Number(fromShader)).toBe(Number(fromPolicy))
  })

  it("agree on the hologram pass's minimum cell", () => {
    const fromPolicy = expectOne(
      policy,
      /MIN_HOLO_DEVICE_CELL = (\d+)/,
      "MIN_HOLO_DEVICE_CELL"
    )
    const fromShader = expectOne(
      holoShader,
      /max\(floor\(vec2\(uCell\.y\)\), vec2\(([\d.]+)\)\)/,
      "holo-post cell floor"
    )
    expect(Number(fromShader)).toBe(Number(fromPolicy))
  })
})
