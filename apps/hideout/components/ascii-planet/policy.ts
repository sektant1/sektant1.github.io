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
export function toneMappingFor(subject: Subject): ToneMapping {
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

/** Characters per pixel. Higher resolves more detail and costs more. */
export function characterResolutionFor(
  viewportWidth: number,
  override?: number
): number {
  if (override !== undefined) return override
  return viewportWidth < MOBILE_WIDTH ? 0.18 : 0.24
}

/**
 * An environment map is only generated for a metal: a metal's diffuse
 * response is black, so all of its shading is reflection and without
 * something to reflect it renders as a flat dark disc.
 */
export function needsEnvironment(subject: Subject): boolean {
  return subject === "relief"
}
