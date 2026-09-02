/**
 * Flea market prices for the items the bitcoin farm runs on.
 *
 * The instrument draws a physical bitcoin, which is a Tarkov item before it is
 * a model, so the panel under it runs the farm that produces one: the coin,
 * the graphics cards that mine it and the fuel the generator burns.
 *
 * Two sources, in order. tarkov.dev is first because it needs no key, so a
 * clone of this repo has prices without being configured. tarkov-market is the
 * fallback and needs one — it is what answers when tarkov.dev is down, which
 * it was for the whole afternoon this was written. Neither answering is not a
 * failure of the panel: the calculator takes prices typed by hand.
 *
 * Read on the server and cached for the revalidate window: prices move in
 * hours, and a public API hit once per reader is a public API that stops
 * answering.
 */

const TARKOV_DEV = "https://api.tarkov.dev/graphql"
const TARKOV_MARKET = "https://api.tarkov-market.app/api/v1/item"

/** Fifteen minutes. The figures are day averages; nothing here is a tick. */
const REVALIDATE_SECONDS = 900

/**
 * The three items the farm needs, and what each source calls them. tarkov.dev
 * matches the full name; tarkov-market searches, so it gets the term that
 * finds the item rather than the item's own name.
 */
const TRACKED = [
  { key: "bitcoin", name: "Physical bitcoin", query: "Physical bitcoin" },
  { key: "gpu", name: "Graphics card", query: "GPU" },
  { key: "fuel", name: "Metal fuel tank", query: "Metal fuel tank" },
] as const

export type TrackedKey = (typeof TRACKED)[number]["key"]

export type FleaItem = {
  id: string
  /** Which tracked item this row is. */
  key: TrackedKey
  /** The short code the game itself prints, e.g. `BTC`. */
  short: string
  name: string
  /** Roubles: the 24h average where there is one, the last listing otherwise. */
  price: number
  /** Percent move the source reported, or null. */
  change: number | null
  /** Grid slots the item occupies, and what it is worth per slot. */
  slots: number | null
  perSlot: number | null
  /** The best trader offer, for the reader who does not want to list it. */
  trader: { name: string; price: number } | null
  /** When the source last reported this row, ISO. */
  updated: string | null
  /** The item's own icon, as the source hosts it. */
  icon: string | null
}

export type FleaReport = {
  items: FleaItem[]
  /** Which market answered, so the panel can name its own source. */
  source: "tarkov.dev" | "tarkov-market"
  /** When the market last reported, ISO, or null if no row carried one. */
  updated: string | null
}

/**
 * What the panel is shown.
 *
 * The failure carries whether a fallback key is configured, because that is
 * the difference between "both markets are down" and "one is down and this
 * site could be using the other".
 */
export type FleaState = FleaReport | { error: "unreachable"; keyed: boolean }

export async function getFleaPrices(): Promise<FleaState> {
  const key = process.env.TARKOV_MARKET_API_KEY

  const primary = await fromTarkovDev()
  if (primary) return report(primary, "tarkov.dev")

  if (key) {
    const fallback = await fromTarkovMarket(key)
    if (fallback) return report(fallback, "tarkov-market")
  }

  return { error: "unreachable", keyed: Boolean(key) }
}

function report(items: FleaItem[], source: FleaReport["source"]): FleaReport {
  const updated = items
    .map((item) => item.updated)
    .filter((stamp): stamp is string => Boolean(stamp))
    .sort()
    .at(-1)

  return { items, source, updated: updated ?? null }
}

/* tarkov.dev — GraphQL, no key. */

type DevItem = {
  id?: string
  name?: string
  shortName?: string
  avg24hPrice?: number | null
  lastLowPrice?: number | null
  changeLast48hPercent?: number | null
  updated?: string | null
  iconLink?: string | null
  gridImageLink?: string | null
  width?: number | null
  height?: number | null
  sellFor?: {
    priceRUB?: number | null
    vendor?: { name?: string | null; normalizedName?: string | null } | null
  }[]
}

const DEV_QUERY = `query Farm($names: [String]!) {
  items(names: $names) {
    id
    name
    shortName
    avg24hPrice
    lastLowPrice
    changeLast48hPercent
    updated
    iconLink
    gridImageLink
    width
    height
    sellFor {
      priceRUB
      vendor { name normalizedName }
    }
  }
}`

async function fromTarkovDev(): Promise<FleaItem[] | null> {
  try {
    const response = await fetch(TARKOV_DEV, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: DEV_QUERY,
        variables: { names: TRACKED.map((tracked) => tracked.name) },
      }),
      next: { revalidate: REVALIDATE_SECONDS },
    })

    if (!response.ok) return null

    const payload = (await response.json()) as {
      data?: { items?: DevItem[] }
      errors?: unknown[]
    }

    if (payload.errors?.length || !payload.data?.items) return null

    const rows = payload.data.items
    const items = TRACKED.map((tracked) => {
      const match = rows.find(
        (row) => row.name?.toLowerCase() === tracked.name.toLowerCase()
      )
      const price = match?.avg24hPrice || match?.lastLowPrice
      if (!match?.name || !price) return null

      const slots =
        match.width && match.height ? match.width * match.height : null

      // The flea is not the only buyer: the best vendor offer is what a reader
      // who does not want to list it would actually get.
      const trader = (match.sellFor ?? [])
        .filter(
          (offer) =>
            offer.priceRUB &&
            offer.vendor?.name &&
            offer.vendor.normalizedName !== "flea-market"
        )
        .sort((a, b) => (b.priceRUB ?? 0) - (a.priceRUB ?? 0))
        .at(0)

      return {
        id: match.id ?? tracked.key,
        key: tracked.key,
        short: match.shortName || match.name,
        name: match.name,
        price,
        change: match.changeLast48hPercent ?? null,
        slots,
        perSlot: slots ? Math.round(price / slots) : null,
        trader:
          trader?.vendor?.name && trader.priceRUB
            ? { name: trader.vendor.name, price: trader.priceRUB }
            : null,
        updated: match.updated ?? null,
        icon: match.iconLink ?? match.gridImageLink ?? null,
      } satisfies FleaItem
    }).filter((item): item is FleaItem => item !== null)

    return items.length ? items : null
  } catch {
    return null
  }
}

/* tarkov-market — REST, needs a key. */

type MarketItem = {
  uid?: string
  bsgId?: string
  name?: string
  shortName?: string
  price?: number
  avg24hPrice?: number
  diff24h?: number
  slots?: number
  traderName?: string
  traderPriceRub?: number
  updated?: string
  icon?: string
  img?: string
}

async function fromTarkovMarket(key: string): Promise<FleaItem[] | null> {
  const rows = await Promise.all(
    TRACKED.map((tracked) => marketLookup(tracked, key))
  )
  const items = rows.filter((item): item is FleaItem => item !== null)
  return items.length ? items : null
}

async function marketLookup(
  tracked: (typeof TRACKED)[number],
  key: string
): Promise<FleaItem | null> {
  try {
    const response = await fetch(
      `${TARKOV_MARKET}?q=${encodeURIComponent(tracked.query)}&lang=en`,
      {
        headers: { "x-api-key": key },
        next: { revalidate: REVALIDATE_SECONDS },
      }
    )

    if (!response.ok) return null

    const payload = (await response.json()) as MarketItem[] | MarketItem
    const matches = Array.isArray(payload) ? payload : [payload]

    // The search is fuzzy — "GPU" also returns the card's parts — so the exact
    // name wins and a near match is only a fallback.
    const match =
      matches.find(
        (item) => item.name?.toLowerCase() === tracked.name.toLowerCase()
      ) ??
      matches.find(
        (item) => item.shortName?.toLowerCase() === tracked.query.toLowerCase()
      ) ??
      matches[0]

    const price = match?.avg24hPrice || match?.price
    if (!match?.name || !price) return null

    const slots = match.slots && match.slots > 0 ? match.slots : null

    return {
      id: match.uid ?? match.bsgId ?? tracked.key,
      key: tracked.key,
      short: match.shortName || match.name,
      name: match.name,
      price,
      change: match.diff24h ?? null,
      slots,
      perSlot: slots ? Math.round(price / slots) : null,
      trader:
        match.traderName && match.traderPriceRub
          ? { name: match.traderName, price: match.traderPriceRub }
          : null,
      updated: match.updated ?? null,
      icon: match.icon ?? match.img ?? null,
    }
  } catch {
    return null
  }
}

/** Roubles the way the game prints them: grouped, with the sign after. */
export function formatRoubles(value: number) {
  return `${value.toLocaleString("en-US").replace(/,/g, " ")} ₽`
}
