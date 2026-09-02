"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"

import {
  minimapScrollTarget,
  minimapTicks,
  minimapWindow,
  type DocBlock,
  type MinimapTick,
} from "@/lib/workbench"

/**
 * The document, as a column of phosphor.
 *
 * Not a miniature of the page. An editor's minimap renders the text at 2px
 * because the text is code and its shape is meaningful; prose at 2px is a grey
 * smear, and a smear costs a second render of the whole document to produce.
 * This draws one tick per block instead — height from the block's height,
 * brighter for headings — which is the part of a minimap a reader actually
 * uses: how long this is, where the sections are, and where in it they are.
 *
 * Every value on it is measured from the open document. Clicking jumps.
 */

/** The buffer is the scroller; the document inside it is what gets measured. */
const BUFFER = '[data-slot="buffer"]'

export function DocMinimap({ className }: { className?: string }) {
  const pathname = usePathname()
  const column = React.useRef<HTMLDivElement>(null)
  const [state, setState] = React.useState<{
    ticks: MinimapTick[]
    window: { top: number; height: number }
    doc: { height: number; viewport: number }
  }>({
    ticks: [],
    window: { top: 0, height: 0 },
    doc: { height: 0, viewport: 0 },
  })

  React.useEffect(() => {
    const buffer = document.querySelector<HTMLElement>(BUFFER)
    const rail = column.current
    if (!buffer || !rail) return

    let frame = 0

    const measure = () => {
      frame = 0
      const columnHeight = rail.clientHeight
      const docHeight = buffer.scrollHeight
      const viewport = buffer.clientHeight

      const blocks = readBlocks(buffer)
      setState({
        ticks: minimapTicks(blocks, docHeight, columnHeight),
        window: minimapWindow(
          buffer.scrollTop,
          viewport,
          docHeight,
          columnHeight
        ),
        doc: { height: docHeight, viewport },
      })
    }

    // Scroll runs on every frame the reader moves; measuring layout inside it
    // would be the one thing on this page that makes scrolling stutter.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure)
    }

    measure()
    buffer.addEventListener("scroll", schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(buffer)
    if (buffer.firstElementChild) observer.observe(buffer.firstElementChild)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      buffer.removeEventListener("scroll", schedule)
      observer.disconnect()
    }
  }, [pathname])

  const jump = (event: React.MouseEvent<HTMLDivElement>) => {
    const buffer = document.querySelector<HTMLElement>(BUFFER)
    const rail = column.current
    if (!buffer || !rail) return

    const offset = event.clientY - rail.getBoundingClientRect().top
    buffer.scrollTo({
      top: minimapScrollTarget(
        offset,
        state.doc.viewport,
        state.doc.height,
        rail.clientHeight
      ),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }

  // A map of a page that does not scroll reports nothing the reader cannot
  // already see. The column keeps its box so the layout does not jump as a
  // document grows past the fold — it just draws nothing in it.
  const scrolls = state.doc.height > state.doc.viewport + 8

  return (
    <div
      ref={column}
      onClick={scrolls ? jump : undefined}
      // A readout you can point at. It carries no text, and everything it
      // reports is available in the document itself, so assistive tech is
      // better served by the outline than by a column of divs.
      aria-hidden="true"
      className={cn(
        "relative w-14 shrink-0 overflow-hidden border-s border-terminal-rule bg-sidebar/40",
        scrolls && "cursor-pointer",
        className
      )}
    >
      {(scrolls ? state.ticks : []).map((tick, index) => (
        <span
          key={index}
          style={{ top: `${tick.top}px`, height: `${tick.height}px` }}
          className={cn(
            "absolute inset-x-2 rounded-none",
            tick.heading
              ? "bg-primary/70 crt-glow-soft"
              : "bg-terminal-chrome-dim/35"
          )}
        />
      ))}

      {scrolls ? (
        <span
          style={{
            top: `${state.window.top}px`,
            height: `${state.window.height}px`,
          }}
          className="absolute inset-x-0 border-y border-primary/40 bg-primary/10"
        />
      ) : null}
    </div>
  )
}

/**
 * The document's top-level blocks, in document space.
 *
 * The prose container when there is one, the buffer's own children otherwise —
 * a listing page has no `.prose`, and a minimap that only worked on posts would
 * be a column that appears and disappears as you browse.
 */
function readBlocks(buffer: HTMLElement): DocBlock[] {
  const doc = documentBody(buffer)
  const origin = buffer.getBoundingClientRect().top - buffer.scrollTop

  return [...doc.children].map((child) => {
    const rect = child.getBoundingClientRect()
    return {
      top: rect.top - origin,
      height: rect.height,
      heading: /^H[1-3]$/.test(child.tagName),
    }
  })
}

/**
 * The element whose children are the document's blocks.
 *
 * A post says so itself: `.prose` is the body of it. A listing does not — it
 * is a page of wrappers, and measuring the buffer's own child produces one
 * tick as tall as the column, which is a bar, not a map. Walking down through
 * single-child wrappers finds the first element that actually holds a list of
 * things.
 */
function documentBody(buffer: HTMLElement): HTMLElement {
  const prose = buffer.querySelector<HTMLElement>(".prose")
  if (prose) return prose

  let node: HTMLElement = buffer
  while (node.children.length === 1 && node.firstElementChild) {
    node = node.firstElementChild as HTMLElement
  }
  return node
}
