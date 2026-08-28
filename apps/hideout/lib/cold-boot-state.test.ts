import { describe, expect, it } from "vitest"

import { COLD_BOOT_TTL_MS, bootIsDue } from "./cold-boot-state"

const NOW = 1_800_000_000_000

describe("bootIsDue", () => {
  it("runs for a terminal that has never watched it", () => {
    expect(bootIsDue(0, NOW)).toBe(true)
  })

  it("holds while the last viewing is still fresh", () => {
    expect(bootIsDue(NOW - 60_000, NOW)).toBe(false)
    expect(bootIsDue(NOW - (COLD_BOOT_TTL_MS - 1), NOW)).toBe(false)
  })

  it("runs again once the hour is up", () => {
    expect(bootIsDue(NOW - COLD_BOOT_TTL_MS, NOW)).toBe(true)
    expect(bootIsDue(NOW - COLD_BOOT_TTL_MS * 24, NOW)).toBe(true)
  })

  it("holds for a stamp written later in this session", () => {
    // The reading is taken when the document opens; the stamp is written when
    // the curtain is dismissed, which is always after it. Treating that as a
    // moved clock replayed the sequence on every page the reader opened.
    expect(bootIsDue(NOW + 8_000, NOW)).toBe(false)
  })

  it("runs for a clock that genuinely moved", () => {
    expect(bootIsDue(NOW + COLD_BOOT_TTL_MS, NOW)).toBe(true)
  })

  it("holds when storage is blocked, so a private window is not a toll", () => {
    expect(bootIsDue(-1, NOW)).toBe(false)
  })

  it("runs for the old boolean stamp, which reads as 1970", () => {
    expect(bootIsDue(1, NOW)).toBe(true)
  })
})
