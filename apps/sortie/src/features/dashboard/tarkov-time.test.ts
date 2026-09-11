import { describe, expect, it } from "vitest"

import { tarkovTime } from "./tarkov-time"

describe("tarkovTime", () => {
  it("runs seven times real time from the epoch", () => {
    expect(tarkovTime(new Date("1970-01-01T00:00:00Z")).left).toBe("03:00:00")
  })

  it("keeps the two servers twelve hours apart", () => {
    const { left, right } = tarkovTime(new Date("1970-01-01T00:00:00Z"))

    expect(left).toBe("03:00:00")
    expect(right).toBe("15:00:00")
  })

  it("advances seven seconds of game time per real second", () => {
    expect(tarkovTime(new Date("1970-01-01T00:00:01Z")).left).toBe("03:00:07")
  })

  it("wraps past midnight", () => {
    expect(tarkovTime(new Date("1970-01-01T03:00:00Z")).left).toBe("00:00:00")
  })
})
