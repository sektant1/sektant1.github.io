/**
 * The workbench's arithmetic, kept out of its components.
 *
 * Everything here is a pure function over plain data: which buffers are open
 * after a navigation, and where a tick sits on the minimap. Components read
 * the DOM and hold state; this file is what can be tested without either.
 */

/** Which side panel the rail has selected. `null` is a collapsed panel. */
export type SidePanel = "files" | "links" | "visor" | null

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

/** A block of the open document, measured in document space. */
export type DocBlock = {
  /** Distance from the top of the document, in pixels. */
  top: number
  height: number
  /** Headings are drawn brighter: they are what the column is scanned for. */
  heading: boolean
}

export type MinimapTick = {
  top: number
  height: number
  heading: boolean
}

/** The smallest tick that still reads as a mark rather than as dust. */
const MIN_TICK = 2

/**
 * The document's blocks, scaled into the column.
 *
 * One tick per block, proportional to the block's height — a page of short
 * paragraphs and a page with three long code listings should not produce the
 * same column, because the shape of the column is the only thing it reports.
 */
export function minimapTicks(
  blocks: DocBlock[],
  docHeight: number,
  columnHeight: number
): MinimapTick[] {
  if (docHeight <= 0 || columnHeight <= 0) return []
  const scale = columnHeight / docHeight

  return blocks.map((block) => ({
    top: Math.max(0, Math.min(columnHeight, block.top * scale)),
    height: Math.max(MIN_TICK, block.height * scale),
    heading: block.heading,
  }))
}

/**
 * The window framing what is on screen, in column space.
 *
 * Clamped to the column rather than allowed to run past it, so a document
 * shorter than the viewport shows a window over the whole column instead of
 * one taller than the thing it frames.
 */
export function minimapWindow(
  scrollTop: number,
  viewportHeight: number,
  docHeight: number,
  columnHeight: number
): { top: number; height: number } {
  if (docHeight <= 0 || columnHeight <= 0) return { top: 0, height: 0 }
  const scale = columnHeight / docHeight
  const height = Math.min(
    columnHeight,
    Math.max(MIN_TICK, viewportHeight * scale)
  )
  const top = Math.max(0, Math.min(columnHeight - height, scrollTop * scale))
  return { top, height }
}

/**
 * Where to scroll when the column is clicked at `offset`.
 *
 * The click marks the middle of the window, not its top: a reader pointing at
 * a tick is asking to read that block, not to put it at the top edge where
 * the header covers it.
 */
export function minimapScrollTarget(
  offset: number,
  viewportHeight: number,
  docHeight: number,
  columnHeight: number
): number {
  if (columnHeight <= 0) return 0
  const scale = docHeight / columnHeight
  const target = offset * scale - viewportHeight / 2
  return Math.max(0, Math.min(Math.max(0, docHeight - viewportHeight), target))
}
