import * as THREE from "three"

import FRAGMENT from "./shaders/holo-post.frag"
import VERTEX from "./shaders/ascii-post.vert"
import type { ScreenPost, ScreenPostOptions } from "./screen-post"

/**
 * A post pass that reduces a render to a projected volume: chunky raster
 * pixels, scanlines, and a beam that has to find its lock.
 *
 * The other pass in this folder spends its resolution on glyph shapes. This
 * one spends it on the subject, which is why it pairs with wireframe geometry
 * rather than with a lit solid — there is no ramp here to carry shading, only
 * a handful of brightness steps and the lines themselves.
 *
 * Runs on a fullscreen quad after the scene capture, same as the ASCII pass.
 */
export function createHoloPost(
  width: number,
  height: number,
  options: ScreenPostOptions = {}
): ScreenPost {
  const {
    cellHeight = 6,
    ink = 0x35ff80,
    scanline = 0.45,
    levels = 5,
  } = options

  const target = new THREE.WebGLRenderTarget(
    Math.max(1, width),
    Math.max(1, height),
    {
      // Nearest, unlike the ASCII pass: that one wants a smooth luminance to
      // quantise, this one wants the exact texel it points at. Bilinear taps
      // bleed a lit cell's value into its neighbours and the raster loses its
      // edges — which reads as blur no matter how small the cells are.
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
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
      uBoot: { value: 1 },
      uResolution: { value: new THREE.Vector2(width, height) },
      // Only the height is read: a projected pixel is square.
      uCell: { value: new THREE.Vector2(cellHeight, cellHeight) },
      uInk: { value: new THREE.Color(ink) },
      uScanline: { value: scanline },
      uLevels: { value: levels },
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
      material.uniforms.uCell.value.set(h, h)
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
