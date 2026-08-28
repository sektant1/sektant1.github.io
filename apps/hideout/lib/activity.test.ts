import { describe, expect, it } from "vitest"

import { buildActivity, describeActivity, monthLabel } from "./activity"

const NOW = new Date("2026-08-15T00:00:00Z")

describe("buildActivity", () => {
  it("returns one bucket per month, oldest first, ending on this month", () => {
    const series = buildActivity([], 12, NOW)

    expect(series).toHaveLength(12)
    expect(series[0].month).toBe("2025-09-01")
    expect(series.at(-1)?.month).toBe("2026-08-01")
  })

  it("counts every entry dated into a month, whatever it was", () => {
    const series = buildActivity(
      ["2026-06-29", "2026-06-01", "2026-08-14"],
      12,
      NOW
    )

    expect(series.find((b) => b.month === "2026-06-01")?.count).toBe(2)
    expect(series.find((b) => b.month === "2026-08-01")?.count).toBe(1)
    expect(series.find((b) => b.month === "2026-07-01")?.count).toBe(0)
  })

  it("drops dates outside the window and dates it cannot read", () => {
    const series = buildActivity(["2019-01-01", "not a date"], 12, NOW)

    expect(series.every((bucket) => bucket.count === 0)).toBe(true)
  })

  it("does not shift a month when the window crosses a year", () => {
    const series = buildActivity(["2026-01-31"], 12, NOW)

    expect(series.find((b) => b.month === "2026-01-01")?.count).toBe(1)
  })
})

describe("labels", () => {
  it("ticks a month in the console's case", () => {
    expect(monthLabel("2026-08-01")).toBe("AUG 26")
  })

  it("says the range and the busiest month", () => {
    const series = buildActivity(["2026-06-29", "2026-06-01"], 12, NOW)

    expect(describeActivity(series)).toBe(
      "2 entries over 12 months, busiest JUN 26 with 2."
    )
  })

  it("says so when nothing landed", () => {
    expect(describeActivity(buildActivity([], 12, NOW))).toBe(
      "No archive activity in the last year."
    )
  })
})
