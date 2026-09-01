import {
  createPersistedPreference,
  oneOf,
} from "@workspace/ui/lib/persisted-preference"

export const TUBE_STORAGE_KEY = "tube"

/**
 * Which phosphor the screen is coated with.
 *
 * Green (P1) and amber (P3) are the two these terminals were actually built
 * with, and the toolkit's phosphor theme carries both — see
 * `packages/ui/src/styles/themes/phosphor.css`. This is not a light/dark
 * switch wearing a costume: a phosphor tube has no light mode, so the axis the
 * theme spends is the coating rather than the scheme, and both tubes are dark.
 *
 * Green is the identity and the default. Amber is a console toy a reader can
 * find, in the same class as the CRT key and the ASCII banner font — not an
 * equal-weight brand variant, and never the thing a screenshot shows.
 */
export const TUBES = ["green", "amber"] as const

export type Tube = (typeof TUBES)[number]

export const TUBE_ATTRIBUTE = "data-tube"

/** Blocked storage reads as green: the identity is what a private window gets. */
export const tube = createPersistedPreference<Tube>({
  key: TUBE_STORAGE_KEY,
  fallback: "green",
  whenUnavailable: "green",
  parse: oneOf(TUBES),
})
