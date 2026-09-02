import { describe, expect, it } from "vitest"

import { CYCLE_BASE_SECONDS, MAX_CARDS, clampCards, runFarm } from "./btc-farm"

const PRICES = {
  bitcoinPrice: 640_500,
  cardPrice: 490_000,
  tankPrice: 24_000,
}

describe("runFarm", () => {
  it("takes the base cycle at one card", () => {
    const farm = runFarm({ cards: 1, solar: false, ...PRICES })

    expect(farm.cycleHours).toBeCloseTo(CYCLE_BASE_SECONDS / 3600, 6)
    expect(farm.coinsPerDay).toBeCloseTo(0.288, 3)
  })

  it("speeds up by the per-card coefficient", () => {
    const one = runFarm({ cards: 1, solar: false, ...PRICES })
    const fifty = runFarm({ cards: 50, solar: false, ...PRICES })

    // 1 + 49 * 0.041225 = 3.020, so fifty cards is just over three times one.
    expect(one.cycleHours / fifty.cycleHours).toBeCloseTo(3.02, 2)
  })

  it("charges the generator's fuel against the day", () => {
    const farm = runFarm({ cards: 25, solar: false, ...PRICES })

    expect(farm.fuelPerDay).toBeCloseTo((24 / 21.0525) * 24_000, 0)
    expect(farm.netPerDay).toBeCloseTo(farm.grossPerDay - farm.fuelPerDay, 6)
  })

  it("halves the fuel bill with the solar module", () => {
    const dark = runFarm({ cards: 25, solar: false, ...PRICES })
    const solar = runFarm({ cards: 25, solar: true, ...PRICES })

    expect(solar.fuelPerDay).toBeCloseTo(dark.fuelPerDay / 2, 6)
  })

  it("pays the cards back out of net income", () => {
    const farm = runFarm({ cards: 10, solar: true, ...PRICES })

    expect(farm.buildCost).toBe(4_900_000)
    expect(farm.paybackDays).toBeCloseTo(farm.buildCost / farm.netPerDay, 6)
  })

  it("never pays back when the fuel costs more than the coins", () => {
    const farm = runFarm({
      cards: 1,
      solar: false,
      bitcoinPrice: 1_000,
      cardPrice: 490_000,
      tankPrice: 900_000,
    })

    expect(farm.netPerDay).toBeLessThan(0)
    expect(farm.paybackDays).toBeNull()
  })
})

describe("clampCards", () => {
  it("holds the farm between one card and a full rack", () => {
    expect(clampCards(0)).toBe(1)
    expect(clampCards(999)).toBe(MAX_CARDS)
    expect(clampCards(Number.NaN)).toBe(1)
    expect(clampCards(12.4)).toBe(12)
  })
})
