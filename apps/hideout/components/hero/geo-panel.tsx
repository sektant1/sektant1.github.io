"use client"

import * as React from "react"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"
import { cn } from "@workspace/ui/lib/utils"

import { AsciiPlanetScene } from "@/components/ascii-planet/ascii-planet-lazy"
import type { EarthLocation } from "@/components/ascii-planet/markers"
import type { RenderStyle } from "@/components/ascii-planet/policy"
import {
  STATION,
  bearingDeg,
  formatBearing,
  formatCoordinate,
  formatRange,
  rangeKm,
} from "@/lib/geo-range"

type Fix = { location: EarthLocation | null } | null

type GeoPanelProps = {
  /** Panel caption, editable at /admin/home. */
  title: string
  /** The drag affordance printed in the footer, editable at /admin/home. */
  hint: string
  /** Character grid, or projected wireframe. Editable at /admin/home. */
  style?: RenderStyle
  className?: string
}

/**
 * The tracking display: a globe, and the vector from the station to whoever is
 * reading.
 *
 * Every figure printed here is computed from the coordinate the pin was placed
 * at — bearing and range from Prypiat, the reader's own position — so the
 * panel reports rather than decorates. Until the lookup returns it prints
 * dashes and says it is scanning, and if the lookup fails it says so.
 *
 * The whole report is one block in the top corner. The lock state it used to
 * print opposite is already in the frame's stamp, and a second copy of it in
 * the far corner was the panel saying the same word twice.
 */
export function GeoPanel({ title, hint, style, className }: GeoPanelProps) {
  const [fix, setFix] = React.useState<Fix>(null)
  const onLocation = React.useCallback(
    (location: EarthLocation | null) => setFix({ location }),
    []
  )

  const state = !fix ? "scan" : fix.location ? "lock" : "nofix"
  const here = fix?.location ?? null
  const vector = here
    ? {
        azimuth: formatBearing(bearingDeg(STATION, here)),
        range: formatRange(rangeKm(STATION, here)),
        target: here.country,
      }
    : null

  return (
    <TerminalFrame
      title={title}
      stamp={STATES[state].stamp}
      footer={`PRYPIAT ${formatCoordinate(STATION)}`}
      footerStamp={hint}
      className={className}
      bodyClassName="flex min-h-[26rem] flex-col overflow-hidden"
    >
      {/* Headroom for the pin's label, which is drawn above the marker and
          would otherwise ride up into the title rule. */}
      <div className="relative flex flex-1 items-center justify-center p-2 pt-9">
        {/* One cluster, not two. The panel used to report from opposite
            corners, which read as two instruments disagreeing about which
            fix they were describing. */}
        <Readout
          className="top-2 left-2 items-start"
          pending={!vector}
          lines={[
            `GEO   // ${STATES[state].geo}`,
            `TRACK // ${vector ? vector.target : "----"}`,
            `AZ    // ${vector ? vector.azimuth : "---.-"}`,
            `RNG   // ${vector ? vector.range : "----"} KM`,
          ]}
        />

        <div className="relative mx-auto w-full max-w-[20rem] min-w-0 sm:max-w-[24rem]">
          <AsciiPlanetScene
            className="ascii-planet-scene"
            ariaLabel="Rotating ASCII globe, marked with where you are reading from. Drag to spin it."
            // A globe on a tracking display turns at the speed of something being
            // watched, not something being shown off. At six the wire crossed a
            // cell a frame and the raster strobed against it.
            autoRotateSpeed={1.6}
            modelScale={0.8}
            style={style}
            onLocation={onLocation}
          />
          <Reticle state={state} />
        </div>

        {/* A phone has no room for readouts in two corners, and the frame's
            stamp is hidden there too — so the same report prints as one line
            under the globe rather than not at all. */}
        <p
          aria-hidden="true"
          data-pending={!vector}
          className="geo-readout absolute inset-x-2 bottom-2 truncate text-center font-mono text-[0.55rem] tracking-[0.12em] text-terminal-ink-faint uppercase tabular-nums sm:hidden"
        >
          {vector
            ? `${vector.target} // ${vector.range} KM // AZ ${vector.azimuth}`
            : state === "nofix"
              ? "GEO // NO FIX"
              : "GEO // SCAN"}
        </p>

        {/* The readouts are a grid of codes; this is the same report in a
            sentence, for a reader who is hearing the page rather than
            scanning it. */}
        <p className="sr-only" aria-live="polite">
          {here && vector
            ? `Tracking ${vector.target}: ${vector.range} kilometres from the station at Prypiat, bearing ${vector.azimuth} degrees.`
            : state === "nofix"
              ? "No position fix. The station could not resolve where you are reading from."
              : "Scanning for your position."}
        </p>
      </div>
    </TerminalFrame>
  )
}

/** What each state prints, in the three places the panel says it. */
const STATES = {
  scan: { stamp: "[ SCAN ]", geo: "SCAN", lock: "SOFT" },
  lock: { stamp: "[ LOCK ]", geo: "FIX", lock: "HARD" },
  nofix: { stamp: "[ NO FIX ]", geo: "NONE", lock: "NONE" },
} as const

type FixState = keyof typeof STATES

function Readout({
  lines,
  pending,
  className,
}: {
  lines: string[]
  pending: boolean
  className?: string
}) {
  return (
    <div
      aria-hidden="true"
      data-pending={pending}
      className={cn(
        "geo-readout absolute hidden flex-col font-mono text-[0.52rem] leading-relaxed tracking-[0.12em] text-terminal-ink-faint uppercase tabular-nums sm:flex sm:text-[0.56rem]",
        className
      )}
    >
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  )
}

/**
 * The sight the display holds its target in. Wide and dim while the station is
 * still looking, contracting once onto the pin when the position lands — the
 * panel's own state change, and the only motion on the page that is not
 * ambient.
 */
function Reticle({ state }: { state: FixState }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 size-full text-primary/35"
    >
      <g className="geo-reticle" data-state={state}>
        <g stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 3">
          <line x1="50" y1="0" x2="50" y2="34" />
          <line x1="50" y1="66" x2="50" y2="100" />
          <line x1="0" y1="50" x2="34" y2="50" />
          <line x1="66" y1="50" x2="100" y2="50" />
        </g>
        <circle
          cx="50"
          cy="50"
          r="33"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          strokeDasharray="1 4"
        />
        {/* Corner ticks, which read as a sight rather than a border. */}
        <g stroke="currentColor" strokeWidth="0.5">
          {[
            [4, 4, 12, 4, 4, 12],
            [96, 4, 88, 4, 96, 12],
            [4, 96, 12, 96, 4, 88],
            [96, 96, 88, 96, 96, 88],
          ].map(([x, y, hx, hy, vx, vy]) => (
            <g key={`${x}-${y}`}>
              <line x1={x} y1={y} x2={hx} y2={hy} />
              <line x1={x} y1={y} x2={vx} y2={vy} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  )
}
