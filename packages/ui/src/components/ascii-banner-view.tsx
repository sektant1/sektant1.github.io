import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

// The tone sets --ascii-ink rather than `color`: the glyph fill is a gradient
// clipped to the text, and background-image cannot read currentColor.
const TONE_VARS = {
  default: "[--ascii-ink:var(--primary)]",
  muted: "[--ascii-ink:var(--muted-foreground)]",
  foreground: "[--ascii-ink:var(--foreground)]",
}

// Sizes set the ceiling; ascii-fit-text shrinks below it to fit the
// container, so the art never overflows at any width.
const SIZE_VARS = {
  sm: "[--ascii-max:0.65rem] [--ascii-min:0.24rem]",
  default: "[--ascii-max:1rem] [--ascii-min:0.26rem]",
  lg: "[--ascii-max:1.55rem] [--ascii-min:0.28rem]",
}

const VARIANTS = {
  variants: { tone: TONE_VARS, size: SIZE_VARS },
  defaultVariants: { tone: "default", size: "default" },
} as const

const bannerVariants = cva(
  "w-full pb-[0.12em] font-mono ascii-fit-text leading-[1] whitespace-pre ascii-raster select-none",
  VARIANTS
)

type AsciiBannerViewProps = Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof bannerVariants> & {
    /** Pre-rendered art. `renderAsciiArt` in lib/ascii-art produces it. */
    art: string
    /** The art's own widest line. */
    columns: number
    /** The string the art spells, for assistive tech. */
    text: string
    /** Names the treatment; kept for callers that switch faces. */
    font?: string
    /**
     * "panel" is the projection locked and steady. "glitch" is the same
     * projection still finding it: rows step sideways for a moment and settle.
     * "none" renders the art in flat ink, with no raster in it at all.
     */
    effect?: "none" | "panel" | "glitch"
  }

/**
 * Draws finished ASCII art as a projected raster — the treatment the globe on
 * the front page gets, in a glyph grid instead of a render target.
 *
 * The art is the silhouette and the fill is the beam: the phosphor ramp steps
 * up each cell and every other row is a gap the page shows through, which is
 * what makes a block of characters read as something being scanned onto a
 * screen rather than as text with an effect on it.
 *
 * Renders no art of its own, which is the point: with no figlet import it
 * carries no engine and no font tables, so a server component can call it and
 * the browser receives glyphs. `AsciiBanner` is this plus the rendering, for
 * callers that want one component.
 */
function AsciiBannerView({
  art,
  columns,
  text,
  font = "Delta Corps Priest 1",
  effect = "glitch",
  tone,
  size,
  className,
  ...props
}: AsciiBannerViewProps) {
  return (
    <div
      data-slot="ascii-banner"
      data-effect={effect}
      data-font={font}
      className={cn("ascii-fit relative isolate", className)}
      {...props}
      // The art's own column count is what ascii-fit-text divides by.
      style={{ "--ascii-cols": columns, ...props.style } as React.CSSProperties}
    >
      <span className="sr-only">{text}</span>

      {/* One layer, not three. The raster is inside the letterforms rather
          than painted over them, so there is nothing to register a second copy
          against — and no board behind it, because a projection has no
          housing. */}
      <pre
        aria-hidden="true"
        className={cn(
          bannerVariants({ tone, size }),
          // Without the raster the ink is flat: a gradient clipped to the
          // glyphs takes pixels out of the letterforms rather than shading
          // them, and at "none" the caller has asked for the art itself.
          effect === "none" ? "ascii-phosphor-ink" : "crt-holo-fill",
          effect === "glitch" && "crt-holo-slip"
        )}
      >
        {art}
      </pre>
    </div>
  )
}

export { AsciiBannerView, bannerVariants }
