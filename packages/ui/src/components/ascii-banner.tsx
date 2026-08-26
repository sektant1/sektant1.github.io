"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

// A 5-row block font. Every glyph is 6 columns wide so lines stay aligned
// without measuring anything.
const GLYPH_WIDTH = 6
const GLYPH_HEIGHT = 5

const FONT: Record<string, string[]> = {
  A: [" ████ ", "██  ██", "██████", "██  ██", "██  ██"],
  B: ["█████ ", "██  ██", "█████ ", "██  ██", "█████ "],
  C: [" █████", "██    ", "██    ", "██    ", " █████"],
  D: ["█████ ", "██  ██", "██  ██", "██  ██", "█████ "],
  E: ["██████", "██    ", "█████ ", "██    ", "██████"],
  F: ["██████", "██    ", "█████ ", "██    ", "██    "],
  G: [" █████", "██    ", "██ ███", "██  ██", " █████"],
  H: ["██  ██", "██  ██", "██████", "██  ██", "██  ██"],
  I: ["██████", "  ██  ", "  ██  ", "  ██  ", "██████"],
  J: ["██████", "    ██", "    ██", "██  ██", " ████ "],
  K: ["██  ██", "██ ██ ", "████  ", "██ ██ ", "██  ██"],
  L: ["██    ", "██    ", "██    ", "██    ", "██████"],
  M: ["██  ██", "██████", "██████", "██  ██", "██  ██"],
  N: ["██  ██", "███ ██", "██████", "██ ███", "██  ██"],
  O: [" ████ ", "██  ██", "██  ██", "██  ██", " ████ "],
  P: ["█████ ", "██  ██", "█████ ", "██    ", "██    "],
  Q: [" ████ ", "██  ██", "██  ██", "██ ██ ", " ██ ██"],
  R: ["█████ ", "██  ██", "█████ ", "██ ██ ", "██  ██"],
  S: [" █████", "██    ", " ████ ", "    ██", "█████ "],
  T: ["██████", "  ██  ", "  ██  ", "  ██  ", "  ██  "],
  U: ["██  ██", "██  ██", "██  ██", "██  ██", " ████ "],
  V: ["██  ██", "██  ██", "██  ██", " ████ ", "  ██  "],
  W: ["██  ██", "██  ██", "██████", "██████", "██  ██"],
  X: ["██  ██", " ████ ", "  ██  ", " ████ ", "██  ██"],
  Y: ["██  ██", " ████ ", "  ██  ", "  ██  ", "  ██  "],
  Z: ["██████", "   ██ ", "  ██  ", " ██   ", "██████"],
  "0": [" ████ ", "██  ██", "██  ██", "██  ██", " ████ "],
  "1": ["  ██  ", " ███  ", "  ██  ", "  ██  ", "██████"],
  "2": [" ████ ", "██  ██", "   ██ ", " ██   ", "██████"],
  "3": ["█████ ", "    ██", " ████ ", "    ██", "█████ "],
  "4": ["██  ██", "██  ██", "██████", "    ██", "    ██"],
  "5": ["██████", "██    ", "█████ ", "    ██", "█████ "],
  "6": [" █████", "██    ", "█████ ", "██  ██", " ████ "],
  "7": ["██████", "    ██", "   ██ ", "  ██  ", "  ██  "],
  "8": [" ████ ", "██  ██", " ████ ", "██  ██", " ████ "],
  "9": [" ████ ", "██  ██", " █████", "    ██", " ████ "],
  ".": ["      ", "      ", "      ", "      ", "  ██  "],
  "-": ["      ", "      ", "██████", "      ", "      "],
  "/": ["    ██", "   ██ ", "  ██  ", " ██   ", "██    "],
  ":": ["      ", "  ██  ", "      ", "  ██  ", "      "],
  "!": ["  ██  ", "  ██  ", "  ██  ", "      ", "  ██  "],
  " ": ["      ", "      ", "      ", "      ", "      "],
}

const bannerVariants = cva(
  "w-full overflow-x-auto font-mono leading-[0.9] whitespace-pre select-none",
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
    /** Rendered in the block font. Unsupported characters fall back to a space. */
    text: string
    /** Adds scanlines and a periodic horizontal tear. */
    effect?: "none" | "scanlines" | "glitch"
  }

/**
 * Large text drawn in a block font, with optional CRT treatment. The real
 * string stays available to screen readers; the art is decorative.
 */
function AsciiBanner({
  text,
  effect = "scanlines",
  tone,
  size,
  className,
  ...props
}: AsciiBannerProps) {
  const art = React.useMemo(() => toArt(text), [text])

  return (
    <div
      data-slot="ascii-banner"
      data-effect={effect}
      className={cn("group/ascii-banner relative", className)}
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
              "pointer-events-none absolute inset-0 text-destructive opacity-0 mix-blend-screen group-hover/ascii-banner:animate-pulse group-hover/ascii-banner:opacity-70",
              "translate-x-[2px] -translate-y-[1px]"
            )}
          >
            {art}
          </pre>
          <pre
            aria-hidden="true"
            className={cn(
              bannerVariants({ tone, size }),
              "pointer-events-none absolute inset-0 text-cyan-400 opacity-0 mix-blend-screen group-hover/ascii-banner:opacity-60",
              "-translate-x-[2px] translate-y-[1px]"
            )}
          >
            {art}
          </pre>
        </>
      ) : null}

      {effect !== "none" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 3px)",
          }}
        />
      ) : null}
    </div>
  )
}

function toArt(text: string) {
  const chars = [...text.toUpperCase()]
  const rows: string[] = []

  for (let row = 0; row < GLYPH_HEIGHT; row++) {
    rows.push(
      chars
        .map(
          (char) => (FONT[char] ?? FONT[" "])[row] ?? " ".repeat(GLYPH_WIDTH)
        )
        .join("")
    )
  }

  return rows.join("\n")
}

export { AsciiBanner, bannerVariants }
