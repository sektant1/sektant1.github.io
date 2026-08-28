import { describe, expect, it } from "vitest"

import {
  STATION,
  bearingDeg,
  formatBearing,
  formatCoordinate,
  formatRange,
  rangeKm,
} from "./geo-range"

const KYIV = { lat: 50.4501, lon: 30.5234 }
const LISBON = { lat: 38.7223, lon: -9.1393 }

describe("rangeKm", () => {
  it("is zero at the station itself", () => {
    expect(rangeKm(STATION, STATION)).toBe(0)
  })

  it("matches the known Prypiat–Kyiv distance", () => {
    // ~110 km on any chart; a degree of latitude is ~111 km and these are
    // about one apart.
    expect(rangeKm(STATION, KYIV)).toBeGreaterThan(100)
    expect(rangeKm(STATION, KYIV)).toBeLessThan(120)
  })

  it("is symmetric", () => {
    expect(rangeKm(STATION, LISBON)).toBeCloseTo(rangeKm(LISBON, STATION), 6)
  })
})

describe("bearingDeg", () => {
  it("reads due north for a point directly above", () => {
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 10, lon: 0 })).toBeCloseTo(0)
  })

  it("reads due east for a point on the equator to the right", () => {
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: 10 })).toBeCloseTo(90)
  })

  it("stays inside 0–360", () => {
    const bearing = bearingDeg(STATION, LISBON)
    expect(bearing).toBeGreaterThanOrEqual(0)
    expect(bearing).toBeLessThan(360)
  })
})

describe("formatting", () => {
  it("pads a bearing to a fixed width", () => {
    expect(formatBearing(7.25)).toBe("007.3")
    expect(formatBearing(214.62)).toBe("214.6")
  })

  it("gaps a range at the thousand", () => {
    expect(formatRange(842.4)).toBe("842")
    expect(formatRange(1842)).toBe("1 842")
    expect(formatRange(12005)).toBe("12 005")
  })

  it("writes coordinates with a hemisphere letter", () => {
    expect(formatCoordinate(STATION)).toBe("51.41N 30.05E")
    expect(formatCoordinate(LISBON)).toBe("38.72N 9.14W")
  })
})
