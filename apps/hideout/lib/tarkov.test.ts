import { afterEach, describe, expect, it, vi } from "vitest"

import { formatRoubles, getFleaPrices, type FleaReport } from "./tarkov"

/**
 * Two markets that are regularly down — both were, on the afternoon this was
 * written — so the parse, the order they are tried in and every failure they
 * can hand back are covered here rather than by looking at the panel.
 */

const DEV_ROWS = [
  {
    id: "btc",
    name: "Physical bitcoin",
    shortName: "BTC",
    avg24hPrice: 640_500,
    changeLast48hPercent: 2.13,
    updated: "2026-09-02T18:00:00.000Z",
    width: 1,
    height: 1,
    sellFor: [
      { priceRUB: 300_000, vendor: { name: "Therapist" } },
      {
        priceRUB: 700_000,
        vendor: { name: "Flea Market", normalizedName: "flea-market" },
      },
    ],
  },
  {
    id: "gpu",
    name: "Graphics card",
    shortName: "GPU",
    lastLowPrice: 490_000,
    updated: "2026-09-02T19:00:00.000Z",
    width: 1,
    height: 2,
  },
  {
    id: "fuel",
    name: "Metal fuel tank",
    shortName: "MFuel",
    avg24hPrice: 24_000,
    width: 2,
    height: 3,
  },
]

const MARKET_ROWS: Record<string, unknown[]> = {
  "Physical bitcoin": [
    {
      uid: "btc",
      name: "Physical bitcoin",
      shortName: "BTC",
      avg24hPrice: 610_000,
      diff24h: -1.2,
      slots: 1,
      traderName: "Therapist",
      traderPriceRub: 300_000,
      updated: "2026-09-02T17:00:00.000Z",
    },
  ],
  GPU: [
    {
      uid: "part",
      name: "Damaged hard drive",
      shortName: "DHD",
      price: 40_000,
    },
    {
      uid: "gpu",
      name: "Graphics card",
      shortName: "GPU",
      price: 470_000,
      slots: 2,
    },
  ],
  "Metal fuel tank": [
    {
      uid: "fuel",
      name: "Metal fuel tank",
      shortName: "MFuel",
      price: 25_000,
      slots: 6,
    },
  ],
}

/**
 * A fetch that answers as the two markets do: GraphQL for tarkov.dev, one
 * search per item for tarkov-market. Either can be told to fall over.
 */
function markets({ dev, market }: { dev?: boolean; market?: boolean } = {}) {
  return vi.fn(async (url: string) => {
    if (url.startsWith("https://api.tarkov.dev")) {
      if (dev === false) {
        return {
          ok: true,
          json: async () => ({ errors: ["GraphQL server unavailable."] }),
        } as unknown as Response
      }

      return {
        ok: true,
        json: async () => ({ data: { items: DEV_ROWS } }),
      } as unknown as Response
    }

    if (market === false) {
      return { ok: false, json: async () => ({}) } as unknown as Response
    }

    const query = decodeURIComponent(new URL(url).searchParams.get("q") ?? "")
    return {
      ok: true,
      json: async () => MARKET_ROWS[query] ?? [],
    } as unknown as Response
  })
}

async function report(): Promise<FleaReport> {
  const state = await getFleaPrices()
  if ("error" in state) throw new Error(`market failed: ${state.error}`)
  return state
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("getFleaPrices", () => {
  it("reads tarkov.dev first, with no key configured", async () => {
    vi.stubEnv("TARKOV_MARKET_API_KEY", "")
    vi.stubGlobal("fetch", markets())

    const flea = await report()

    expect(flea.source).toBe("tarkov.dev")
    expect(flea.items.map((item) => item.key)).toEqual([
      "bitcoin",
      "gpu",
      "fuel",
    ])
    expect(flea.updated).toBe("2026-09-02T19:00:00.000Z")
  })

  it("falls back to the last listing when there is no 24h average", async () => {
    vi.stubGlobal("fetch", markets())

    const gpu = (await report()).items.find((item) => item.key === "gpu")

    expect(gpu?.price).toBe(490_000)
    // A 1x2 card: the per-slot figure is what the stash actually costs.
    expect(gpu?.slots).toBe(2)
    expect(gpu?.perSlot).toBe(245_000)
  })

  it("takes the best vendor offer and never the flea itself", async () => {
    vi.stubGlobal("fetch", markets())

    const btc = (await report()).items[0]

    expect(btc?.trader).toEqual({ name: "Therapist", price: 300_000 })
  })

  it("falls back to tarkov-market when tarkov.dev is down and a key is set", async () => {
    vi.stubEnv("TARKOV_MARKET_API_KEY", "test-key")
    vi.stubGlobal("fetch", markets({ dev: false }))

    const flea = await report()

    expect(flea.source).toBe("tarkov-market")
    expect(flea.items[0]?.price).toBe(610_000)
  })

  it("prefers the exact name over the rest of a fuzzy search", async () => {
    vi.stubEnv("TARKOV_MARKET_API_KEY", "test-key")
    vi.stubGlobal("fetch", markets({ dev: false }))

    const gpu = (await report()).items.find((item) => item.key === "gpu")

    expect(gpu?.name).toBe("Graphics card")
  })

  it("reports both markets down, and whether a key was even configured", async () => {
    vi.stubEnv("TARKOV_MARKET_API_KEY", "")
    vi.stubGlobal("fetch", markets({ dev: false }))

    expect(await getFleaPrices()).toEqual({
      error: "unreachable",
      keyed: false,
    })

    vi.stubEnv("TARKOV_MARKET_API_KEY", "test-key")
    vi.stubGlobal("fetch", markets({ dev: false, market: false }))

    expect(await getFleaPrices()).toEqual({ error: "unreachable", keyed: true })
  })

  it("survives a request that fails outright", async () => {
    vi.stubEnv("TARKOV_MARKET_API_KEY", "")
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))

    expect(await getFleaPrices()).toEqual({
      error: "unreachable",
      keyed: false,
    })
  })
})

describe("formatRoubles", () => {
  it("groups with spaces and puts the sign after the figure", () => {
    expect(formatRoubles(640_500)).toBe("640 500 ₽")
  })
})
