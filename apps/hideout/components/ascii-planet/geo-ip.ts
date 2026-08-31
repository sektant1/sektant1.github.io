import type { EarthLocation } from "./markers"

/**
 * Where the reader is, as far as their IP admits.
 *
 * Two sources, tried in order. The first is the one every content blocker
 * ships: for a reader running uBlock or Brave's shields the request never
 * leaves the machine, and a panel whose whole job is to print a bearing had
 * nothing to print. The second is a different domain answering the same
 * question, which is usually enough to get through.
 *
 * Both are best-effort. Blocked, refused, slow or nonsense resolves to null
 * and the panel says it has no fix — never a guess dressed as a reading.
 *
 * Split out of markers.ts, which drew the globe: this asks the network a
 * question and imports no three at all, so it can be read, changed and tested
 * without a WebGL context anywhere near it.
 */
const IP_SOURCES = [
  {
    url: "https://ipapi.co/json/",
    place: (data: Record<string, unknown>) =>
      asPlace(data.city, data.country_name),
  },
  {
    url: "https://ipwho.is/",
    place: (data: Record<string, unknown>) => asPlace(data.city, data.country),
  },
] as const

/** How long one source gets before the next is tried. */
const IP_LOOKUP_TIMEOUT = 6000

function asPlace(city: unknown, country: unknown) {
  if (typeof city === "string" && city) return city.toUpperCase()
  if (typeof country === "string" && country) return country.toUpperCase()
  return "APPROX"
}

export async function resolveUserIpLocation(
  signal?: AbortSignal
): Promise<EarthLocation | null> {
  for (const source of IP_SOURCES) {
    if (signal?.aborted) return null

    // A blocker usually refuses the request outright, but a DNS sink can leave
    // it hanging instead, and the panel would sit there scanning forever.
    const timeout = AbortSignal.timeout(IP_LOOKUP_TIMEOUT)
    const attempt = signal ? AbortSignal.any([signal, timeout]) : timeout

    try {
      const response = await fetch(source.url, {
        signal: attempt,
        headers: { Accept: "application/json" },
      })
      if (!response.ok) continue

      const data = (await response.json()) as Record<string, unknown>
      const lat = Number(data.latitude)
      const lon = Number(data.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue

      return {
        id: "user-ip",
        name: "LOCALHOST",
        country: source.place(data),
        lat,
        lon,
        variant: "user",
        showLabel: true,
      }
    } catch {
      // Blocked, offline, or out of time. Try the next one.
    }
  }

  return null
}
