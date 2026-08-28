import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

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

type AsciiBannerViewProps = Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof bannerVariants> & {
    /** Pre-rendered art. `renderAsciiArt` in lib/ascii-art produces it. */
    art: string
    /** The art's own widest line. */
    columns: number
    /** The string the art spells, for assistive tech. */
    text: string
    /** Names the treatment; the fill differs for the heaviest face. */
    font?: string
    /**
     * "scanlines" is the CRT line pattern alone. "glitch" adds a monochrome
     * sync tear that fires on its own every few seconds, and holds on hover.
     */
    effect?: "none" | "scanlines" | "glitch"
  }

/**
 * Draws finished ASCII art with the CRT treatment.
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

export { AsciiBannerView, bannerVariants }
