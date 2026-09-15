import { readFile, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(
  new URL("../apps/hideout/package.json", import.meta.url)
)
const sharp = require("sharp")
const palettes = { green: [50, 240, 120], amber: [252, 190, 92] }
const templates = {
  default: ["cursor.png", "0 0", "default"],
  pointer: ["cursor-click.png", "14 0", "pointer"],
}
const blocks = []

for (const [tube, color] of Object.entries(palettes)) {
  const declarations = []
  for (const [name, [asset, hotspot, fallback]] of Object.entries(templates)) {
    const source = await readFile(
      new URL(`../node_modules/nes.css/assets/${asset}`, import.meta.url)
    )
    const { data, info } = await sharp(source)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    for (let index = 0; index < data.length; index += 4) {
      const fill = data[index] + data[index + 1] + data[index + 2] > 384
      data[index] = fill ? color[0] : 0
      data[index + 1] = fill ? color[1] : 0
      data[index + 2] = fill ? color[2] : 0
      data[index + 3] = data[index + 3] >= 128 ? 255 : 0
    }
    const png = await sharp(data, { raw: info }).png().toBuffer()
    declarations.push(
      `  --cursor-${name}: url("data:image/png;base64,${png.toString("base64")}") ${hotspot}, ${fallback};`
    )
  }
  blocks.push(
    `${tube === "green" ? ":root, .dark" : '[data-tube="amber"]'} {\n${declarations.join("\n")}\n  --cursor-grab: grab;\n  --cursor-grabbing: grabbing;\n  --cursor-disabled: not-allowed;\n}`
  )
}

const output = new URL(
  "../packages/ui/src/styles/themes/phosphor-cursors.css",
  import.meta.url
)
await writeFile(output, `${blocks.join("\n\n")}\n`)
console.log(`Generated ${fileURLToPath(output)}`)
