import { describe, expect, it } from "vitest"

import {
  MAX_BUFFERS,
  closeBuffer,
  minimapScrollTarget,
  minimapTicks,
  minimapWindow,
  nextAfterClose,
  openBuffer,
  type Buffer,
} from "./workbench"

function buffer(href: string): Buffer {
  return { href, label: href.split("/").pop() ?? href, kind: "post" }
}

describe("openBuffer", () => {
  it("appends a document that is not open", () => {
    expect(openBuffer([], buffer("/a")).map((b) => b.href)).toEqual(["/a"])
  })

  it("leaves a revisited buffer where it is", () => {
    const open = [buffer("/a"), buffer("/b")]
    expect(openBuffer(open, buffer("/a"))).toBe(open)
  })

  it("drops the oldest once the strip is full", () => {
    const full = Array.from({ length: MAX_BUFFERS }, (_, index) =>
      buffer(`/${index}`)
    )
    const next = openBuffer(full, buffer("/new"))

    expect(next).toHaveLength(MAX_BUFFERS)
    expect(next[0].href).toBe("/1")
    expect(next[next.length - 1].href).toBe("/new")
  })
})

describe("closeBuffer", () => {
  it("removes the named buffer and keeps the order", () => {
    const open = [buffer("/a"), buffer("/b"), buffer("/c")]
    expect(closeBuffer(open, "/b").map((b) => b.href)).toEqual(["/a", "/c"])
  })
})

describe("nextAfterClose", () => {
  it("moves to the neighbour on the right", () => {
    const open = [buffer("/a"), buffer("/b"), buffer("/c")]
    expect(nextAfterClose(open, "/b")).toBe("/c")
  })

  it("falls back to the left when nothing is to the right", () => {
    const open = [buffer("/a"), buffer("/b")]
    expect(nextAfterClose(open, "/b")).toBe("/a")
  })

  it("stays put when the last buffer closes", () => {
    expect(nextAfterClose([buffer("/a")], "/a")).toBeNull()
  })

  it("reports nothing for a buffer that is not open", () => {
    expect(nextAfterClose([buffer("/a")], "/z")).toBeNull()
  })
})

describe("minimapTicks", () => {
  it("scales blocks into the column", () => {
    const ticks = minimapTicks(
      [
        { top: 0, height: 500, heading: true },
        { top: 500, height: 500, heading: false },
      ],
      1000,
      100
    )

    expect(ticks).toEqual([
      { top: 0, height: 50, heading: true },
      { top: 50, height: 50, heading: false },
    ])
  })

  it("keeps a short block visible", () => {
    const [tick] = minimapTicks(
      [{ top: 0, height: 4, heading: false }],
      4000,
      100
    )
    expect(tick.height).toBeGreaterThanOrEqual(2)
  })

  it("reports nothing for a document with no height", () => {
    expect(
      minimapTicks([{ top: 0, height: 10, heading: false }], 0, 100)
    ).toEqual([])
  })
})

describe("minimapWindow", () => {
  it("frames the viewport in column space", () => {
    expect(minimapWindow(500, 500, 2000, 200)).toEqual({ top: 50, height: 50 })
  })

  it("never runs past the bottom of the column", () => {
    const frame = minimapWindow(10_000, 500, 2000, 200)
    expect(frame.top + frame.height).toBeLessThanOrEqual(200)
  })

  it("covers the whole column for a document shorter than the viewport", () => {
    expect(minimapWindow(0, 900, 600, 200)).toEqual({ top: 0, height: 200 })
  })
})

describe("minimapScrollTarget", () => {
  it("centres the click in the viewport", () => {
    // Halfway down a 200px column of a 2000px document is 1000px in; a 400px
    // viewport centred there starts at 800.
    expect(minimapScrollTarget(100, 400, 2000, 200)).toBe(800)
  })

  it("clamps to the ends of the document", () => {
    expect(minimapScrollTarget(0, 400, 2000, 200)).toBe(0)
    expect(minimapScrollTarget(200, 400, 2000, 200)).toBe(1600)
  })
})
