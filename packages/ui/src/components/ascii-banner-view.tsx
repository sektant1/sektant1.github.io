import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import CRTEffect from "vault66-crt-effect"
import "vault66-crt-effect/style.css"

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
     * "scanlines" is the raster alone. "glitch" adds the tube's own faults on
     * top of it: a refresh bar sweeping down and the occasional interference.
     * Both come from vault66-crt-effect; "none" renders the bare art.
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
/**
 * How each treatment is configured on the CRT layer.
 *
 * Curvature, vignette and glare are off everywhere: the page already paints a
 * tube face over the whole screen, and a second piece of glass around one
 * block reads as a screen inside a screen. What is wanted here is the raster
 * and the faults — the parts that belong to the art rather than to the box.
 *
 * The glow is off too, because the bloom this component already carries
 * follows the glyph shapes; the library's is a rectangle around them.
 */
const CRT_SETTINGS = {
  none: { enabled: false },
  scanlines: {
    theme: "custom" as const,
    scanlineColor: "color-mix(in oklch, var(--ascii-ink) 55%, transparent)",
    scanlineOpacity: 0.22,
    scanlineThickness: 1,
    scanlineGap: 2,
    enableScanlines: true,
    enableSweep: false,
    enableGlitch: false,
    enableFlicker: false,
    // The phosphor spill, as a glow around the block rather than a shadow
    // traced onto every glyph.
    enableGlow: true,
    glowColor: "color-mix(in oklch, var(--ascii-ink) 45%, transparent)",
    enableEdgeGlow: false,
    enableVignette: false,
    enableCurvature: false,
    enableGlare: false,
  },
} as const

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
  const crt =
    effect === "none"
      ? CRT_SETTINGS.none
      : {
          ...CRT_SETTINGS.scanlines,
          // A refresh bar and a little unsteadiness in the beam: what
          // separates a screen that is on from a picture of one.
          enableSweep: effect === "glitch",
          sweepDuration: 14,
          sweepStyle: "soft" as const,
          enableFlicker: effect === "glitch",
          flickerIntensity: "low" as const,
          flickerSpeed: "low" as const,
          // The library's own glitch displaces the whole block sideways. On
          // art built from tiling half-blocks that does not read as
          // interference; it reads as letters coming apart, which is the fault
          // this banner spent long enough having. Brightness may waver here.
          // Geometry may not.
          enableGlitch: false,
        }

  return (
    <div
      data-slot="ascii-banner"
      data-effect={effect}
      data-font={font}
      className={cn(
        // No crt-bloom here, and this is the whole reason the banner used to
        // arrive with its letters torn. drop-shadow rasterises the block and
        // haloes it as one mass, which is lovely on a logo and ruinous on art
        // built from cells that must tile: at nine pixels a cell the halo is
        // as wide as the strokes, so it bleeds into the seams and the
        // letterforms come apart. The glow below is a box around the block,
        // and it never touches the glyphs.
        "group/ascii-banner ascii-fit relative isolate",
        className
      )}
      {...props}
      // The art's own column count is what ascii-fit-text divides by.
      style={{ "--ascii-cols": columns, ...props.style } as React.CSSProperties}
    >
      <span className="sr-only">{text}</span>
      <CRTEffect {...crt} fill>
        {/* One flat ink, and the raster painted over it by the layer above.
            The fill used to be a gradient clipped to the glyphs, which mixed
            toward transparent — so every band it drew took pixels out of the
            letterforms rather than shading them, and the art arrived with
            pieces missing. */}
        <pre
          aria-hidden="true"
          className={cn(bannerVariants({ tone, size }), "ascii-phosphor-ink")}
        >
          {art}
        </pre>
      </CRTEffect>
    </div>
  )
}

export { AsciiBannerView, bannerVariants }
