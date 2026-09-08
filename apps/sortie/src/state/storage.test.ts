import { afterEach, describe, expect, it, vi } from "vitest"

import {
  emptyProgress,
  loadProgress,
  migrateProgress,
  saveProgress,
  STORAGE_KEY,
} from "./storage"

/** The repo tests storage by stubbing it rather than by booting a DOM. */
function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  }
}

function withStorage(impl: Partial<Storage>) {
  vi.stubGlobal("localStorage", impl as Storage)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("loadProgress", () => {
  it("returns an empty progress when nothing is stored", () => {
    withStorage(memoryStorage())

    expect(loadProgress()).toEqual(emptyProgress())
  })

  it("reads back what was saved", () => {
    withStorage(memoryStorage())
    saveProgress({ ...emptyProgress(), level: 32 })

    expect(loadProgress().level).toBe(32)
  })

  it("falls back to empty on unparseable JSON", () => {
    withStorage(memoryStorage({ [STORAGE_KEY]: "{{{" }))

    expect(loadProgress()).toEqual(emptyProgress())
  })

  it("survives a browser that throws on storage access", () => {
    withStorage({
      getItem() {
        throw new Error("access denied")
      },
      setItem() {
        throw new Error("access denied")
      },
    })

    expect(loadProgress()).toEqual(emptyProgress())
    expect(() => saveProgress(emptyProgress())).not.toThrow()
  })
})

describe("migrateProgress", () => {
  it("fills in fields a stored version predates", () => {
    const migrated = migrateProgress({ version: 1, level: 12 })

    expect(migrated.level).toBe(12)
    expect(migrated.faction).toBe("USEC")
    expect(migrated.taskCompletions).toEqual({})
  })

  it("discards a value of the wrong type", () => {
    expect(migrateProgress({ version: 1, level: "twelve" }).level).toBe(1)
  })

  it("discards a stored value that is not an object", () => {
    expect(migrateProgress("nope")).toEqual(emptyProgress())
  })

  it("keeps only entries of the right shape inside a map", () => {
    const migrated = migrateProgress({
      taskCompletions: { good: "complete", bad: "half-done", worse: 3 },
      objectiveCounts: { good: 4, bad: "many" },
    })

    expect(migrated.taskCompletions).toEqual({ good: "complete" })
    expect(migrated.objectiveCounts).toEqual({ good: 4 })
  })
})
