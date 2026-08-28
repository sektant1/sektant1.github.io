"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const crtVariants = cva("relative isolate overflow-hidden", {
  variants: {
    curvature: {
      none: "",
      subtle: "[border-radius:6px/10px]",
    },
    /* The dial is how much of the picture the gaps take, not how visible a
       bar drawn over it is: the raster cuts, so its depth is the width of the
       part that is missing. Heavy is the reference tube — the same cut the
       hologram pass makes — and is meant for art and readouts rather than for
       a panel of body copy. */
    intensity: {
      subtle: "[--crt-raster-gap:14%] [--crt-vignette-opacity:0.18]",
      default: "[--crt-raster-gap:26%] [--crt-vignette-opacity:0.35]",
      heavy: "[--crt-raster-gap:45%] [--crt-vignette-opacity:0.6]",
    },
  },
  defaultVariants: { curvature: "none", intensity: "default" },
})

type CrtScreenProps = React.ComponentProps<"div"> &
  VariantProps<typeof crtVariants> & {
    /** Slow brightness drift. Suppressed under prefers-reduced-motion. */
    flicker?: boolean
    /** A bright band that sweeps down the screen every few seconds. */
    sweep?: boolean
  }

/**
 * Wraps content in phosphor-monitor artefacts: scanlines, vignette, an
 * optional refresh sweep. Everything is a sibling overlay with
 * pointer-events: none, so the content underneath stays fully interactive.
 */
function CrtScreen({
  className,
  children,
  curvature,
  intensity,
  flicker = false,
  sweep = false,
  ...props
}: CrtScreenProps) {
  return (
    <div
      data-slot="crt-screen"
      className={cn(crtVariants({ curvature, intensity }), className)}
      {...props}
    >
      {children}

      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-20 crt-interlace opacity-0 dark:opacity-100",
          flicker && "motion-safe:animate-[crt-flicker_4s_steps(2)_infinite]"
        )}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 opacity-0 dark:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgb(0 0 0 / var(--crt-vignette-opacity)) 100%)",
        }}
      />

      {sweep ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-20 hidden h-16 opacity-0 motion-safe:animate-[crt-sweep_6s_linear_infinite] dark:block"
          style={{
            background:
              "linear-gradient(to bottom, transparent, rgb(255 255 255 / 0.06), transparent)",
          }}
        />
      ) : null}

      <style>{KEYFRAMES}</style>
    </div>
  )
}

const KEYFRAMES = `
@keyframes crt-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.62; }
}
@keyframes crt-sweep {
  0% { transform: translateY(-4rem); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}
`

export { CrtScreen, crtVariants }
