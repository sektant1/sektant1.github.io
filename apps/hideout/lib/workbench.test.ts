import { describe, expect, it } from "vitest"

import {
  MAX_BUFFERS,
  closeBuffer,
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
