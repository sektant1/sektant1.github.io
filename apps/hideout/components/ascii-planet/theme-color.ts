import * as THREE from "three"

/**
 * Resolves a CSS custom property to a colour three can use.
 *
 * The theme is written in oklch, and getComputedStyle hands that back as
 * `lab(...)` — a format THREE.Color does not parse, so every marker was
 * silently falling back and logging a warning per frame. The browser's own 2D
 * context is the conversion: assign any CSS colour, read it back as rgb.
 *
 * Nothing here knows about the globe. It is the general problem of a theme
 * token reaching a renderer that only speaks rgb, which is why it no longer
 * lives inside the file that draws map markers.
 */
export function resolveThemeColor(
  token: string,
  fallback: string
): THREE.Color {
  const styles = getComputedStyle(document.documentElement)
  const value = styles.getPropertyValue(token).trim() || fallback

  try {
    return new THREE.Color(toRgb(value) ?? fallback)
  } catch {
    return new THREE.Color(fallback)
  }
}

/** One shared context; creating a canvas per colour would be absurd. */
let converter: CanvasRenderingContext2D | null | undefined

function toRgb(value: string): string | null {
  if (converter === undefined) {
    converter = document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true })
  }
  if (!converter) return null

  // An unparseable value leaves fillStyle untouched, so it is primed with a
  // sentinel: if it comes back unchanged, the colour was not understood.
  converter.fillStyle = "#000000"
  converter.fillStyle = value
  const first = converter.fillStyle

  converter.fillStyle = "#ffffff"
  converter.fillStyle = value

  if (converter.fillStyle !== first) return null

  converter.clearRect(0, 0, 1, 1)
  converter.fillStyle = first
  converter.fillRect(0, 0, 1, 1)
  const [r, g, b] = converter.getImageData(0, 0, 1, 1).data
  return `rgb(${r}, ${g}, ${b})`
}
