const SPEED = 7
const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS
/** The game's clock sits three hours ahead of the real one at the epoch. */
const OFFSET_MS = 3 * HOUR_MS

function format(ms: number) {
  const wrapped = ((ms % DAY_MS) + DAY_MS) % DAY_MS
  const hours = Math.floor(wrapped / HOUR_MS)
  const minutes = Math.floor((wrapped % HOUR_MS) / 60_000)
  const seconds = Math.floor((wrapped % 60_000) / 1000)
  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")
}

/**
 * The two raid servers: both run at seven times real time, twelve hours
 * apart, which is why one is in daylight while the other is not. Arithmetic
 * over the wall clock, so it is a real reading rather than a decoration.
 */
export function tarkovTime(now: Date) {
  const base = now.getTime() * SPEED + OFFSET_MS
  return { left: format(base), right: format(base + 12 * HOUR_MS) }
}
