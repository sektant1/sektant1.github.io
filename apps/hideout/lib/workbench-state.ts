import {
  createPersistedPreference,
  oneOf,
} from "@workspace/ui/lib/persisted-preference"

import { openBuffer, closeBuffer, type Buffer } from "@/lib/workbench"

export const SIDE_PANEL_STORAGE_KEY = "workbench-panel"

/** `off` rather than an absent value: a collapsed panel is a choice. */
const PANEL_IDS = ["files", "links", "visor", "stash", "off"] as const
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
 * Who is drawing the instrument.
 *
 * There is one viewer and it costs a WebGL context, a render loop and about
 * 560 KB of renderer. Three surfaces can ask for it — the dock, the archive
 * rail's panel, and the hover preview — so they do not get to decide among
 * themselves: they claim, and the claim with the highest standing wins.
 *
 * The order is by how deliberate the ask was. Opening the dock's tab is a
 * decision; hovering something is a glance; leaving the panel open is a
 * setting from last week. Whoever loses draws the plate that says so.
 *
 * Not persisted: it describes what is on screen right now.
 */
export type InstrumentOwner = "dock" | "hover" | "panel"

const STANDING: InstrumentOwner[] = ["dock", "hover", "panel"]

const instrumentListeners = new Set<() => void>()
const claims = new Set<InstrumentOwner>()

export const instrument = {
  /** The owner drawing it, or null while nobody has asked. */
  read(): InstrumentOwner | null {
    return STANDING.find((owner) => claims.has(owner)) ?? null
  },

  serverSnapshot: () => null,

  subscribe(listener: () => void) {
    instrumentListeners.add(listener)
    return () => {
      instrumentListeners.delete(listener)
    }
  },

  claim(owner: InstrumentOwner) {
    if (claims.has(owner)) return
    claims.add(owner)
    announceInstrument()
  },

  release(owner: InstrumentOwner) {
    if (!claims.delete(owner)) return
    announceInstrument()
  },
}

/** What to tell the reader when someone else has it. */
export const INSTRUMENT_BUSY: Record<InstrumentOwner, string> = {
  dock: "running in the dock",
  hover: "running in the preview",
  panel: "running in the panel",
}

function announceInstrument() {
  for (const listener of instrumentListeners) listener()
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
