import figlet from "figlet"
import banner3 from "figlet/importable-fonts/Banner3.js"
import big from "figlet/importable-fonts/Big.js"
import deltaCorpsPriest1 from "figlet/importable-fonts/Delta Corps Priest 1.js"
import dosRebel from "figlet/importable-fonts/DOS Rebel.js"
import slant from "figlet/importable-fonts/Slant.js"
import small from "figlet/importable-fonts/Small.js"
import standard from "figlet/importable-fonts/Standard.js"
import subZero from "figlet/importable-fonts/Sub-Zero.js"

/**
 * Turning a string into ASCII art, and nothing else.
 *
 * Split out from the component because the art is a pure function of its two
 * arguments: the same text and font produce the same glyphs on a server, in a
 * build step, or in a browser. Keeping it out of the component is what lets a
 * caller render the art where it is cheapest and ship the result as text,
 * rather than shipping figlet and eight fonts to every reader to recompute it.
 *
 * Fonts are imported as modules rather than fetched, so rendering stays
 * synchronous and works offline.
 */

const FONTS = {
  Standard: standard,
  Slant: slant,
  Small: small,
  Big: big,
  Banner3: banner3,
  "Delta Corps Priest 1": deltaCorpsPriest1,
  "DOS Rebel": dosRebel,
  "Sub-Zero": subZero,
} as const

export type AsciiBannerFont = keyof typeof FONTS

export interface AsciiArt {
  art: string
  /** The widest line, which is what the fit-to-container CSS divides by. */
  columns: number
}

let registered = false

function ensureFontsRegistered() {
  if (registered) return
  for (const [name, data] of Object.entries(FONTS)) {
    figlet.parseFont(name, data)
  }
  registered = true
}

export function renderAsciiArt(
  text: string,
  font: AsciiBannerFont = "Delta Corps Priest 1"
): AsciiArt {
  ensureFontsRegistered()

  // Figlet pads its output with trailing blank lines, which read as dead
  // space above whatever follows the banner.
  const art = figlet
    .textSync(text, { font, horizontalLayout: "fitted" })
    .replace(/\s+$/, "")

  const columns = art
    .split("\n")
    .reduce((max, line) => Math.max(max, line.length), 0)

  return { art, columns }
}
