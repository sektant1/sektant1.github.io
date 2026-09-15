import { describe, expect, it } from "vitest"

import { bootIsDue } from "./cold-boot-state"

describe("bootIsDue", () => {
  it("runs when no viewing is saved or site data was cleared", () => {
    expect(bootIsDue(0)).toBe(true)
  })

  it.each([1, 1_000_000_000_000, 9_000_000_000_000])(
    "never expires a saved viewing: %s",
    (stamp) => {
      expect(bootIsDue(stamp)).toBe(false)
    }
  )

  it("skips when storage is blocked", () => {
    expect(bootIsDue(-1)).toBe(false)
  })

  it.each([NaN, Infinity, -2])("runs for an invalid stamp: %s", (stamp) => {
    expect(bootIsDue(stamp)).toBe(true)
  })
})
