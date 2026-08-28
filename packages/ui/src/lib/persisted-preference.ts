/**
 * A single reader's choice, remembered across visits.
 *
 * Every preference in this codebase had grown its own copy of the same four
 * problems, and they are all edge cases rather than the happy path:
 *
 *   localStorage throws rather than returning null in a private window or
 *   with site data blocked, so every read and write needs a guard.
 *
 *   `storage` events only fire in *other* tabs, so the tab that writes has to
 *   tell its own listeners.
 *
 *   The server has no storage at all, so React needs a separate snapshot or
 *   hydration mismatches.
 *
 *   A stored string is untrusted input and can be anything.
 *
 * One module, one place those are solved.
 */

export interface PersistedPreference<T> {
  key: string
  /** The stored value, or the fallback when there is none or it is invalid. */
  read: () => T
  /** What the server renders. Always the fallback: it has no storage. */
  serverSnapshot: () => T
  /** Stores the value and notifies every listener, including this tab's. */
  write: (value: T) => void
  subscribe: (listener: () => void) => () => void
}

export interface PersistedPreferenceOptions<T> {
  key: string
  /** Used when nothing is stored or the stored value is invalid. */
  fallback: T
  /**
   * Used when storage itself is unavailable, which is a different situation
   * from an empty one: nothing written now will be readable later, so a
   * preference whose whole job is "show this once" wants to answer "already
   * shown" rather than repeat forever. Defaults to `fallback`.
   */
  whenUnavailable?: T
  /** Rejects a stored string by returning null. Defaults to a string cast. */
  parse?: (raw: string) => T | null
  serialize?: (value: T) => string
}

export function createPersistedPreference<T>({
  key,
  fallback,
  whenUnavailable,
  parse = (raw) => raw as unknown as T,
  serialize = (value) => String(value),
}: PersistedPreferenceOptions<T>): PersistedPreference<T> {
  const unavailable = whenUnavailable === undefined ? fallback : whenUnavailable
  const listeners = new Set<() => void>()
  let memoryValue = fallback
  let hasMemoryValue = false

  function announce() {
    for (const listener of listeners) listener()
  }

  return {
    key,

    read() {
      if (hasMemoryValue) return memoryValue
      try {
        const raw = window.localStorage.getItem(key)
        if (raw === null) return fallback
        const parsed = parse(raw)
        return parsed === null ? fallback : parsed
      } catch {
        return unavailable
      }
    },

    serverSnapshot: () => fallback,

    write(value) {
      try {
        window.localStorage.setItem(key, serialize(value))
        hasMemoryValue = false
      } catch {
        memoryValue = value
        hasMemoryValue = true
      }
      announce()
    },

    subscribe(listener) {
      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== key) return
        hasMemoryValue = false
        listener()
      }
      listeners.add(listener)
      window.addEventListener("storage", onStorage)
      return () => {
        listeners.delete(listener)
        window.removeEventListener("storage", onStorage)
      }
    },
  }
}

/** Accepts only one of a fixed set of ids. */
export function oneOf<T extends string>(
  allowed: readonly T[]
): (raw: string) => T | null {
  return (raw) => (allowed.includes(raw as T) ? (raw as T) : null)
}
