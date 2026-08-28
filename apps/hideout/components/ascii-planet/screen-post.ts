import type * as THREE from "three"

import { createAsciiPost } from "./AsciiPost"
import { createHoloPost } from "./HoloPost"
import type { RenderStyle } from "./policy"

/**
 * The seam between the scene and whatever draws it.
 *
 * Both passes take the same frame and reduce it: one to a character grid, one
 * to a projected raster. The scene knows the size of a cell and when the boot
 * settle is running, and nothing else about either — which is what lets the
 * style be a setting rather than a second renderer.
 */
export interface ScreenPost {
  /** Render the scene through the pass. Draw this instead of the scene. */
  scene: THREE.Scene
  camera: THREE.Camera
  /** Renders `scene` into the pass's target. Call before drawing. */
  capture: (
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) => void
  /** 0 is an unsynchronised signal; 1 is the settled image. */
  setBootProgress: (progress: number) => void
  /** Height of one cell, in the drawing buffer's pixels. */
  setCellHeight: (height: number) => void
  setSize: (width: number, height: number) => void
  dispose: () => void
}

export interface ScreenPostOptions {
  /** How hard detected edges are pushed up the ramp. ASCII only. */
  edge?: number
  /** Dither amplitude in normalized luminance. ASCII only. */
  dither?: number
  /** Contrast about mid grey. 1 is linear. ASCII only. */
  contrast?: number
  /** Lowest glyph-density level for opaque source cells. ASCII only. */
  minLevel?: number
  /** How dark every other raster row is drawn. Hologram only. */
  scanline?: number
  /** Brightness steps the projection is quantised to. Hologram only. */
  levels?: number
  /** Height of one cell in screen pixels. */
  cellHeight?: number
  /** Emitted phosphor colour. */
  ink?: THREE.ColorRepresentation
}

export function createScreenPost(
  style: RenderStyle,
  width: number,
  height: number,
  options: ScreenPostOptions = {}
): ScreenPost {
  return style === "holo"
    ? createHoloPost(width, height, options)
    : createAsciiPost(width, height, options)
}
