import { createPersistedPreference } from "@workspace/ui/lib/persisted-preference"

export const COLD_BOOT_STORAGE_KEY = "cold-boot-seen"

/**
 * Whether this terminal has already watched the boot sequence.
 *
 * Blocked storage reads as seen. A private window cannot remember anything,
 * so the alternative is replaying the whole sequence on every page view — a
 * greeting turned into a toll.
 */
export const coldBootSeen = createPersistedPreference<boolean>({
  key: COLD_BOOT_STORAGE_KEY,
  fallback: false,
  whenUnavailable: true,
  parse: (raw) => raw === "1",
  serialize: (value) => (value ? "1" : "0"),
})
