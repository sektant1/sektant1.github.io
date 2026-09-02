import { describe, expect, it } from "vitest"

import {
  DEFAULT_HOME_CONTENT,
  HomeContentError,
  normalizeHomeContent,
} from "./home-schema"

describe("normalizeHomeContent", () => {
  it("returns the shipped copy when there is nothing on disk", () => {
    expect(normalizeHomeContent(undefined)).toEqual(DEFAULT_HOME_CONTENT)
    expect(normalizeHomeContent({})).toEqual(DEFAULT_HOME_CONTENT)
  })

  it("keeps every field the file does not mention", () => {
    const content = normalizeHomeContent({
      hero: { tagline: "I break things." },
    })

    expect(content.hero.tagline).toBe("I break things.")
    expect(content.hero.description).toBe(DEFAULT_HOME_CONTENT.hero.description)
    expect(content.sections.posts).toEqual(DEFAULT_HOME_CONTENT.sections.posts)
  })

  it("treats a cleared field as a request for the original", () => {
    const content = normalizeHomeContent({ hero: { tagline: "   " } })

    expect(content.hero.tagline).toBe(DEFAULT_HOME_CONTENT.hero.tagline)
  })

  it("trims what it keeps", () => {
    const content = normalizeHomeContent({
      hero: { operator: "  ОПЕРАТОР // X  " },
    })

    expect(content.hero.operator).toBe("ОПЕРАТОР // X")
  })

  it("allows Cyrillic in the chrome labels", () => {
    const content = normalizeHomeContent({ hero: { systemUnit: "СКТ-02" } })

    expect(content.hero.systemUnit).toBe("СКТ-02")
  })

  it("refuses non-ASCII in the ASCII banner", () => {
    expect(() =>
      normalizeHomeContent({ hero: { bannerWide: "СЕКТАНТ" } })
    ).toThrow(HomeContentError)
  })

  it("refuses text longer than the field allows", () => {
    expect(() =>
      normalizeHomeContent({ hero: { tagline: "x".repeat(241) } })
    ).toThrow(/longer than/)
  })

  it("refuses control characters", () => {
    expect(() => normalizeHomeContent({ hero: { tagline: "ab" } })).toThrow(
      /control characters/
    )
  })

  describe("globe panel", () => {
    it("keeps the two strings that are still written by hand", () => {
      const content = normalizeHomeContent({
        hero: { globeTitle: "ОБЪЕКТ 02", globeFooterEnd: "DRAG // SLEW" },
      })

      expect(content.hero.globeTitle).toBe("ОБЪЕКТ 02")
      expect(content.hero.globeFooterEnd).toBe("DRAG // SLEW")
    })

    it("drops readouts that used to be editable, now that they are measured", () => {
      const content = normalizeHomeContent({
        hero: { globeStatus: "[ LIVE ]", globeReadoutStart: ["RNG // 12.8K"] },
      })

      expect(content.hero).not.toHaveProperty("globeStatus")
      expect(content.hero).not.toHaveProperty("globeReadoutStart")
    })
  })

  describe("sections", () => {
    it("edits one section without touching the others", () => {
      const content = normalizeHomeContent({
        sections: { games: { title: "playables" } },
      })

      expect(content.sections.games.title).toBe("playables")
      expect(content.sections.games.actionLabel).toBe(
        DEFAULT_HOME_CONTENT.sections.games.actionLabel
      )
      expect(content.sections.projects).toEqual(
        DEFAULT_HOME_CONTENT.sections.projects
      )
    })
  })

  it("ignores keys it does not know", () => {
    const content = normalizeHomeContent({ hero: { nonsense: true }, extra: 1 })

    expect(content).toEqual(DEFAULT_HOME_CONTENT)
  })

  it("refuses a hero that is not an object", () => {
    expect(() => normalizeHomeContent({ hero: [] })).toThrow(
      /must be an object/
    )
  })
})

describe("render style", () => {
  it("defaults to the projection", () => {
    expect(normalizeHomeContent({}).render.style).toBe("holo")
  })

  it("takes the character grid when the CMS asks for it", () => {
    expect(
      normalizeHomeContent({ render: { style: "ascii" } }).render.style
    ).toBe("ascii")
  })

  it("falls back rather than refusing a hand-edited style", () => {
    expect(
      normalizeHomeContent({ render: { style: "crt" } }).render.style
    ).toBe("holo")
  })
})
