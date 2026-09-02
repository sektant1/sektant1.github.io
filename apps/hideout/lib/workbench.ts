/**
 * The workbench's arithmetic, kept out of its components.
 *
 * Everything here is a pure function over plain data: which buffers are open
 * after a navigation, and which one the strip moves to when the open document
 * is closed. Components hold the state; this file is what can be tested
 * without one.
 */

/** Which side panel the rail has selected. `null` is a collapsed panel. */
export type SidePanel = "files" | "links" | "visor" | "stash" | null

export type Buffer = {
  /** The route. Also the identity: one buffer per document. */
  href: string
  label: string
  /** The section it came from, drawn as the tab's marker. */
  kind: "post" | "project" | "game" | "page"
}

/**
 * How many tabs the strip keeps.
 *
 * A tab strip is a working set, not a history — the reader did not open these
 * files, they visited these URLs, and a strip that grows without limit stops
 * being something you can read across in one glance. Eight is what fits at a
 * readable width before the strip has to scroll.
 */
export const MAX_BUFFERS = 8

/**
 * The strip after arriving at a document.
 *
 * Revisiting a buffer does not move it: an editor leaves tabs where they are,
 * and a strip that reorders under the reader as they navigate back and forth
 * is one they have to re-read every time.
 */
export function openBuffer(buffers: Buffer[], buffer: Buffer): Buffer[] {
  if (buffers.some((open) => open.href === buffer.href)) return buffers
  const next = [...buffers, buffer]
  return next.length > MAX_BUFFERS
    ? next.slice(next.length - MAX_BUFFERS)
    : next
}

export function closeBuffer(buffers: Buffer[], href: string): Buffer[] {
  return buffers.filter((buffer) => buffer.href !== href)
}

/**
 * Where to go when the open buffer is closed.
 *
 * The neighbour to the right, or the one to the left when there is nothing to
 * the right — the rule every editor uses. `null` when the strip is now empty:
 * closing the last tab leaves the reader where they are rather than sending
 * them somewhere they did not ask to go.
 */
export function nextAfterClose(buffers: Buffer[], href: string): string | null {
  const index = buffers.findIndex((buffer) => buffer.href === href)
  if (index === -1) return null
  const remaining = closeBuffer(buffers, href)
  if (remaining.length === 0) return null
  return (remaining[index] ?? remaining[remaining.length - 1]).href
}
