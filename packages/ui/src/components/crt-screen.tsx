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
    intensity: {
      subtle: "[--crt-scanline-opacity:0.05] [--crt-vignette-opacity:0.18]",
      default: "[--crt-scanline-opacity:0.1] [--crt-vignette-opacity:0.35]",
      heavy: "[--crt-scanline-opacity:0.18] [--crt-vignette-opacity:0.6]",
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
          "pointer-events-none absolute inset-0 z-20 opacity-[var(--crt-scanline-opacity)]",
          flicker && "motion-safe:animate-[crt-flicker_4s_steps(2)_infinite]"
        )}
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.9) 0 1px, transparent 1px 3px)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgb(0 0 0 / var(--crt-vignette-opacity)) 100%)",
        }}
      />

      {sweep ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-20 h-16 opacity-0 motion-safe:animate-[crt-sweep_6s_linear_infinite]"
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
  0%, 100% { opacity: var(--crt-scanline-opacity); }
  50% { opacity: calc(var(--crt-scanline-opacity) * 1.6); }
}
@keyframes crt-sweep {
  0% { transform: translateY(-4rem); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}
`

export { CrtScreen, crtVariants }
