import { afterEach, describe, expect, it, vi } from "vitest"

import { readLocal, writeLocal } from "./use-local-state"

function stubStorage(impl: Partial<Storage>) {
  vi.stubGlobal("localStorage", impl as Storage)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("readLocal", () => {
  it("returns the fallback when nothing is stored", () => {
    stubStorage({ getItem: () => null })
    expect(readLocal("tasks", ["seed"])).toEqual(["seed"])
  })

  it("parses a stored value", () => {
    stubStorage({ getItem: () => JSON.stringify({ done: true }) })
    expect(readLocal("task", { done: false })).toEqual({ done: true })
  })

  it("namespaces the key so it cannot collide with another app's storage", () => {
    const getItem = vi.fn(() => null)
    stubStorage({ getItem })
    readLocal("tasks", null)
    expect(getItem).toHaveBeenCalledWith("skt:tasks")
  })

  it("falls back when the stored JSON is corrupt", () => {
    stubStorage({ getItem: () => "{not json" })
    expect(readLocal("tasks", "safe")).toBe("safe")
  })

  it("falls back when storage access throws, as in private mode", () => {
    stubStorage({
      getItem: () => {
        throw new Error("access denied")
      },
    })
    expect(readLocal("tasks", "safe")).toBe("safe")
  })
})

describe("writeLocal", () => {
  it("serialises under the namespaced key", () => {
    const setItem = vi.fn()
    stubStorage({ setItem })
    writeLocal("notes", { body: "hi" })
    expect(setItem).toHaveBeenCalledWith("skt:notes", '{"body":"hi"}')
  })

  it("does not throw when storage refuses the write", () => {
    stubStorage({
      setItem: () => {
        throw new Error("quota exceeded")
      },
    })
    expect(() => writeLocal("notes", "x")).not.toThrow()
  })
})
