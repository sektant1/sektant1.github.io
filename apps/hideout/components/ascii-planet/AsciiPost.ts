import * as THREE from "three"

// Loaded as text by raw-loader, configured for both bundlers in
// next.config.mjs. Keeping the GLSL in real .vert/.frag files rather than
// template literals is what gets it syntax highlighting, and what lets an
// editor's GLSL tooling see it at all.
import FRAGMENT from "./shaders/ascii-post.frag"
import VERTEX from "./shaders/ascii-post.vert"

/**
 * A post pass that converts a render into a fixed 5x7 terminal glyph grid.
 *
 * The shader reduces the frame to one number per cell and draws one of nine
 * procedural glyph densities. Two things are lost in that reduction, and no
 * amount of lighting gets them back:
 *
 *   Edges. A raised lip on a coin and the flat beside it can sit within one
 *   ramp step, so the relief disappears while the silhouette survives. A Sobel
 *   operator on luminance finds those boundaries and adds them back as
 *   brightness, which is the only channel the ramp can read.
 *
 *   Gradients. Sixteen steps across a curved surface is visible banding — flat
 *   plates of one character with hard seams. An ordered dither offsets each
 *   cell by a fixed fraction of a step before quantisation, so the boundary
 *   between two characters breaks into a stipple and reads as a smooth ramp.
 *
 * Runs on a fullscreen quad after the scene capture.
 */

export interface AsciiPostOptions {
  /** How hard detected edges are pushed up the ramp. 0 disables. */
  edge?: number
  /** Dither amplitude in normalized luminance. */
  dither?: number
  /** Contrast about mid grey. 1 is linear. */
  contrast?: number
  /** Height of one emulated character cell in screen pixels. */
  cellHeight?: number
  /** Emitted phosphor colour. */
  ink?: THREE.ColorRepresentation
  /** Lowest glyph-density level for opaque source cells. */
  minLevel?: number
}

export interface AsciiPost {
  /** Render the scene through the pass. Draw this instead of the scene. */
  scene: THREE.Scene
  camera: THREE.Camera
  /** Renders `scene` into the pass's target. Call before drawing. */
  capture: (
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) => void
  /** 0 is an unsynchronised boot signal; 1 is the settled image. */
  setBootProgress: (progress: number) => void
  /** Height of one glyph cell, in the drawing buffer's pixels. */
  setCellHeight: (height: number) => void
  setSize: (width: number, height: number) => void
  dispose: () => void
}

export function createAsciiPost(
  width: number,
  height: number,
  options: AsciiPostOptions = {}
): AsciiPost {
  const {
    edge = 0.9,
    dither = 0.055,
    contrast = 1.25,
    cellHeight = 8,
    ink = 0x35ff80,
    minLevel = 0,
  } = options

  const target = new THREE.WebGLRenderTarget(
    Math.max(1, width),
    Math.max(1, height),
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      // The pass reads alpha to find the background, so the target needs one.
      format: THREE.RGBAFormat,
      // The scene is tone mapped on the way in; this buffer holds the result.
      colorSpace: THREE.SRGBColorSpace,
    }
  )

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: target.texture },
      uTexel: {
        value: new THREE.Vector2(
          1 / Math.max(1, width),
          1 / Math.max(1, height)
        ),
      },
      uEdge: { value: edge },
      uDither: { value: dither },
      uContrast: { value: contrast },
      uBoot: { value: 1 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uCell: { value: new THREE.Vector2(cellHeight * 0.6, cellHeight) },
      uInk: { value: new THREE.Color(ink) },
      uMinLevel: { value: minLevel },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  quad.frustumCulled = false
  scene.add(quad)

  return {
    scene,
    camera,

    capture(renderer, sourceScene, sourceCamera) {
      const previous = renderer.getRenderTarget()
      renderer.setRenderTarget(target)
      renderer.clear()
      renderer.render(sourceScene, sourceCamera)
      renderer.setRenderTarget(previous)
    },

    setBootProgress(progress) {
      material.uniforms.uBoot.value = THREE.MathUtils.clamp(progress, 0, 1)
    },

    setCellHeight(height) {
      const h = Math.max(1, height)
      material.uniforms.uCell.value.set(h * 0.6, h)
    },

    setSize(nextWidth, nextHeight) {
      const w = Math.max(1, nextWidth)
      const h = Math.max(1, nextHeight)
      target.setSize(w, h)
      material.uniforms.uTexel.value.set(1 / w, 1 / h)
      material.uniforms.uResolution.value.set(w, h)
    },

    dispose() {
      target.dispose()
      quad.geometry.dispose()
      material.dispose()
    },
  }
}
