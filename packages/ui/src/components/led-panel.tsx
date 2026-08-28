"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { rasterizeArt, type LedGrid } from "@workspace/ui/lib/led-raster"
import { usePrefersReducedMotion } from "@workspace/ui/hooks/use-reduced-motion"

/**
 * A dot-matrix LED sign, drawn as light rather than as paint.
 *
 * The CSS version of this — a dot lattice clipped to the glyphs, with a
 * blurred copy screened over it — draws the right shapes and still reads as
 * a picture of a sign. What it cannot do is add: every layer composites
 * against what is under it, so two diodes side by side never make the gap
 * between them brighter than either one, and nothing ever clips to white.
 * That is most of what the eye uses to tell a lamp from a painted dot.
 *
 * On a canvas the same drawing is additive for real. Each diode is a sprite
 * blitted with `lighter`, so overlapping falloff sums; where a stroke runs
 * several diodes thick the sum passes 1 and the core goes white on its own,
 * with the phosphor colour surviving only at the edges. The bloom is the
 * same lit layer blurred and added back twice, at two radii — the tight
 * spill off each rim, and the wash the board throws into the air.
 *
 * Every layer that does not change is rendered once into its own offscreen
 * canvas, so a frame is four `drawImage` calls. The blur — by far the
 * expensive part — is paid on resize, not per frame.
 *
 * Progressive enhancement: this is drawn over server-rendered art, and the
 * caller keeps that art in the layout as the fallback. Without a canvas
 * context, without a measurable box, or before the font settles, nothing is
 * painted and the CSS version is what the reader sees.
 */

type LedPanelProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Pre-rendered ASCII art; the wiring diagram for the board. */
  art: string
  /** The art's widest line. */
  columns: number
  /** Adds the faults of a board that has been running a while. */
  faults?: boolean
}

/** Diameter of a lit diode, as a fraction of the smaller pitch. Under 1, so
 *  there is dark board between neighbours: a grid whose diodes touch stops
 *  reading as a matrix and starts reading as a stencil. */
const DOT_SIZE = 0.64
/** How far the sprite's falloff reaches past the diode itself. Kept tight —
 *  with additive blitting, spill that overlaps several neighbours sums to
 *  white across the whole stroke and the grid disappears into a slab. */
const SPRITE_SPREAD = 1.3
/** Bloom radii, as multiples of the diode pitch. */
const BLOOM_NEAR = 0.8
const BLOOM_FAR = 3
const BLOOM_NEAR_ALPHA = 0.3
const BLOOM_FAR_ALPHA = 0.22
/** How bright an unlit diode sits against the board. */
const UNLIT_ALPHA = 0.14
/** What a row keeps when it loses drive for a frame. Not zero: the diodes
 *  are still there, and a row that vanishes completely reads as a hole cut
 *  in the board. */
const DIM_ROW_GAIN = 0.22

interface Layers {
  lit: HTMLCanvasElement
  bed: HTMLCanvasElement
  bloomNear: HTMLCanvasElement
  bloomFar: HTMLCanvasElement
  width: number
  height: number
  pitchY: number
  dpr: number
}

function LedPanel({
  art,
  columns,
  faults = false,
  className,
  ...props
}: LedPanelProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const layersRef = React.useRef<Layers | null>(null)
  const reduceMotion = usePrefersReducedMotion()

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let frame = 0
    let grid: LedGrid | null = null

    const styles = getComputedStyle(canvas)
    // The theme's own values, resolved: the canvas has no cascade of its own,
    // so the colours have to be read out of the DOM before anything is drawn.
    const ink = styles.color
    const body = styles.backgroundColor
    const fontFamily = styles.fontFamily

    const build = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width < 8 || height < 8) return false

      grid ??= rasterizeArt(art, columns, fontFamily)
      if (!grid) return false

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(width * dpr)
      const h = Math.round(height * dpr)

      // Rebuilding is expensive — a raster, two dot passes and two blurs —
      // and a ResizeObserver fires for changes that leave the rounded pixel
      // size exactly where it was. Nothing below depends on anything but
      // these three numbers, so if they have not moved, neither has the
      // board.
      const current = layersRef.current
      if (current && current.width === w && current.height === h) return true

      const pitchX = w / grid.columns
      const pitchY = h / grid.rows
      const radius = (Math.min(pitchX, pitchY) * DOT_SIZE) / 2

      const sprite = makeSprite(radius, ink)
      // The lit diodes follow the art. The bed is every diode on the board,
      // lit or not — seeing the dark ones is what separates a sign from
      // glowing text, so it covers the whole panel rather than the letters.
      const lit = paintDots(grid, w, h, pitchX, pitchY, sprite, (v) => v)
      const bed = paintDots(
        grid,
        w,
        h,
        pitchX,
        pitchY,
        sprite,
        () => UNLIT_ALPHA,
        true
      )

      layersRef.current = {
        lit,
        bed,
        bloomNear: blurOf(lit, pitchY * BLOOM_NEAR),
        bloomFar: blurOf(lit, pitchY * BLOOM_FAR),
        width: w,
        height: h,
        pitchY,
        dpr,
      }

      canvas.width = w
      canvas.height = h
      return true
    }

    // What the last frame was drawn with. The faults are stepped and mostly
    // idle, so the great majority of animation frames would redraw exactly
    // what is already on the canvas; comparing first turns the loop into a
    // pair of number checks except on the frames that actually change.
    let lastGain = Number.NaN
    let lastDead = Number.NaN

    const compose = (time: number, force = false) => {
      const layers = layersRef.current
      const ctx = canvas.getContext("2d")
      if (!layers || !ctx) return

      // Brightness only, never geometry. This art is built from cells that
      // tile, and anything that displaces a row sideways reads as the letters
      // coming apart rather than as interference.
      const gain = reduceMotion ? 1 : flickerAt(time)
      const dead = reduceMotion ? null : dropoutAt(time, layers)
      const deadKey = dead ? dead.top : -1
      if (!force && gain === lastGain && deadKey === lastDead) return
      lastGain = gain
      lastDead = deadKey

      ctx.globalCompositeOperation = "source-over"
      ctx.globalAlpha = 1
      ctx.fillStyle = body
      ctx.fillRect(0, 0, layers.width, layers.height)
      ctx.drawImage(layers.bed, 0, 0)

      // Light adds. Everything above this point is the board; everything
      // below it is what the board is emitting.
      ctx.globalCompositeOperation = "lighter"
      drawDimmingRow(ctx, layers.lit, gain, dead)
      drawDimmingRow(ctx, layers.bloomNear, gain * BLOOM_NEAR_ALPHA, dead)
      drawDimmingRow(ctx, layers.bloomFar, gain * BLOOM_FAR_ALPHA, dead)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
    }

    const tick = (time: number) => {
      if (cancelled) return
      compose(time)
      frame = requestAnimationFrame(tick)
    }

    const start = () => {
      if (cancelled || !build()) return
      // The banner marks itself, rather than being told by React state, so
      // the component that owns it can stay a server component: the CSS
      // board underneath is the fallback, and it is hidden by a data
      // attribute the moment there is a canvas to hide it behind.
      markPainted(canvas, true)
      if (faults && !reduceMotion) frame = requestAnimationFrame(tick)
      else compose(0, true)
    }

    // The grid is measured from the font that will actually be painted, so
    // the build waits for the webfont rather than racing it.
    const ready = document.fonts?.ready ?? Promise.resolve()
    ready.then(start, start)

    const observer = new ResizeObserver(() => {
      const before = layersRef.current
      if (!build()) return
      // Only a real rebuild is worth a forced repaint; the animation loop is
      // already skipping frames that would draw what is on the canvas.
      if (layersRef.current !== before) compose(performance.now(), true)
    })
    observer.observe(canvas)

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      layersRef.current = null
      markPainted(canvas, false)
    }
  }, [art, columns, faults, reduceMotion])

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        // The canvas is styled rather than configured: `color` and
        // `background-color` are how the theme reaches a context that has no
        // cascade, and the font is what the grid is measured against.
        className="size-full led-surface"
      />
    </div>
  )
}

/** Flags the banner as canvas-lit, so the CSS board drops out of sight
 *  while staying in the layout as the box the canvas fills. */
function markPainted(canvas: HTMLCanvasElement, painted: boolean) {
  const banner = canvas.closest("[data-slot=ascii-banner]")
  if (!banner) return
  if (painted) banner.setAttribute("data-led", "on")
  else banner.removeAttribute("data-led")
}

/** One diode, drawn once and blitted everywhere: a face at full strength, a
 *  short falloff past its rim so neighbours overlap and add, and a hot centre
 *  on top.
 *
 *  Built as a luminance profile and then tinted through `source-in`, rather
 *  than by writing the ink colour into the gradient stops. The theme's
 *  colours arrive as whatever string `getComputedStyle` hands back — oklch,
 *  colour-mix, rgb — and tinting a shape keeps every one of them working
 *  without this file having to parse any of them. */
function makeSprite(radius: number, ink: string) {
  const span = Math.max(2, Math.ceil(radius * SPRITE_SPREAD))
  const size = span * 2
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas

  const rim = Math.min(0.94, radius / span)
  const body = ctx.createRadialGradient(span, span, 0, span, span, span)
  body.addColorStop(0, "rgba(255,255,255,1)")
  body.addColorStop(rim, "rgba(255,255,255,1)")
  body.addColorStop(rim + (1 - rim) * 0.4, "rgba(255,255,255,0.3)")
  body.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = body
  ctx.fillRect(0, 0, size, size)

  ctx.globalCompositeOperation = "source-in"
  ctx.fillStyle = ink
  ctx.fillRect(0, 0, size, size)

  // The die itself, seen through the diffuser. Small and translucent: a
  // diode reads as hot because its centre is a fraction of its face, not
  // because the whole dot is pale.
  ctx.globalCompositeOperation = "source-over"
  const core = ctx.createRadialGradient(span, span, 0, span, span, radius)
  core.addColorStop(0, "rgba(255,255,255,0.22)")
  core.addColorStop(0.45, "rgba(255,255,255,0.07)")
  core.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = core
  ctx.fillRect(0, 0, size, size)

  return canvas
}

function paintDots(
  grid: LedGrid,
  width: number,
  height: number,
  pitchX: number,
  pitchY: number,
  sprite: HTMLCanvasElement,
  alphaOf: (coverage: number) => number,
  /** Draw a diode at every position, not only where the art lit one. */
  everywhere = false
) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas

  ctx.globalCompositeOperation = "lighter"
  const half = sprite.width / 2

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.columns; col++) {
      const coverage = grid.data[row * grid.columns + col]
      const alpha = alphaOf(coverage)
      if (alpha <= 0.004) continue
      if (!everywhere && coverage <= 0.004) continue

      ctx.globalAlpha = Math.min(1, alpha)
      ctx.drawImage(
        sprite,
        (col + 0.5) * pitchX - half,
        (row + 0.5) * pitchY - half
      )
    }
  }

  ctx.globalAlpha = 1
  return canvas
}

function blurOf(source: HTMLCanvasElement, radius: number) {
  const canvas = document.createElement("canvas")
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas

  ctx.filter = `blur(${radius.toFixed(2)}px)`
  ctx.drawImage(source, 0, 0)
  return canvas
}

/** Draws a layer with one row of diodes running weak.
 *
 *  Three blits, not a bar painted over the top: the dim row is the same
 *  pixels at a lower alpha, so the bed under it still shows and the row's
 *  bloom drops with it. Painting a black bar instead — the obvious way —
 *  reads as a tear in the page rather than as a fault in the sign, because
 *  a row of diodes losing drive goes dark, and dark on this board is the
 *  unlit lattice, never a solid line. */
function drawDimmingRow(
  ctx: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  alpha: number,
  dim: { top: number; height: number } | null
) {
  const clamp = (value: number) => Math.max(0, Math.min(1, value))
  ctx.globalAlpha = clamp(alpha)
  if (!dim) {
    ctx.drawImage(layer, 0, 0)
    return
  }

  const below = dim.top + dim.height
  const band = (y: number, height: number) =>
    ctx.drawImage(layer, 0, y, layer.width, height, 0, y, layer.width, height)

  if (dim.top > 0) band(0, dim.top)
  ctx.globalAlpha = clamp(alpha * DIM_ROW_GAIN)
  band(dim.top, Math.min(dim.height, layer.height - dim.top))
  ctx.globalAlpha = clamp(alpha)
  if (below < layer.height) band(below, layer.height - below)
}

/** The supply sagging. Stepped and irregular: a board that dimmed on a sine
 *  wave would read as breathing rather than as strain. */
function flickerAt(time: number) {
  const t = (time % 6700) / 6700
  if (t > 0.06 && t < 0.076) return t < 0.068 ? 0.62 : 0.86
  if (t > 0.38 && t < 0.391) return t < 0.385 ? 1.18 : 0.72
  if (t > 0.71 && t < 0.719) return 0.55
  return 1
}

/** A row of diodes that loses drive for a frame, in a different place each
 *  time round. */
function dropoutAt(time: number, layers: Layers) {
  const t = (time % 9300) / 9300
  const at = (line: number) => ({
    top: Math.round(line * layers.pitchY),
    height: Math.ceil(layers.pitchY),
  })

  if (t > 0.228 && t < 0.234) return at(4)
  if (t > 0.556 && t < 0.561) return at(1)
  if (t > 0.817 && t < 0.822) return at(7)
  return null
}

export { LedPanel }
