import { afterEach, describe, expect, it, vi } from "vitest"
import { createPersistedPreference, oneOf } from "./persisted-preference"

function withStorage(impl: Partial<Storage>) {
  vi.stubGlobal("localStorage", impl as Storage)
  vi.stubGlobal("window", {
    localStorage: impl as Storage,
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("read", () => {
  it("returns the fallback when nothing is stored", () => {
    withStorage(memoryStorage())
    const face = createPersistedPreference({ key: "face", fallback: "Play" })
    expect(face.read()).toBe("Play")
  })

  it("returns the stored value when there is one", () => {
    withStorage(memoryStorage({ face: "Jura" }))
    const face = createPersistedPreference({ key: "face", fallback: "Play" })
    expect(face.read()).toBe("Jura")
  })

  it("falls back when the stored value fails parsing", () => {
    withStorage(memoryStorage({ face: "Comic Sans" }))
    const face = createPersistedPreference({
      key: "face",
      fallback: "Play",
      parse: oneOf(["Play", "Jura"]),
    })
    expect(face.read()).toBe("Play")
  })

  it("falls back when storage throws, as in a private window", () => {
    withStorage({
      getItem: () => {
        throw new Error("blocked")
      },
    })
    const face = createPersistedPreference({ key: "face", fallback: "Play" })
    expect(face.read()).toBe("Play")
  })

  it("separates unavailable storage from empty storage", () => {
    const options = {
      key: "seen",
      fallback: false,
      whenUnavailable: true,
      parse: (raw: string) => raw === "1",
    }

    withStorage(memoryStorage())
    expect(createPersistedPreference(options).read()).toBe(false)

    withStorage({
      getItem: () => {
        throw new Error("blocked")
      },
    })
    expect(createPersistedPreference(options).read()).toBe(true)
  })
})

describe("write", () => {
  it("stores the value and notifies this tab's listeners", () => {
    withStorage(memoryStorage())
    const face = createPersistedPreference({ key: "face", fallback: "Play" })
    const listener = vi.fn()
    face.subscribe(listener)

    face.write("Jura")

    expect(face.read()).toBe("Jura")
    expect(listener).toHaveBeenCalledOnce()
  })

  it("still notifies when storage refuses the write", () => {
    withStorage({
      getItem: () => null,
      setItem: () => {
        throw new Error("blocked")
      },
    })
    const face = createPersistedPreference({ key: "face", fallback: "Play" })
    const listener = vi.fn()
    face.subscribe(listener)

    face.write("Jura")

    expect(face.read()).toBe("Jura")
    expect(listener).toHaveBeenCalledOnce()
  })

  it("serialises non-string values on the way out and back", () => {
    withStorage(memoryStorage())
    const seen = createPersistedPreference({
      key: "seen",
      fallback: false,
      parse: (raw) => raw === "1",
      serialize: (value) => (value ? "1" : "0"),
    })

    seen.write(true)
    expect(seen.read()).toBe(true)
  })
})

describe("subscribe", () => {
  it("stops notifying once unsubscribed", () => {
    withStorage(memoryStorage())
    const face = createPersistedPreference({ key: "face", fallback: "Play" })
    const listener = vi.fn()

    face.subscribe(listener)()
    face.write("Jura")

    expect(listener).not.toHaveBeenCalled()
  })
})

describe("serverSnapshot", () => {
  it("is the fallback, since the server has no storage", () => {
    withStorage(memoryStorage({ face: "Jura" }))
    const face = createPersistedPreference({ key: "face", fallback: "Play" })
    expect(face.serverSnapshot()).toBe("Play")
  })
})
