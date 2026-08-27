"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import figlet from "figlet"
import banner3 from "figlet/importable-fonts/Banner3.js"
import big from "figlet/importable-fonts/Big.js"
import deltaCorpsPriest1 from "figlet/importable-fonts/Delta Corps Priest 1.js"
import dosRebel from "figlet/importable-fonts/DOS Rebel.js"
import slant from "figlet/importable-fonts/Slant.js"
import small from "figlet/importable-fonts/Small.js"
import standard from "figlet/importable-fonts/Standard.js"
import subZero from "figlet/importable-fonts/Sub-Zero.js"

import { cn } from "@workspace/ui/lib/utils"

// Fonts are imported as modules rather than fetched, so rendering stays
// synchronous and the component works offline.
//
const FONTS = {
  Standard: standard,
  Slant: slant,
  Small: small,
  Big: big,
  Banner3: banner3,
  "Delta Corps Priest 1": deltaCorpsPriest1,
  "DOS Rebel": dosRebel,
  "Sub-Zero": subZero,
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
  "w-full pb-[0.12em] font-mono ascii-fit-text leading-[1] whitespace-pre ascii-raster select-none",
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
      // Sizes set the ceiling; ascii-fit-text shrinks below it to fit the
      // container, so the art never overflows at any width.
      size: {
        sm: "[--ascii-max:0.65rem] [--ascii-min:0.24rem]",
        default: "[--ascii-max:1rem] [--ascii-min:0.26rem]",
        lg: "[--ascii-max:1.55rem] [--ascii-min:0.28rem]",
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
     * "scanlines" is the CRT line pattern alone. "glitch" adds a monochrome
     * sync tear that fires on its own every few seconds, and holds on hover.
     */
    effect?: "none" | "scanlines" | "glitch"
  }

/**
 * Large text rendered as figlet ASCII art, with optional CRT treatment. The
 * real string stays available to screen readers; the art is decorative.
 */
function AsciiBanner({
  text,
  font = "Delta Corps Priest 1",
  effect = "glitch",
  tone,
  size,
  className,
  ...props
}: AsciiBannerProps) {
  const { art, columns } = React.useMemo(() => {
    ensureFontsRegistered()
    // Figlet pads its output with trailing blank lines, which read as dead
    // space above whatever follows the banner.
    const rendered = figlet
      .textSync(text, { font, horizontalLayout: "fitted" })
      .replace(/\s+$/, "")
    const widest = rendered
      .split("\n")
      .reduce((max, line) => Math.max(max, line.length), 0)
    return { art: rendered, columns: widest }
  }, [text, font])

  return (
    <div
      data-slot="ascii-banner"
      data-effect={effect}
      data-font={font}
      className={cn(
        "group/ascii-banner ascii-fit relative isolate crt-bloom",
        className
      )}
      {...props}
      // The art's own column count is what ascii-fit-text divides by.
      style={{ "--ascii-cols": columns, ...props.style } as React.CSSProperties}
    >
      <span className="sr-only">{text}</span>
      <pre
        aria-hidden="true"
        className={cn(
          bannerVariants({ tone, size }),
          font === "Delta Corps Priest 1" || effect === "scanlines"
            ? "crt-terminal-fill"
            : "ascii-phosphor-ink"
        )}
      >
        {art}
      </pre>

      {effect === "glitch" ? (
        <pre
          aria-hidden="true"
          className={cn(
            bannerVariants({ tone, size }),
            "pointer-events-none absolute inset-0 ascii-signal-echo ascii-phosphor-ink"
          )}
        >
          {art}
        </pre>
      ) : null}
    </div>
  )
}

export { AsciiBanner, bannerVariants }
