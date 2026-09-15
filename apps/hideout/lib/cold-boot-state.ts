import { createPersistedPreference } from "@workspace/ui/lib/persisted-preference"

export const COLD_BOOT_STORAGE_KEY = "cold-boot-seen"

const UNAVAILABLE = -1

export const coldBootLastSeen = createPersistedPreference<number>({
  key: COLD_BOOT_STORAGE_KEY,
  fallback: 0,
  whenUnavailable: UNAVAILABLE,
  parse: (raw) => {
    const stamp = Number(raw)
    return Number.isFinite(stamp) && stamp > 0 ? stamp : null
  },
  serialize: (value) => String(value),
})

export function bootIsDue(lastSeen: number): boolean {
  if (lastSeen === UNAVAILABLE) return false
  return !Number.isFinite(lastSeen) || lastSeen <= 0
}
