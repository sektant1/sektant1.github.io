import { createPersistedPreference } from "@workspace/ui/lib/persisted-preference"

/* The stored value keeps its old name. Readers who turned the screen off
   have that choice sitting in their browser under this key, and renaming it
   would quietly turn the glass back on for every one of them. */
export const CRT_SCREEN_STORAGE_KEY = "tube-face"

/**
 * Whether the CRT screen is on.
 *
 * The mask, the raster, the refresh band, the vignette and the phosphor
 * bloom are the site's own face, but they also sit over every line of text
 * on it. Long posts and dim panels are where that stops being worth it, so
 * the screen goes off, and stays off on the next page.
 *
 * Blocked storage reads as on: a private window still gets the site as it is
 * meant to look.
 */
export const crtScreenOn = createPersistedPreference<boolean>({
  key: CRT_SCREEN_STORAGE_KEY,
  fallback: true,
  whenUnavailable: true,
  parse: (raw) => raw !== "0",
  serialize: (value) => (value ? "1" : "0"),
})
