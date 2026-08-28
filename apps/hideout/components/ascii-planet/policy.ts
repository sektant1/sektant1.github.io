/**
 * Everything the scene decides before it touches WebGL.
 *
 * Two subjects, two treatments, and the difference runs through lighting,
 * tone mapping and the post pass at once:
 *
 *   A `relief` subject is a solid shaded by the light that rakes across it.
 *   A `texture` subject is a picture already present in the albedo, which
 *   extra shaping only washes out.
 *
 * Kept free of three so the rules can be read — and tested — without a GPU.
 */

export type Subject = "relief" | "texture"

/**
 * The choice of style runs deeper than the post pass. A wireframe has no
 * diffuse response to light and no reflection to catch, so the lighting rig,
 * the environment map and the tone curve are all decided from it too.
 *
 * The type itself lives in lib/render-style, reached relatively because this
 * file is read by tests that run without Next's path aliases: the CMS writes
 * the value, and that module has to stay importable without three.
 */
export {
  DEFAULT_RENDER_STYLE,
  RENDER_STYLES,
  isRenderStyle,
} from "../../lib/render-style"
export type { RenderStyle } from "../../lib/render-style"

import { DEFAULT_RENDER_STYLE, type RenderStyle } from "../../lib/render-style"

export interface LightSpec {
  kind: "ambient" | "directional"
  intensity: number
  /** Directional lights only. */
  position?: readonly [number, number, number]
}

export interface PostDefaults {
  edge: number
  contrast: number
  dither: number
  minLevel: number
}

export interface HoloDefaults {
  /** How dark every other raster row is drawn. */
  scanline: number
  /** Brightness steps the projection is quantised to. */
  levels: number
}

export interface ToneMapping {
  /** ACES filmic when true, none when false. */
  filmic: boolean
  exposure: number
}

/** Below this width the character grid is coarsened rather than the model. */
export const MOBILE_WIDTH = 720

export function subjectFor(modelUrl: string | undefined): Subject {
  return modelUrl ? "relief" : "texture"
}

/**
 * Nothing survives the ASCII pass that is not a brightness difference, which
 * is what both rules below follow from.
 *
 * A light from behind the camera lights every facing surface about equally,
 * so a relief key is moved off to the side and low: the terminator falls
 * across the object and relief casts its own gradients. And the edges have to
 * be drawn by something, so a rim light behind the subject picks out the
 * silhouette — in a character grid, the difference between a shape and a blob.
 *
 * The globe keeps its key near the camera instead, which is what stops half
 * its coastlines from disappearing into shadow.
 */
export function lightingFor(subject: Subject): LightSpec[] {
  if (subject === "relief") {
    return [
      { kind: "ambient", intensity: 0.04 },
      { kind: "directional", intensity: 4.2, position: [-5.5, 3.2, 1.8] },
      { kind: "directional", intensity: 0.7, position: [3.5, -1.2, 3.5] },
      { kind: "directional", intensity: 1.5, position: [2.5, 3.0, -5] },
    ]
  }
  return [
    { kind: "ambient", intensity: 0.15 },
    { kind: "directional", intensity: 2, position: [2, 3.5, 6] },
    { kind: "directional", intensity: 0.35, position: [-2, 1.5, 4] },
  ]
}

/**
 * The shader is a nine-level glyph quantiser, so what matters is how the
 * scene's brightness is distributed across those levels. A filmic curve keeps
 * the highlights from clipping every bright pixel to the same character; the
 * exposure lift spreads the midtones the object mostly lives in.
 */
export function toneMappingFor(
  subject: Subject,
  style: RenderStyle
): ToneMapping {
  // No filmic curve: a projection is emitted, not photographed, and rolling
  // its highlights off only drags the top steps together. The exposure is
  // lifted instead, because the raster's five steps have to be reached by a
  // surface lit for a shading model that is about to be thrown away.
  if (style === "holo") return { filmic: false, exposure: 1.3 }
  return subject === "relief"
    ? { filmic: true, exposure: 1.45 }
    : { filmic: false, exposure: 1 }
}

/**
 * Edge detection earns its cost on relief and costs contrast on a texture, so
 * the globe gets the dither and none of the Sobel.
 */
export function postDefaultsFor(subject: Subject): PostDefaults {
  return subject === "relief"
    ? { edge: 0.9, contrast: 1.25, dither: 0.055, minLevel: 0 }
    : { edge: 0, contrast: 1, dither: 0.045, minLevel: 1 }
}

/**
 * Neither the Sobel nor the dither has anything to find in a wireframe: the
 * edges are the geometry, and there is no gradient to break up. What the
 * projection wants instead is its raster and how many steps it holds.
 *
 * The step count is where the two subjects part. A coin is a relief with an
 * engraving to resolve, and five steps is what separates the ₿ from the field
 * it is cut into. A globe only has to say land, water, and edge: more steps
 * there turn the graticule and the facets into a third and fourth tone, and
 * the object stops reading as one projected surface.
 */
export function holoDefaultsFor(subject: Subject): HoloDefaults {
  return subject === "relief"
    ? { scanline: 0.45, levels: 5 }
    : { scanline: 0.45, levels: 3 }
}

/** Characters per pixel. Higher resolves more detail and costs more. */
export function characterResolutionFor(
  viewportWidth: number,
  override?: number
): number {
  if (override !== undefined) return override
  return viewportWidth < MOBILE_WIDTH ? 0.18 : 0.24
}

/** A glyph cell is drawn 5 units wide for every 7 tall. */
export const CELL_ASPECT = 0.6

/**
 * Columns the subject gets no matter how small its box is.
 *
 * The engraving on the coin is what has to survive the reduction, and it needs
 * about this many cells across the disc to stay a ₿ rather than a blob.
 *
 * The figure sits just under what a desktop already gets — the coin's own
 * column is 18rem wide and buys sixty-odd — so nothing there changes. A phone
 * gives the same coin 11rem or less, which at the same characters-per-pixel
 * buys thirty-eight, and that is where the letter goes to die.
 */
export const MIN_COLUMNS = 52

/**
 * The height of one glyph cell, in CSS pixels.
 *
 * A characters-per-pixel figure alone assumes the box is roughly a desktop's.
 * The same figure in a 96px box buys twenty columns, so the cell is also
 * capped by the width it has to divide: whichever rule asks for the smaller
 * cell wins, and small boxes get a finer grid rather than a coarser subject.
 */
export function cellHeightFor(
  hostWidth: number,
  characterResolution: number
): number {
  const fromResolution = 2 / characterResolution
  const fromColumns = hostWidth / (CELL_ASPECT * MIN_COLUMNS)
  return Math.min(fromResolution, fromColumns)
}

/**
 * How many pixels wide the projection is drawn, however big its box is.
 *
 * The character grid is sized so a glyph stays legible, which is why it
 * coarsens on a phone — a 5x7 pattern needs room. A projected pixel is a
 * square and needs none of that, so tying the raster to the character figure
 * dragged it down with the glyphs: the same hologram came out at ninety
 * columns on a desktop and sixty on a phone, on a screen where it is already
 * physically smaller.
 *
 * Fixing the column count instead makes the picture the same picture
 * everywhere, and the pixel ratio decides how finely it is drawn.
 */
export const HOLO_COLUMNS = 112

/** The smallest projected pixel worth drawing, in the drawing buffer. */
export const MIN_HOLO_DEVICE_CELL = 2

export function holoCellHeightFor(bufferWidth: number): number {
  return Math.max(bufferWidth / HOLO_COLUMNS, MIN_HOLO_DEVICE_CELL)
}

/**
 * The cell handed to whichever pass is drawing, in drawing-buffer pixels.
 *
 * The two styles measure from different things on purpose: a character cell
 * from the box's CSS width, because that is what decides whether a glyph can
 * be read, and a projected pixel from the buffer it lands in, because that is
 * what decides how sharp the raster is.
 */
export function postCellHeightFor(
  style: RenderStyle,
  cssCellHeight: number,
  renderScale: number,
  bufferWidth: number
): number {
  if (style === "holo") return holoCellHeightFor(bufferWidth)
  return deviceCellHeightFor(cssCellHeight, renderScale)
}

/**
 * Device pixels rendered per CSS pixel.
 *
 * The grid is measured in CSS pixels, so raising this does not change how many
 * glyphs there are — it changes how many real pixels each one is drawn with.
 * At 1 on a 3x phone the browser stretches every glyph across three pixels and
 * the ramp turns to mush. Capped at 2: past that the cost squares and the
 * glyphs are already sharp.
 */
export function renderScaleFor(devicePixelRatio: number): number {
  if (!Number.isFinite(devicePixelRatio) || devicePixelRatio < 1) return 1
  return Math.min(devicePixelRatio, 2)
}

/**
 * The cell the shader is handed, in the drawing buffer's own pixels.
 *
 * A glyph is a 5x7 pattern drawn into the cell, and the shader refuses to go
 * below five pixels of height because under that the pattern has no rows left
 * to draw. Matching that figure here keeps the two in agreement: a 2x phone
 * clears it easily, and a 1x display with a small box lands on it instead of
 * asking the shader for a cell it will silently clamp.
 */
export const MIN_DEVICE_CELL_HEIGHT = 5

export function deviceCellHeightFor(
  cssCellHeight: number,
  renderScale: number
): number {
  return Math.max(cssCellHeight * renderScale, MIN_DEVICE_CELL_HEIGHT)
}

/**
 * An environment map is only generated for a metal: a metal's diffuse
 * response is black, so all of its shading is reflection and without
 * something to reflect it renders as a flat dark disc.
 */
export function needsEnvironment(
  subject: Subject,
  style: RenderStyle
): boolean {
  // Unlit lines reflect nothing, so generating the map is pure cost.
  if (style === "holo") return false
  return subject === "relief"
}
