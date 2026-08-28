"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"

import {
  AsciiBannerView,
  bannerVariants,
} from "@workspace/ui/components/ascii-banner-view"
import {
  renderAsciiArt,
  type AsciiBannerFont,
} from "@workspace/ui/lib/ascii-art"

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
 *
 * Renders the art in the browser, which costs the figlet engine and its font
 * tables in the bundle. Where the text is known ahead of time, call
 * `renderAsciiArt` on the server and pass the result to `AsciiBannerView`
 * instead — same output, none of the weight.
 */
function AsciiBanner({
  text,
  font = "Delta Corps Priest 1",
  ...props
}: AsciiBannerProps) {
  const { art, columns } = React.useMemo(
    () => renderAsciiArt(text, font),
    [text, font]
  )

  return (
    <AsciiBannerView
      art={art}
      columns={columns}
      text={text}
      font={font}
      {...props}
    />
  )
}

export { AsciiBanner, bannerVariants }
export type { AsciiBannerFont }
