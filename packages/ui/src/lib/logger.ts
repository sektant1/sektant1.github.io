/**
 * A small in-memory logger with a subscription.
 *
 * It exists so an app can show its own log in the interface instead of asking
 * people to open devtools — the console panel in this package renders exactly
 * what this holds. Everything stays in memory: nothing is sent anywhere, and
 * the buffer dies with the tab.
 *
 * Safe to call during a server render. There is nothing to flush and no
 * listener to notify there, so calls are recorded into the same ring buffer
 * and simply never displayed.
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

export type LogEntry = {
  id: number
  /** Milliseconds since the epoch, stamped when the entry was recorded. */
  time: number
  level: LogLevel
  /** Which part of the app spoke: "router", "planet", "cms". */
  scope: string
  message: string
  /** Anything structured worth keeping with the line. */
  data?: unknown
}

type Listener = (entries: LogEntry[]) => void

/**
 * Old lines are dropped rather than kept forever: this runs for as long as the
 * tab is open, and an unbounded array in a long-lived page is a leak.
 */
const CAPACITY = 500

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

let entries: LogEntry[] = []
let nextId = 1
const listeners = new Set<Listener>()

/** Lines below this are dropped at the source. */
let threshold: LogLevel = "debug"

function emit() {
  // A fresh array per notification: subscribers compare by identity to decide
  // whether to re-render, and mutating one in place would look like no change.
  const snapshot = entries
  for (const listener of listeners) listener(snapshot)
}

function record(level: LogLevel, scope: string, message: string, data?: unknown) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[threshold]) return

  const entry: LogEntry = {
    id: nextId++,
    time: Date.now(),
    level,
    scope,
    message,
    data,
  }

  entries = [...entries, entry].slice(-CAPACITY)
  emit()
}

export const logger = {
  debug: (scope: string, message: string, data?: unknown) =>
    record("debug", scope, message, data),
  info: (scope: string, message: string, data?: unknown) =>
    record("info", scope, message, data),
  warn: (scope: string, message: string, data?: unknown) =>
    record("warn", scope, message, data),
  error: (scope: string, message: string, data?: unknown) =>
    record("error", scope, message, data),

  /** Everything recorded so far, oldest first. */
  entries: () => entries,

  clear() {
    entries = []
    emit()
  },

  setLevel(level: LogLevel) {
    threshold = level
  },

  getLevel: () => threshold,

  /**
   * Calls the listener on every change and returns an unsubscribe. Shaped for
   * useSyncExternalStore, which is how the console panel reads it.
   */
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

/** Compares two levels, for filtering a rendered view. */
export function atLeast(level: LogLevel, minimum: LogLevel) {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minimum]
}

/**
 * Mirrors `console.warn` and `console.error` into the log.
 *
 * Errors a page hits on its own — a failed image, a thrown effect — are the
 * ones worth seeing in a panel, and they never come through the logger's own
 * API. The original console methods still run, so devtools is unaffected.
 *
 * Returns a function that restores the console. Calling it twice is harmless.
 */
export function captureConsole(): () => void {
  if (typeof window === "undefined") return () => {}

  const original = { warn: console.warn, error: console.error }
  let restored = false

  const forward =
    (level: "warn" | "error") =>
    (...args: unknown[]) => {
      original[level](...args)
      record(
        level,
        "console",
        args
          .map((arg) => (typeof arg === "string" ? arg : safeStringify(arg)))
          .join(" "),
      )
    }

  console.warn = forward("warn")
  console.error = forward("error")

  return () => {
    if (restored) return
    restored = true
    console.warn = original.warn
    console.error = original.error
  }
}

/** Circular structures and DOM nodes are common here, so this never throws. */
export function safeStringify(value: unknown) {
  if (value instanceof Error) return `${value.name}: ${value.message}`

  try {
    return JSON.stringify(value, replaceCircular())
  } catch {
    return String(value)
  }
}

function replaceCircular() {
  const seen = new WeakSet<object>()
  return (_key: string, value: unknown) => {
    if (typeof value !== "object" || value === null) return value
    if (seen.has(value)) return "[circular]"
    seen.add(value)
    return value
  }
}
