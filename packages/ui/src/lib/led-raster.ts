/**
 * Turning ASCII art into a grid of diode intensities.
 *
 * The obvious approach — read the glyphs and look up which half of the cell
 * each block character fills — only works for the block faces. Half the fonts
 * in this registry draw with `/`, `\`, `|` and `_`, and those have no such
 * table. So the art is rasterised instead: drawn once into an offscreen
 * canvas in the same monospace face the banner uses, then each diode's cell
 * is measured for how much ink landed in it.
 *
 * That is slower than a lookup and worth it twice over. It works for any
 * font, and it returns coverage rather than a boolean — a diagonal stroke
 * clips a corner of a cell and lights that diode part way, which is exactly
 * what a real sign does with a line it cannot place on its grid.
 */

export interface LedGrid {
  columns: number
  /** Two per line of art: a character cell is about twice as tall as wide. */
  rows: number
  /** Coverage per diode, row-major, 0..1. */
  data: Float32Array
}

/** Rows of diodes per line of text. */
const ROWS_PER_LINE = 2

/** Big enough that a diode cell is several pixels across, small enough to
 *  rasterise in well under a frame. */
const CELL_HEIGHT = 16

export function rasterizeArt(
  art: string,
  columns: number,
  fontFamily: string
): LedGrid | null {
  const lines = art.split("\n")
  const rows = lines.length * ROWS_PER_LINE

  const measure = document.createElement("canvas").getContext("2d")
  if (!measure) return null

  const font = `${CELL_HEIGHT}px ${fontFamily}`
  measure.font = font
  // The advance of the face actually in use, not the 0.6em rule of thumb the
  // CSS falls back on: if the webfont has not loaded the fallback's metrics
  // are what the browser will paint, and a grid built on the wrong advance
  // walks off the letters by the end of a long line.
  const cellWidth = measure.measureText("M").width
  if (!(cellWidth > 0)) return null

  const width = Math.ceil(cellWidth * columns)
  const height = CELL_HEIGHT * lines.length
  if (width < 1 || height < 1) return null

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return null

  ctx.font = font
  ctx.textBaseline = "top"
  ctx.fillStyle = "#fff"
  lines.forEach((line, i) => ctx.fillText(line, 0, i * CELL_HEIGHT))

  const pixels = ctx.getImageData(0, 0, width, height).data
  const data = new Float32Array(columns * rows)
  const rowHeight = CELL_HEIGHT / ROWS_PER_LINE

  for (let row = 0; row < rows; row++) {
    const y0 = Math.floor(row * rowHeight)
    const y1 = Math.min(height, Math.floor((row + 1) * rowHeight))

    for (let col = 0; col < columns; col++) {
      const x0 = Math.floor(col * cellWidth)
      const x1 = Math.min(width, Math.floor((col + 1) * cellWidth))

      let sum = 0
      let count = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          sum += pixels[(y * width + x) * 4 + 3]
          count++
        }
      }

      // Coverage is pushed up before it is clamped. A stroke that crosses a
      // third of a cell still lit that diode — a real one has no way to be a
      // third on — and without the lift the line fonts come out as a grey
      // haze instead of an image.
      data[row * columns + col] =
        count === 0 ? 0 : Math.min(1, (sum / count / 255) * 1.7)
    }
  }

  return { columns, rows, data }
}
