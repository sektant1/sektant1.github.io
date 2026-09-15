import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { AsciiBannerView } from "@workspace/ui/components/ascii-banner-view"
import { renderAsciiArt } from "@workspace/ui/lib/ascii-art"

describe("block banner rendering", () => {
  it.each(["DOS Rebel", "ANSI Regular", "Bloody", "Electronic"] as const)(
    "renders %s without browser-dependent block glyphs",
    (font) => {
      const text = "Sektant Hideout"
      const markup = renderToStaticMarkup(
        <AsciiBannerView
          {...renderAsciiArt(text, font)}
          text={text}
          font={font}
        />
      )

      expect(markup).toContain("<svg")
      expect(markup).toContain("<path")
      expect(markup).not.toContain("<pre")
      expect(markup).toContain(text)
    }
  )

  it.each(["Sub-Zero", "Cyberlarge"] as const)(
    "keeps text rendering for %s line art",
    (font) => {
      const text = "Sektant Hideout"
      const markup = renderToStaticMarkup(
        <AsciiBannerView {...renderAsciiArt(text, font)} text={text} />
      )

      expect(markup).toContain("<pre")
      expect(markup).not.toContain("<svg")
    }
  )

  it("renders Delta Corps Priest 1 as animated terminal text", () => {
    const text = "Sektant Hideout"
    const markup = renderToStaticMarkup(
      <AsciiBannerView
        {...renderAsciiArt(text, "Delta Corps Priest 1")}
        text={text}
        font="Delta Corps Priest 1"
      />
    )

    expect(markup).toContain('data-slot="terminal-ascii"')
    expect(markup).toContain("<pre")
    expect(markup).not.toContain("<svg")
    expect(markup).toContain("████")
    expect(markup).toContain(text)
  })
})
