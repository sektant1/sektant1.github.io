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
  "w-full overflow-x-auto crt-scanfill font-mono leading-[0.95] whitespace-pre select-none",
  {
    variants: {
      // The tone sets --ascii-ink rather than `color`: the glyph fill is a
      // gradient clipped to the text, and background-image cannot read
      // currentColor.
      tone: {
        default: "[--ascii-ink:var(--primary)]",
        muted: "[--ascii-ink:var(--muted-foreground)]",
        foreground: "[--ascii-ink:var(--foreground)]",
      },
      size: {
        sm: "text-[0.4rem]",
        default: "text-[0.55rem] sm:text-[0.7rem]",
        lg: "text-[0.8rem] sm:text-[1.15rem]",
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
  effect = "glitch",
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
      className={cn(
        "group/ascii-banner relative w-fit max-w-full crt-bloom",
        className
      )}
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
              "pointer-events-none absolute inset-0 translate-x-[2px] -translate-y-[1px] opacity-0 mix-blend-screen [--ascii-ink:var(--destructive)] group-hover/ascii-banner:opacity-70",
              "motion-safe:animate-[crt-tear-a_7s_ease-in-out_infinite]"
            )}
          >
            {art}
          </pre>
          <pre
            aria-hidden="true"
            className={cn(
              bannerVariants({ tone, size }),
              "pointer-events-none absolute inset-0 -translate-x-[2px] translate-y-[1px] opacity-0 mix-blend-screen [--ascii-ink:var(--color-cyan-400)] group-hover/ascii-banner:opacity-60",
              "motion-safe:animate-[crt-tear-b_7s_ease-in-out_infinite]"
            )}
          >
            {art}
          </pre>
        </>
      ) : null}
    </div>
  )
}

export { AsciiBanner, bannerVariants }
