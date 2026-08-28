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
    const content = normalizeHomeContent({ hero: { tagline: "I break things." } })

    expect(content.hero.tagline).toBe("I break things.")
    expect(content.hero.description).toBe(DEFAULT_HOME_CONTENT.hero.description)
    expect(content.sections.posts).toEqual(DEFAULT_HOME_CONTENT.sections.posts)
  })

  it("treats a cleared field as a request for the original", () => {
    const content = normalizeHomeContent({ hero: { tagline: "   " } })

    expect(content.hero.tagline).toBe(DEFAULT_HOME_CONTENT.hero.tagline)
  })

  it("trims what it keeps", () => {
    const content = normalizeHomeContent({ hero: { operator: "  ОПЕРАТОР // X  " } })

    expect(content.hero.operator).toBe("ОПЕРАТОР // X")
  })

  it("allows Cyrillic in the chrome labels", () => {
    const content = normalizeHomeContent({ hero: { systemUnit: "СКТ-02" } })

    expect(content.hero.systemUnit).toBe("СКТ-02")
  })

  it("refuses non-ASCII in the ASCII banner", () => {
    expect(() => normalizeHomeContent({ hero: { bannerWide: "СЕКТАНТ" } })).toThrow(
      HomeContentError
    )
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

  describe("quick links", () => {
    it("replaces the whole list when one is given", () => {
      const content = normalizeHomeContent({
        hero: { quickLinks: [{ label: "notes", href: "/posts" }] },
      })

      expect(content.hero.quickLinks).toEqual([{ label: "notes", href: "/posts" }])
    })

    it("accepts absolute URLs", () => {
      const content = normalizeHomeContent({
        hero: { quickLinks: [{ label: "code", href: "https://github.com/sektant1" }] },
      })

      expect(content.hero.quickLinks[0].href).toBe("https://github.com/sektant1")
    })

    it("drops rows the editor blanked out", () => {
      const content = normalizeHomeContent({
        hero: {
          quickLinks: [
            { label: "notes", href: "/posts" },
            { label: "", href: "" },
          ],
        },
      })

      expect(content.hero.quickLinks).toHaveLength(1)
    })

    it("falls back when every row was blanked out", () => {
      const content = normalizeHomeContent({ hero: { quickLinks: [] } })

      expect(content.hero.quickLinks).toEqual(DEFAULT_HOME_CONTENT.hero.quickLinks)
    })

    it("refuses a half-filled row", () => {
      expect(() =>
        normalizeHomeContent({ hero: { quickLinks: [{ label: "notes", href: "" }] } })
      ).toThrow(/needs a destination/)
    })

    it("refuses a destination that is neither a path nor a URL", () => {
      expect(() =>
        normalizeHomeContent({ hero: { quickLinks: [{ label: "x", href: "posts" }] } })
      ).toThrow(/site path/)
    })

    it("refuses traversal", () => {
      expect(() =>
        normalizeHomeContent({
          hero: { quickLinks: [{ label: "x", href: "/../etc/passwd" }] },
        })
      ).toThrow(/traverse/)
    })

    it("refuses more links than the panel can show", () => {
      const many = Array.from({ length: 9 }, (_, index) => ({
        label: `link ${index}`,
        href: "/posts",
      }))

      expect(() => normalizeHomeContent({ hero: { quickLinks: many } })).toThrow(
        /at most/
      )
    })
  })

  describe("globe readouts", () => {
    it("accepts a list", () => {
      const content = normalizeHomeContent({
        hero: { globeReadoutStart: ["SCAN // X", "AZ // Y"] },
      })

      expect(content.hero.globeReadoutStart).toEqual(["SCAN // X", "AZ // Y"])
    })

    it("accepts one string per line, the way a textarea sends it", () => {
      const content = normalizeHomeContent({
        hero: { globeReadoutEnd: "TRACK 02\nLOCK // HARD" },
      })

      expect(content.hero.globeReadoutEnd).toEqual(["TRACK 02", "LOCK // HARD"])
    })

    it("falls back when the list is emptied", () => {
      const content = normalizeHomeContent({ hero: { globeReadoutEnd: "\n \n" } })

      expect(content.hero.globeReadoutEnd).toEqual(
        DEFAULT_HOME_CONTENT.hero.globeReadoutEnd
      )
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
      expect(content.sections.projects).toEqual(DEFAULT_HOME_CONTENT.sections.projects)
    })
  })

  it("ignores keys it does not know", () => {
    const content = normalizeHomeContent({ hero: { nonsense: true }, extra: 1 })

    expect(content).toEqual(DEFAULT_HOME_CONTENT)
  })

  it("refuses a hero that is not an object", () => {
    expect(() => normalizeHomeContent({ hero: [] })).toThrow(/must be an object/)
  })
})
