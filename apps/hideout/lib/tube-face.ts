import { createPersistedPreference } from "@workspace/ui/lib/persisted-preference"

export const TUBE_FACE_STORAGE_KEY = "tube-face"

/**
 * Whether the glass is on the screen.
 *
 * The mask, the refresh band and the vignette are the site's own face, but
 * they also sit over every line of text on it. Long posts and dim panels are
 * where that stops being worth it, so the glass lifts, and stays lifted on
 * the next page.
 *
 * Blocked storage reads as on: a private window still gets the site as it is
 * meant to look.
 */
export const tubeFaceOn = createPersistedPreference<boolean>({
  key: TUBE_FACE_STORAGE_KEY,
  fallback: true,
  whenUnavailable: true,
  parse: (raw) => raw !== "0",
  serialize: (value) => (value ? "1" : "0"),
})
