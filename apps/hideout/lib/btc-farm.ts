/**
 * The bitcoin farm, as arithmetic.
 *
 * The instrument draws a physical bitcoin; this is what it takes to make one.
 * Every constant here is a game value with its source named, and every price
 * comes from the market — the panel is a calculator, so an invented number in
 * it is not decoration, it is a wrong answer.
 */

/**
 * Production time for one coin, in seconds:
 *
 *   BASE / (1 + (cards - 1) * PER_CARD)
 *
 * The coefficient is stable across every source. The base is not: guides
 * written before the nerf quote 145 000 (40h at one card), and 2026 sources
 * quote 300 000 (83h20m at one card). The current patch is what the panel has
 * to answer for, so the base is current and named rather than inlined.
 */
export const CYCLE_BASE_SECONDS = 300_000
export const CYCLE_PER_CARD = 0.041225

/** A level 3 farm holds fifty cards; below that, fewer. */
export const MAX_CARDS = 50

/**
 * The generator, from the wiki's own figures: a metal fuel tank holds 100
 * units and runs the hideout for 21h 03m 09s, doubled by the solar module.
 */
export const TANK_HOURS = 21 + 3 / 60 + 9 / 3600
export const SOLAR_MULTIPLIER = 2

export type FarmInput = {
  cards: number
  solar: boolean
  /** Roubles per item, as the market reported them. */
  bitcoinPrice: number
  cardPrice: number
  tankPrice: number
}

export type FarmResult = {
  /** Hours the farm takes to produce one coin. */
  cycleHours: number
  coinsPerDay: number
  /** Roubles a day, before and after the generator's fuel. */
  grossPerDay: number
  fuelPerDay: number
  netPerDay: number
  /** What the cards cost to buy at the market's price. */
  buildCost: number
  /** Days of net income to pay the cards back, or null if it never does. */
  paybackDays: number | null
}

export function runFarm({
  cards,
  solar,
  bitcoinPrice,
  cardPrice,
  tankPrice,
}: FarmInput): FarmResult {
  const installed = clampCards(cards)
  const cycleSeconds =
    CYCLE_BASE_SECONDS / (1 + (installed - 1) * CYCLE_PER_CARD)
  const cycleHours = cycleSeconds / 3600
  const coinsPerDay = 24 / cycleHours

  // The generator burns the same fuel whether the farm is running or not, so
  // the whole day's fuel is charged against it: the farm is the reason the
  // generator is on.
  const tankHours = TANK_HOURS * (solar ? SOLAR_MULTIPLIER : 1)
  const fuelPerDay = (24 / tankHours) * tankPrice

  const grossPerDay = coinsPerDay * bitcoinPrice
  const netPerDay = grossPerDay - fuelPerDay
  const buildCost = installed * cardPrice

  return {
    cycleHours,
    coinsPerDay,
    grossPerDay,
    fuelPerDay,
    netPerDay,
    buildCost,
    paybackDays: netPerDay > 0 ? buildCost / netPerDay : null,
  }
}

export function clampCards(cards: number) {
  if (!Number.isFinite(cards)) return 1
  return Math.min(MAX_CARDS, Math.max(1, Math.round(cards)))
}
