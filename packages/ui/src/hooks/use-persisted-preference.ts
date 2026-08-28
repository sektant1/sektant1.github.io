"use client"

import * as React from "react"
import type { PersistedPreference } from "@workspace/ui/lib/persisted-preference"

/**
 * Reads a preference through useSyncExternalStore rather than an effect:
 * localStorage does not exist on the server, and this is the API that lets
 * the server render the fallback and the client correct it during hydration
 * instead of after it, with no flash in between.
 */
export function usePersistedPreference<T>(preference: PersistedPreference<T>) {
  const value = React.useSyncExternalStore(
    preference.subscribe,
    preference.read,
    preference.serverSnapshot
  )

  return [value, preference.write] as const
}
