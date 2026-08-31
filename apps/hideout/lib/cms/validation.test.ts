import { describe, expect, it } from "vitest"

import {
  normalizeGamePayload,
  normalizePostPayload,
  normalizeProjectPayload,
  serializeGame,
  serializePost,
  serializeProject,
} from "@/lib/cms/validation"

/**
 * What the CMS accepts, pinned before the shared parts were pulled out.
 *
 * These are characterisation tests: they describe the behaviour as it was
 * found, including the places the three collections had quietly drifted apart,
 * so the extraction underneath them can be checked for changing nothing. Where
 * a case looks wrong rather than deliberate it says so in a comment — a test
 * that pins a bug should admit it is pinning a bug.
 */

const post = { title: "A Post", description: "About something" }
const project = { title: "A Project", description: "Something built" }
const game = { title: "A Game", description: "Something played" }

describe("what every collection agrees on", () => {
  it("derives the slug from the title when none is given", () => {
    expect(normalizePostPayload(post).slug).toBe("a-post")
    expect(normalizeProjectPayload(project).slug).toBe("a-project")
    expect(normalizeGamePayload(game).slug).toBe("a-game")
  })

  it("prefers an explicit slug over the title", () => {
    expect(normalizePostPayload({ ...post, slug: "chosen" }).slug).toBe(
      "chosen"
    )
  })

  it("defaults the date to today", () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(normalizePostPayload(post).date).toBe(today)
    expect(normalizeProjectPayload(project).date).toBe(today)
    expect(normalizeGamePayload(game).date).toBe(today)
  })

  it("refuses a date that is not YYYY-MM-DD", () => {
    const bad = { date: "31/08/2026" }
    expect(() => normalizePostPayload({ ...post, ...bad })).toThrow()
    expect(() => normalizeProjectPayload({ ...project, ...bad })).toThrow()
    expect(() => normalizeGamePayload({ ...game, ...bad })).toThrow()
  })

  /* The slug is slugified before it is checked, so anything a directory name
     cannot carry is stripped rather than rejected. assertSlug is the guard for
     what survives that — an input of only punctuation slugifies to nothing. */
  it("normalises a slug rather than rejecting it", () => {
    expect(normalizePostPayload({ ...post, slug: "Not A Slug!" }).slug).toBe(
      "not-a-slug"
    )
    expect(normalizePostPayload({ ...post, slug: "Ação Über" }).slug).toBe(
      "acao-uber"
    )
  })

  it("refuses a title that slugifies to nothing", () => {
    expect(() => normalizePostPayload({ ...post, title: "!!!" })).toThrow()
  })

  it("accepts tags as a list or as a comma-separated string", () => {
    expect(normalizePostPayload({ ...post, tags: ["a", " b "] }).tags).toEqual([
      "a",
      "b",
    ])
    expect(normalizePostPayload({ ...post, tags: "a, b" }).tags).toEqual([
      "a",
      "b",
    ])
  })

  it("treats a missing input as an empty object rather than throwing on it", () => {
    expect(() => normalizePostPayload(undefined)).toThrow("Title is required.")
  })
})

describe("where the three had drifted apart", () => {
  /* Posts and projects refuse an empty description; games accept one. Nothing
     suggests that was decided — it is what happens when the same routine is
     written three times. */
  it("requires a description on posts and projects but not on games", () => {
    expect(() => normalizePostPayload({ title: "T" })).toThrow(
      "Description is required."
    )
    expect(() => normalizeProjectPayload({ title: "T" })).toThrow(
      "Description is required."
    )
    expect(normalizeGamePayload({ title: "T" }).description).toBe("")
  })

  /* The same failure, worded two ways, depending on which form the operator
     happened to be filling in. */
  it("words the missing-title error differently for games", () => {
    expect(() => normalizePostPayload({})).toThrow("Title is required.")
    expect(() => normalizeProjectPayload({})).toThrow("Title is required.")
    expect(() => normalizeGamePayload({})).toThrow("A title is required.")
  })

  /* Posts and projects trim the body; games keep the surrounding whitespace. */
  it("trims the body on posts and projects but not on games", () => {
    expect(normalizePostPayload({ ...post, body: "  hi  " }).body).toBe("hi")
    expect(normalizeProjectPayload({ ...project, body: "  hi  " }).body).toBe(
      "hi"
    )
    expect(normalizeGamePayload({ ...game, body: "  hi  " }).body).toBe(
      "  hi  "
    )
  })

  it("names the draft flag `status` on posts and `visibility` elsewhere", () => {
    expect(normalizePostPayload({ ...post, status: "published" }).status).toBe(
      "published"
    )
    expect(normalizePostPayload(post).status).toBe("draft")
    expect(normalizeProjectPayload(project).visibility).toBe("published")
    expect(normalizeGamePayload(game).visibility).toBe("published")
  })
})

describe("collection-specific rules", () => {
  it("refuses a project URL that is not http(s)", () => {
    expect(() =>
      normalizeProjectPayload({ ...project, href: "javascript:alert(1)" })
    ).toThrow("Website URL must be a valid http(s) URL.")
  })

  it("refuses a project that opens a website it does not have", () => {
    expect(() =>
      normalizeProjectPayload({ ...project, open: "website" })
    ).toThrow("Website projects need an href.")
  })

  it("refuses a game link that is not http(s)", () => {
    expect(() =>
      normalizeGamePayload({ ...game, playHref: "ftp://example.com" })
    ).toThrow("Play link must be a valid http(s) URL.")
  })

  it("keeps a post's series with its order", () => {
    const payload = normalizePostPayload({
      ...post,
      series: { id: "s", title: "S", order: 2 },
    })
    expect(payload.series).toEqual({ id: "s", title: "S", order: 2 })
  })
})

describe("serialising to front matter", () => {
  it("opens and closes the block and leaves the body under it", () => {
    const out = serializePost(normalizePostPayload({ ...post, body: "Text." }))
    expect(out.startsWith("---\n")).toBe(true)
    expect(out).toContain('title: "A Post"')
    expect(out).toContain('slug: "a-post"')
    expect(out.trimEnd().endsWith("Text.")).toBe(true)
  })

  it("writes a placeholder body rather than an empty document", () => {
    expect(serializePost(normalizePostPayload(post))).toContain(
      "Write the post body here."
    )
    expect(serializeProject(normalizeProjectPayload(project))).toContain(
      "Write the project body here."
    )
  })

  it("omits an absent thumbnail instead of writing an empty key", () => {
    expect(serializePost(normalizePostPayload(post))).not.toContain(
      "thumbnail:"
    )
  })

  it("writes a project's stack as its own list", () => {
    const out = serializeProject(
      normalizeProjectPayload({ ...project, stack: ["ts", "vite"] })
    )
    expect(out).toContain('stack:\n  - "ts"\n  - "vite"')
  })

  it("round-trips a game through normalise and serialise", () => {
    const out = serializeGame(
      normalizeGamePayload({ ...game, engine: "godot" })
    )
    expect(out).toContain('title: "A Game"')
    expect(out).toContain('engine: "godot"')
  })
})
