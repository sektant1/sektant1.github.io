import {
  createPersistedPreference,
  oneOf,
} from "@workspace/ui/lib/persisted-preference"

import { openBuffer, closeBuffer, type Buffer } from "@/lib/workbench"

export const SIDE_PANEL_STORAGE_KEY = "workbench-panel"

/** `off` rather than an absent value: a collapsed panel is a choice. */
const PANEL_IDS = ["files", "links", "visor", "off"] as const
export type StoredPanel = (typeof PANEL_IDS)[number]

/**
 * Which panel the rail has open, kept across visits.
 *
 * A reader who collapsed the panel to read a long post should find it
 * collapsed tomorrow — the site remembers the tube, the phosphor and the
 * faces for exactly the same reason.
 */
export const sidePanel = createPersistedPreference<StoredPanel>({
  key: SIDE_PANEL_STORAGE_KEY,
  fallback: "files",
  parse: oneOf(PANEL_IDS),
})

/**
 * Whether the dock is currently drawing the instrument.
 *
 * There is one viewer, and it costs a WebGL context and a render loop. The
 * dock owns it while its tab is selected; the sidebar panel reads this and
 * reports that the instrument moved rather than starting a second one.
 *
 * Not persisted: it describes what is on screen right now.
 */
const visorListeners = new Set<() => void>()
let visorInDock = false

export const dockVisor = {
  read: () => visorInDock,
  serverSnapshot: () => false,
  subscribe(listener: () => void) {
    visorListeners.add(listener)
    return () => {
      visorListeners.delete(listener)
    }
  },
  set(next: boolean) {
    if (next === visorInDock) return
    visorInDock = next
    for (const listener of visorListeners) listener()
  },
}

export const BUFFERS_STORAGE_KEY = "workbench-buffers"

/**
 * The strip of open documents, for this browsing session only.
 *
 * `sessionStorage`, not local: a tab strip that survives a restart is a
 * promise the site cannot keep. The reader did not open those files, they
 * visited those URLs, and finding eight of them waiting a week later reads as
 * a machine that has been going through your history.
 */
const listeners = new Set<() => void>()
let cache: Buffer[] | null = null

const EMPTY: Buffer[] = []

function load(): Buffer[] {
  try {
    const raw = window.sessionStorage.getItem(BUFFERS_STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY
    // Untrusted input: anything that is not a buffer is dropped rather than
    // rendered as a tab pointing nowhere.
    return parsed.filter(
      (item): item is Buffer =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Buffer).href === "string" &&
        typeof (item as Buffer).label === "string"
    )
  } catch {
    return EMPTY
  }
}

function commit(next: Buffer[]) {
  cache = next
  try {
    window.sessionStorage.setItem(BUFFERS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage is blocked. The strip still works for this page's lifetime.
  }
  for (const listener of listeners) listener()
}

export const buffers = {
  read(): Buffer[] {
    if (cache === null) cache = load()
    return cache
  },

  serverSnapshot: () => EMPTY,

  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  open(buffer: Buffer) {
    const next = openBuffer(buffers.read(), buffer)
    if (next !== buffers.read()) commit(next)
  },

  close(href: string) {
    commit(closeBuffer(buffers.read(), href))
  },
}
