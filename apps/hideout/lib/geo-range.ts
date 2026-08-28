/**
 * The numbers the geo panel reads out, as pure functions.
 *
 * The panel claims to be tracking the reader from the station. These are the
 * values that claim rests on — a range and a bearing between two real
 * coordinates — so they are computed here and tested without a GPU.
 */

export interface Coordinate {
  lat: number
  lon: number
}

/** Where the hideout transmits from: Prypiat, matching the map marker. */
export const STATION: Coordinate = { lat: 51.406681, lon: 30.046425 }

const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const toDegrees = (radians: number) => (radians * 180) / Math.PI

/** Great-circle distance in kilometres. */
export function rangeKm(from: Coordinate, to: Coordinate): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLon = toRadians(to.lon - from.lon)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Initial bearing in degrees clockwise from true north, 0–360. */
export function bearingDeg(from: Coordinate, to: Coordinate): number {
  const dLon = toRadians(to.lon - from.lon)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)
  const y = Math.sin(dLon) * Math.cos(toLat)
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLon)
  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

/** `214.6` — one decimal, zero-padded to a fixed width so the row cannot jitter. */
export function formatBearing(degrees: number): string {
  return degrees.toFixed(1).padStart(5, "0")
}

/** `1 842` — a thin gap at the thousand, which a character grid can hold. */
export function formatRange(km: number): string {
  const rounded = Math.round(km)
  if (rounded < 1000) return String(rounded)
  return `${Math.floor(rounded / 1000)} ${String(rounded % 1000).padStart(3, "0")}`
}

/** `51.41N 30.05E` — the form a chart margin uses. */
export function formatCoordinate({ lat, lon }: Coordinate): string {
  const ns = `${Math.abs(lat).toFixed(2)}${lat < 0 ? "S" : "N"}`
  const ew = `${Math.abs(lon).toFixed(2)}${lon < 0 ? "W" : "E"}`
  return `${ns} ${ew}`
}
