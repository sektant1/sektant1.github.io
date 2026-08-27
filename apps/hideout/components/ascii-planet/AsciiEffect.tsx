import * as THREE from "three"

export interface AsciiEffectOptions {
  characterSet?: string
  invert?: boolean
  resolution?: number
  scale?: number
}

export interface AsciiEffect {
  domElement: HTMLDivElement
  setSize: (width: number, height: number) => void
  canRender: () => boolean
  render: (scene: THREE.Object3D, camera: THREE.Camera) => void
  dispose: () => void
}

/**
 * The character ramp, ordered by how much ink each glyph actually puts on the
 * cell in a monospace face.
 *
 * Luminance maps across this array linearly, so the ramp is the quantiser:
 * 23 steps instead of ten resolves gradients the old
 * set collapsed, and the ordering matters more than the length — a ramp with
 * two glyphs of similar weight next to each other wastes a step and shows up
 * as a band that never changes.
 */
const RAMP = " .,:;-=+*#%@"

export function createAsciiEffect(
  renderer: THREE.WebGLRenderer,
  opts: AsciiEffectOptions = {}
): AsciiEffect {
  const {
    characterSet = RAMP,
    invert = true,
    resolution = 0.18,
    scale = 1,
  } = opts

  const chars = characterSet.split("")
  const target = new THREE.WebGLRenderTarget(1, 1, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    depthBuffer: false,
    colorSpace: THREE.SRGBColorSpace,
  })

  const el = document.createElement("div")
  const pre = document.createElement("pre")
  el.appendChild(pre)
  el.style.color = "var(--primary)"
  el.style.backgroundColor = "transparent"
  el.style.fontFamily = "var(--font-mono)"
  el.style.fontWeight = "600"
  el.style.letterSpacing = "0"
  el.style.lineHeight = "1"
  el.style.position = "absolute"
  el.style.inset = "0"
  el.style.display = "flex"
  el.style.alignItems = "center"
  el.style.justifyContent = "center"
  el.style.pointerEvents = "none"
  el.style.userSelect = "none"
  ;(
    el.style as CSSStyleDeclaration & { webkitUserSelect?: string }
  ).webkitUserSelect = "none"
  el.style.textShadow =
    "0 0 4px var(--primary), 0 0 12px var(--terminal-chrome-dim)"

  pre.style.margin = "0"
  pre.style.padding = "0"
  pre.style.whiteSpace = "pre"
  pre.style.fontFamily = "var(--font-mono)"
  pre.style.fontSize = `${(2 / resolution) * scale}px`
  pre.style.lineHeight = `${(2 / resolution) * scale}px`
  pre.style.letterSpacing = scale === 1 ? "-1px" : "0"

  let sampleWidth = 1
  let sampleHeight = 1
  let previous = ""
  let reading = false
  let disposed = false
  let hasVisibleFrame = false

  const updateText = (pixels: Uint8Array, width: number, height: number) => {
    const maxIndex = chars.length - 1
    let output = ""

    for (let y = 0; y < height; y += 2) {
      const sourceY = height - 1 - y
      for (let x = 0; x < width; x += 1) {
        const offset = (sourceY * width + x) * 4
        const alpha = pixels[offset + 3]
        let brightness =
          (0.3 * pixels[offset] +
            0.59 * pixels[offset + 1] +
            0.11 * pixels[offset + 2]) /
          255
        if (alpha === 0) {
          output += " "
          continue
        }

        let index = Math.round((1 - brightness) * maxIndex)
        if (invert) index = maxIndex - index
        output += chars[index] ?? " "
      }
      output += "\n"
    }

    if (output !== previous) {
      pre.textContent = output
      previous = output
    }

    return output.trim().length > 0
  }

  return {
    domElement: el,
    canRender() {
      return !reading && !disposed
    },
    setSize(width, height) {
      sampleWidth = Math.max(1, Math.floor(width * resolution))
      sampleHeight = Math.max(1, Math.floor(height * resolution))
      target.setSize(sampleWidth, sampleHeight)
    },
    render(scene, camera) {
      if (reading || disposed) return

      const previousTarget = renderer.getRenderTarget()
      renderer.setRenderTarget(target)
      renderer.clear()
      renderer.render(scene, camera)
      renderer.setRenderTarget(previousTarget)

      const width = sampleWidth
      const height = sampleHeight
      const pixels = new Uint8Array(width * height * 4)
      if (!hasVisibleFrame) {
        renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels)
        hasVisibleFrame = updateText(pixels, width, height)
        return
      }

      reading = true
      void renderer
        .readRenderTargetPixelsAsync(target, 0, 0, width, height, pixels)
        .then(() => {
          if (!disposed) updateText(pixels, width, height)
        })
        .catch((error) => console.error("ASCII readback failed", error))
        .finally(() => {
          reading = false
        })
    },
    dispose() {
      disposed = true
      target.dispose()
    },
  }
}
