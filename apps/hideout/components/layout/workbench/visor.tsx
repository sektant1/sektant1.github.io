"use client"

import * as React from "react"
import { Spinner } from "@workspace/ui/components/spinner"
import { usePrefersReducedMotion } from "@workspace/ui/hooks/use-reduced-motion"
import { cn } from "@workspace/ui/lib/utils"

import { AsciiPlanetScene } from "@/components/ascii-planet/ascii-planet-lazy"
import { SiteMark } from "@/components/layout/site-mark"

/**
 * The instrument.
 *
 * The same ASCII renderer the front page and the boot sequence use, given a
 * permanent home in the chrome — an oscilloscope in the rack rather than a
 * thing you see once on arrival and never again.
 *
 * It is the most expensive object on the site: three, the loader and the
 * post-processing are about 560 KB, reached through the lazy seam so they stay
 * out of every route's bundle. Three conditions gate the mount, and all of
 * them have to hold:
 *
 *   the viewport is wide enough for the instrument to be worth the room,
 *   the reader has opened a surface that shows it,
 *   and reduced motion has not been asked for.
 *
 * Anything else gets the plate below — which says the instrument is off and
 * why, rather than drawing a still frame that pretends to be one.
 */

const MODEL = "/models/bitcoin.glb"
export const MODEL_LABEL = "btc // 1.0"
const SURFACE = { roughness: 0.42, metalness: 0.62, normalScale: 1.5 }
const POST = { edge: 0.72, dither: 0.035, contrast: 1.18 }

/** Below this the ASCII grid has fewer columns than the glyphs need. */
const MIN_WIDTH = 1024

function useWideViewport() {
  const query = `(min-width: ${MIN_WIDTH}px)`
  return React.useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

export function Visor({
  className,
  /** Larger grid in the dock, where the panel is wider than the sidebar. */
  resolution = 0.3,
}: {
  className?: string
  resolution?: number
}) {
  const wide = useWideViewport()
  const reduceMotion = usePrefersReducedMotion()
  const [ready, setReady] = React.useState(false)
  const markReady = React.useCallback(() => setReady(true), [])

  if (!wide || reduceMotion) {
    return (
      <VisorPlate
        className={className}
        reason={reduceMotion ? "motion held" : "screen too narrow"}
      />
    )
  }

  return (
    <div className={cn("relative aspect-square w-full", className)}>
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-300",
          ready ? "pointer-events-none opacity-0" : "opacity-100"
        )}
      >
        <Spinner className="size-5 text-primary crt-glow" />
        <span className="font-mono text-[0.55rem] tracking-[0.2em] text-terminal-chrome-dim uppercase">
          load::model/btc
        </span>
      </div>

      <AsciiPlanetScene
        className="ascii-planet-scene"
        ariaLabel=""
        onReady={markReady}
        modelUrl={MODEL}
        autoRotateSpeed={8}
        modelScale={0.9}
        resolution={resolution}
        surface={SURFACE}
        postOptions={POST}
      />
    </div>
  )
}

/**
 * The instrument, off.
 *
 * A readout, not a control: it reports the state of a device that is not
 * running and the reason it is not. Nothing here is pressable, and nothing
 * here pretends to be a render.
 */
export function VisorPlate({
  className,
  reason,
}: {
  className?: string
  reason: string
}) {
  return (
    <div
      className={cn(
        "flex aspect-square w-full flex-col items-center justify-center gap-3 border border-terminal-rule bg-terminal-wash/40 px-3 text-center",
        className
      )}
    >
      <SiteMark className="size-8 text-terminal-chrome-dim" />
      <p className="font-mono text-[0.6rem] tracking-[0.2em] text-terminal-chrome-dim uppercase">
        визор // off
      </p>
      <p className="font-mono text-[0.6rem] text-terminal-ink-faint lowercase">
        {reason}
      </p>
    </div>
  )
}
