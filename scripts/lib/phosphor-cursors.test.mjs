import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const css = readFileSync(
  new URL("../../packages/ui/src/styles/themes/phosphor.css", import.meta.url),
  "utf8"
)
const cursorNames = ["default", "pointer", "grab", "grabbing", "disabled"]

describe.each(cursorNames)("%s cursor", (name) => {
  const start = css.indexOf(`--cursor-${name}:`)
  const nextName = cursorNames[cursorNames.indexOf(name) + 1]
  const end = nextName
    ? css.indexOf(`--cursor-${nextName}:`, start)
    : css.indexOf("\n}", start)
  const declaration = css.slice(start, end)

  it("provides portable 16-pixel sources with a stable hotspot", () => {
    const pngData = declaration.match(/data:image\/png;base64,([^"]+)/)?.[1]
    const svgData = declaration.match(
      /data:image\/svg\+xml;charset=utf-8,([^"]+)/
    )?.[1]

    expect(start).toBeGreaterThan(-1)
    expect(pngData).toBeDefined()
    expect(svgData).toBeDefined()
    expect(declaration.indexOf("data:image/png")).toBeLessThan(
      declaration.indexOf("data:image/svg+xml")
    )

    const png = Buffer.from(pngData, "base64")
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([16, 16])
    expect(decodeURIComponent(svgData)).toContain("width='16' height='16'")
    expect(declaration.match(/\s8 8,/g)).toHaveLength(2)
  })
})
