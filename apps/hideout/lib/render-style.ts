/**
 * How the site draws its 3D subjects.
 *
 * `ascii` reduces a lit solid to a character grid: the shading carries the
 * shape, and the glyph ramp is the quantiser. `holo` throws the shading away
 * and draws the model's own edges as a projected wireframe, quantised to a few
 * brightness steps on a square raster.
 *
 * Kept here rather than beside the renderer because the CMS schema decides it
 * and the scene only obeys: this module has to stay importable without three,
 * without the DOM, and without a WebGL context.
 */

export type RenderStyle = "ascii" | "holo"

export const RENDER_STYLES: readonly RenderStyle[] = ["ascii", "holo"]

/**
 * What the site draws with when nothing says otherwise: no home.json, a value
 * the schema refused, or a scene mounted outside the front page.
 */
export const DEFAULT_RENDER_STYLE: RenderStyle = "holo"

/** What each style is called in the CMS. */
export const RENDER_STYLE_LABELS: Record<RenderStyle, string> = {
  ascii: "ascii — character grid",
  holo: "hologram — projected wireframe",
}

export function isRenderStyle(value: unknown): value is RenderStyle {
  return (
    typeof value === "string" && RENDER_STYLES.includes(value as RenderStyle)
  )
}
