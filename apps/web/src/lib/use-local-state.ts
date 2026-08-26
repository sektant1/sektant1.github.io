import * as React from "react"

const PREFIX = "skt:"

/**
 * Reads a JSON value written by {@link writeLocal}.
 *
 * Returns `fallback` for every failure mode: nothing stored, corrupt JSON, or
 * a browser that throws on access. Losing a preference is never worth
 * crashing a route for.
 */
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Writes a JSON value. A browser that refuses storage degrades to session-only. */
export function writeLocal<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Session-only.
  }
}

/**
 * `useState` that survives a reload. The initial value is read once on mount,
 * so the first render matches what a server would produce.
 */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(() => readLocal(key, initial))

  const update = React.useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved =
          typeof next === "function"
            ? (next as (previous: T) => T)(previous)
            : next
        writeLocal(key, resolved)
        return resolved
      })
    },
    [key]
  )

  return [value, update] as const
}
