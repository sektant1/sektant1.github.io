import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { expect, it } from "vitest"

const require = createRequire(
  new URL("../../apps/hideout/package.json", import.meta.url)
)
const sharp = require("sharp")
const css = readFileSync(
  new URL(
    "../../packages/ui/src/styles/themes/phosphor-cursors.css",
    import.meta.url
  ),
  "utf8"
)

it("uses only black and the selected phosphor color in every cursor", async () => {
  const images = [...css.matchAll(/data:image\/png;base64,([^"]+)/g)]
  expect(images).toHaveLength(4)
  for (const [index, match] of images.entries()) {
    const data = await sharp(Buffer.from(match[1], "base64"))
      .ensureAlpha()
      .raw()
      .toBuffer()
    const colors = new Set()
    for (let i = 0; i < data.length; i += 4) {
      expect([0, 255]).toContain(data[i + 3])
      if (data[i + 3]) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`)
    }
    expect(colors).toEqual(
      new Set(["0,0,0", index < 2 ? "50,240,120" : "252,190,92"])
    )
  }
})
