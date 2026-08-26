"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { usePrefersReducedMotion } from "@workspace/ui/hooks/use-reduced-motion"

// Dark to bright. Index into this with a 0..1 lambert term.
const RAMP = " .:-=+*#%@"

export type AsciiSolidShape = "sphere" | "torus" | "cube"

type AsciiSolidProps = Omit<React.ComponentProps<"pre">, "children"> & {
  shape?: AsciiSolidShape
  /** Character columns. Rows are derived, since a cell is about twice as tall as it is wide. */
  columns?: number
  /** Radians per second. */
  speed?: number
}

/**
 * A rotating solid rendered as text. Every frame projects the surface onto a
 * character grid and shades it with a lambert term, which is why it reads as
 * a lit object rather than an animated glyph pattern.
 *
 * Honours prefers-reduced-motion by rendering a single static frame.
 */
function AsciiSolid({
  shape = "sphere",
  columns = 64,
  speed = 0.6,
  className,
  ...props
}: AsciiSolidProps) {
  const [frame, setFrame] = React.useState(() => render(shape, columns, 0))
  const reduceMotion = usePrefersReducedMotion()

  // The reduced-motion frame is derived, not stored: writing it from an
  // effect would set state during commit and cascade a second render.
  const staticFrame = React.useMemo(
    () => (reduceMotion ? render(shape, columns, 0.9) : null),
    [reduceMotion, shape, columns]
  )

  React.useEffect(() => {
    if (reduceMotion) return

    let raf = 0
    let start: number | null = null

    const tick = (now: number) => {
      start ??= now
      setFrame(render(shape, columns, ((now - start) / 1000) * speed))
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shape, columns, speed, reduceMotion])

  return (
    <pre
      data-slot="ascii-solid"
      aria-hidden="true"
      className={cn(
        "overflow-hidden font-mono text-[0.5rem] leading-[0.85] text-primary select-none",
        className
      )}
      {...props}
    >
      {staticFrame ?? frame}
    </pre>
  )
}

function render(shape: AsciiSolidShape, columns: number, t: number) {
  const rows = Math.max(8, Math.round(columns / 2))
  switch (shape) {
    case "torus":
      return renderTorus(columns, rows, t)
    case "cube":
      return renderCube(columns, rows, t)
    default:
      return renderSphere(columns, rows, t)
  }
}

function shade(intensity: number) {
  const index = Math.round(clamp(intensity, 0, 1) * (RAMP.length - 1))
  return RAMP[index]
}

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value
}

/**
 * Ray-cast against a unit sphere, then look up a procedural land mask in
 * surface coordinates. Without the mask the lighting alone is rotationally
 * symmetric and the sphere would look motionless.
 */
function renderSphere(columns: number, rows: number, t: number) {
  const lines: string[] = []
  const lx = -0.5
  const ly = -0.6
  const lz = 0.62

  for (let row = 0; row < rows; row++) {
    let line = ""
    const y = (row / (rows - 1)) * 2 - 1

    for (let col = 0; col < columns; col++) {
      const x = ((col / (columns - 1)) * 2 - 1) * 1.02
      const r2 = x * x + y * y

      if (r2 > 1) {
        line += " "
        continue
      }

      const z = Math.sqrt(1 - r2)
      const lambert = clamp(x * lx + y * ly + z * lz, 0, 1)

      // Surface coordinates, spun about the vertical axis.
      const lon = Math.atan2(x, z) + t
      const lat = Math.asin(clamp(y, -1, 1))
      const land = landMask(lon, lat)

      line += shade(land ? lambert * 0.55 + 0.35 : lambert * 0.5)
    }

    lines.push(line)
  }

  return lines.join("\n")
}

// Cheap band-limited value noise. Deterministic, no allocation, good enough
// to read as coastlines at this resolution.
function landMask(lon: number, lat: number) {
  const n =
    Math.sin(lon * 2.1 + Math.cos(lat * 3.3) * 1.7) * 0.5 +
    Math.sin(lon * 3.7 - lat * 2.2) * 0.3 +
    Math.sin(lat * 5.1 + Math.cos(lon * 1.9) * 2.4) * 0.35
  return n > 0.18
}

/** The classic donut: parametric torus with a per-cell depth buffer. */
function renderTorus(columns: number, rows: number, t: number) {
  const buffer = new Array<string>(columns * rows).fill(" ")
  const depth = new Float32Array(columns * rows)

  const cosA = Math.cos(t)
  const sinA = Math.sin(t)
  const cosB = Math.cos(t * 0.53)
  const sinB = Math.sin(t * 0.53)

  const scale = Math.min(columns, rows * 2) * 0.28

  for (let theta = 0; theta < Math.PI * 2; theta += 0.06) {
    const cosT = Math.cos(theta)
    const sinT = Math.sin(theta)

    for (let phi = 0; phi < Math.PI * 2; phi += 0.02) {
      const cosP = Math.cos(phi)
      const sinP = Math.sin(phi)

      // Point on the tube, then on the ring.
      const circleX = 2 + cosT
      const x0 = circleX * cosP
      const y0 = sinT
      const z0 = circleX * sinP

      // Rotate about X then Z.
      const x1 = x0
      const y1 = y0 * cosA - z0 * sinA
      const z1 = y0 * sinA + z0 * cosA
      const x2 = x1 * cosB - y1 * sinB
      const y2 = x1 * sinB + y1 * cosB
      const z2 = z1 + 5

      const inv = 1 / z2
      const col = Math.round(columns / 2 + scale * x2 * inv * 2)
      const row = Math.round(rows / 2 - scale * y2 * inv)
      if (col < 0 || col >= columns || row < 0 || row >= rows) continue

      // Surface normal through the same rotations.
      const nx0 = cosT * cosP
      const ny0 = sinT
      const nz0 = cosT * sinP
      const ny1 = ny0 * cosA - nz0 * sinA
      const nz1 = ny0 * sinA + nz0 * cosA
      const nx2 = nx0 * cosB - ny1 * sinB
      const ny2 = nx0 * sinB + ny1 * cosB

      const lambert = (-nx2 * 0.4 - ny2 * 0.6 + nz1 * 0.7) * 0.8
      if (lambert <= 0) continue

      const index = row * columns + col
      if (inv <= depth[index]) continue

      depth[index] = inv
      buffer[index] = shade(lambert)
    }
  }

  return toLines(buffer, columns, rows)
}

/** A wireframe-ish cube: eight vertices, twelve edges, points plotted along each. */
function renderCube(columns: number, rows: number, t: number) {
  const buffer = new Array<string>(columns * rows).fill(" ")
  const depth = new Float32Array(columns * rows)

  const corners: [number, number, number][] = []
  for (const x of [-1, 1])
    for (const y of [-1, 1]) for (const z of [-1, 1]) corners.push([x, y, z])

  const edges: [number, number][] = []
  for (let a = 0; a < corners.length; a++) {
    for (let b = a + 1; b < corners.length; b++) {
      const diff = corners[a].reduce(
        (acc, value, axis) => acc + (value === corners[b][axis] ? 0 : 1),
        0
      )
      if (diff === 1) edges.push([a, b])
    }
  }

  const cosA = Math.cos(t * 0.9)
  const sinA = Math.sin(t * 0.9)
  const cosB = Math.cos(t * 0.6)
  const sinB = Math.sin(t * 0.6)
  const scale = Math.min(columns, rows * 2) * 0.3

  const project = ([x, y, z]: [number, number, number]) => {
    const y1 = y * cosA - z * sinA
    const z1 = y * sinA + z * cosA
    const x2 = x * cosB - z1 * sinB
    const z2 = x * sinB + z1 * cosB + 5
    const inv = 1 / z2
    return {
      col: Math.round(columns / 2 + scale * x2 * inv * 2),
      row: Math.round(rows / 2 - scale * y1 * inv),
      inv,
    }
  }

  for (const [a, b] of edges) {
    const pa = project(corners[a])
    const pb = project(corners[b])
    const steps = Math.max(
      Math.abs(pb.col - pa.col),
      Math.abs(pb.row - pa.row),
      1
    )

    for (let step = 0; step <= steps; step++) {
      const u = step / steps
      const col = Math.round(pa.col + (pb.col - pa.col) * u)
      const row = Math.round(pa.row + (pb.row - pa.row) * u)
      if (col < 0 || col >= columns || row < 0 || row >= rows) continue

      const inv = pa.inv + (pb.inv - pa.inv) * u
      const index = row * columns + col
      if (inv <= depth[index]) continue

      depth[index] = inv
      // Nearer edges read brighter, which is the only depth cue a wireframe has.
      buffer[index] = shade((inv - 0.16) * 5.5)
    }
  }

  return toLines(buffer, columns, rows)
}

function toLines(buffer: string[], columns: number, rows: number) {
  const lines: string[] = []
  for (let row = 0; row < rows; row++) {
    lines.push(buffer.slice(row * columns, (row + 1) * columns).join(""))
  }
  return lines.join("\n")
}

export { AsciiSolid }
