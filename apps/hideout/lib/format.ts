/**
 * Counts are printed as fixed-width readouts across the site — the hero
 * metrics, the boot log's index lines — so the columns stay put as the
 * numbers change.
 */
export function pad(value: number, width = 3): string {
  return String(value).padStart(width, "0")
}
