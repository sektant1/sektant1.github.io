"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import figlet from "figlet"
import banner3 from "figlet/importable-fonts/Banner3.js"
import big from "figlet/importable-fonts/Big.js"
import slant from "figlet/importable-fonts/Slant.js"
import small from "figlet/importable-fonts/Small.js"
import standard from "figlet/importable-fonts/Standard.js"

import { cn } from "@workspace/ui/lib/utils"

// Fonts are imported as modules rather than fetched, so rendering stays
// synchronous and the component works offline.
//
// Every font here is drawn with plain ASCII. The block-drawing fonts figlet
// also ships (ANSI Shadow and friends) look better in a terminal but break
// here: the theme's mono face has no block glyphs, so they fall back to
// another face at a different advance width and the rows stop lining up.
const FONTS = {
  Standard: standard,
  Slant: slant,
  Small: small,
  Big: big,
  Banner3: banner3,
} as const

export type AsciiBannerFont = keyof typeof FONTS

let registered = false

function ensureFontsRegistered() {
  if (registered) return
  for (const [name, data] of Object.entries(FONTS)) {
    figlet.parseFont(name, data)
  }
  registered = true
}

const bannerVariants = cva(
  "w-full overflow-x-auto font-mono leading-[0.95] whitespace-pre select-none",
  {
    variants: {
      tone: {
        default: "text-primary",
        muted: "text-muted-foreground",
        foreground: "text-foreground",
      },
      size: {
        sm: "text-[0.4rem]",
        default: "text-[0.55rem] sm:text-[0.7rem]",
        lg: "text-[0.7rem] sm:text-[1rem]",
      },
    },
    defaultVariants: { tone: "default", size: "default" },
  }
)

type AsciiBannerProps = Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof bannerVariants> & {
    text: string
    font?: AsciiBannerFont
    /**
     * "scanlines" is the CRT line pattern alone. "glitch" adds a chromatic
     * split that fires on its own every few seconds, and holds while hovered.
     */
    effect?: "none" | "scanlines" | "glitch"
  }

/**
 * Large text rendered as figlet ASCII art, with optional CRT treatment. The
 * real string stays available to screen readers; the art is decorative.
 */
function AsciiBanner({
  text,
  font = "Slant",
  effect = "scanlines",
  tone,
  size,
  className,
  ...props
}: AsciiBannerProps) {
  const art = React.useMemo(() => {
    ensureFontsRegistered()
    // Figlet pads its output with trailing blank lines, which read as dead
    // space above whatever follows the banner.
    return figlet.textSync(text, { font }).replace(/\s+$/, "")
  }, [text, font])

  return (
    <div
      data-slot="ascii-banner"
      data-effect={effect}
      className={cn("group/ascii-banner relative crt-bloom", className)}
      {...props}
    >
      <span className="sr-only">{text}</span>
      <pre aria-hidden="true" className={cn(bannerVariants({ tone, size }))}>
        {art}
      </pre>

      {effect === "glitch" ? (
        <>
          <pre
            aria-hidden="true"
            className={cn(
              bannerVariants({ tone, size }),
              "pointer-events-none absolute inset-0 translate-x-[2px] -translate-y-[1px] text-destructive opacity-0 mix-blend-screen group-hover/ascii-banner:opacity-70"
            )}
          >
            {art}
          </pre>
          <pre
            aria-hidden="true"
            className={cn(
              bannerVariants({ tone, size }),
              "pointer-events-none absolute inset-0 -translate-x-[2px] translate-y-[1px] text-cyan-400 opacity-0 mix-blend-screen group-hover/ascii-banner:opacity-60",
              "motion-safe:animate-[ascii-glitch-b_7s_ease-in-out_infinite]"
            )}
          >
            {art}
          </pre>
        </>
      ) : null}

      {effect !== "none" ? (
        <div
          aria-hidden="true"
          // Dark lines cut through the glyphs, which is what a scanline
          // does. Tinting with currentColor lightened them into stripes that
          // fought the art for legibility.
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--background) 0 1px, transparent 1px 4px)",
          }}
        />
      ) : null}
      {effect === "glitch" ? <style>{GLITCH_KEYFRAMES}</style> : null}
    </div>
  )
}

// Long quiet stretches with two brief tears, so the banner reads as a stable
// display that occasionally drops sync rather than as a constant animation.
const GLITCH_KEYFRAMES = `
@keyframes ascii-glitch-a {
  0%, 86%, 100% { opacity: 0; transform: translate(2px, -1px); }
  87% { opacity: 0.75; transform: translate(5px, -1px); }
  89% { opacity: 0.4; transform: translate(-3px, 1px); }
  91% { opacity: 0; transform: translate(2px, -1px); }
  96% { opacity: 0.6; transform: translate(4px, 0); }
  98% { opacity: 0; transform: translate(2px, -1px); }
}
@keyframes ascii-glitch-b {
  0%, 86%, 100% { opacity: 0; transform: translate(-2px, 1px); }
  87% { opacity: 0.65; transform: translate(-5px, 1px); }
  89% { opacity: 0.35; transform: translate(3px, -1px); }
  91% { opacity: 0; transform: translate(-2px, 1px); }
  96% { opacity: 0.5; transform: translate(-4px, 0); }
  98% { opacity: 0; transform: translate(-2px, 1px); }
}
`

export { AsciiBanner, bannerVariants }
