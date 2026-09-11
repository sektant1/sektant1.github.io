import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { progressStore } from "./progress"
import { emptyProgress, STORAGE_KEY } from "./storage"

const store = new Map<string, string>()

beforeEach(() => {
  store.clear()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  } as Storage)
  progressStore.replace(emptyProgress())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("progressStore", () => {
  it("hands out the current progress", () => {
    expect(progressStore.getSnapshot().level).toBe(1)
  })

  it("applies an update and keeps the rest", () => {
    progressStore.update((progress) => ({ ...progress, level: 20 }))

    expect(progressStore.getSnapshot().level).toBe(20)
    expect(progressStore.getSnapshot().faction).toBe("USEC")
  })

  it("notifies subscribers on update", () => {
    const listener = vi.fn()
    const unsubscribe = progressStore.subscribe(listener)

    progressStore.update((progress) => ({ ...progress, level: 3 }))

    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn()
    progressStore.subscribe(listener)()

    progressStore.update((progress) => ({ ...progress, level: 4 }))

    expect(listener).not.toHaveBeenCalled()
  })

  it("returns a stable snapshot reference between updates", () => {
    const first = progressStore.getSnapshot()

    expect(progressStore.getSnapshot()).toBe(first)
  })

  it("persists what it updates", () => {
    progressStore.update((progress) => ({ ...progress, level: 15 }))

    expect(JSON.parse(store.get(STORAGE_KEY)!).level).toBe(15)
  })
})
