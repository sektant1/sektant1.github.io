"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

import type { TocItem } from "@/lib/content/types"

function flatten(items: TocItem[]): TocItem[] {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])])
}

/**
 * Whatever actually scrolls the article.
 *
 * The shell is an editor: the chrome is fixed at viewport height and the
 * buffer scrolls inside it, so the scroll events this needs are on an element
 * in the middle of the tree, not on the window. Anchor jumps work either way,
 * but a listener on the window never fires and the outline sits frozen on the
 * first heading. Falls back to the window so the component still works outside
 * the shell.
 */
function findScroller(): HTMLElement | Window {
  return document.querySelector<HTMLElement>('[data-slot="buffer"]') ?? window
}

/**
 * The article outline, in the position an editor puts one: a symbols panel
 * beside the buffer.
 *
 * The active entry is resolved from scroll position rather than from the URL
 * hash, so it keeps up while the reader scrolls past headings they never
 * clicked. Updates are coalesced into one animation frame — measuring on every
 * scroll event is the usual reason a page like this stutters.
 */
export function ContentToc({
  items,
  className,
}: {
  items: TocItem[]
  className?: string
}) {
  const hrefs = React.useMemo(
    () => flatten(items).map((item) => item.href),
    [items]
  )
  const [active, setActive] = React.useState(hrefs[0] ?? "")

  React.useEffect(() => {
    if (hrefs.length === 0) return

    const headings = hrefs
      .map((href) => document.getElementById(decodeURIComponent(href.slice(1))))
      .filter((heading): heading is HTMLElement => Boolean(heading))

    if (headings.length === 0) return

    const scroller = findScroller()
    // Where "read" ends: just under the sticky header on the scroller, or a
    // little under the top of the window when the page itself scrolls.
    const threshold =
      scroller instanceof Window
        ? 140
        : scroller.getBoundingClientRect().top + 96

    let frame: number | null = null

    const measure = () => {
      frame = null
      const passed = headings.filter(
        (heading) => heading.getBoundingClientRect().top <= threshold
      )
      setActive(`#${(passed.at(-1) ?? headings[0]).id}`)
    }

    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure)
    }

    measure()
    scroller.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)

    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      scroller.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [hrefs])

  if (items.length === 0) return null

  return (
    <nav
      aria-label="On this page"
      className={cn("flex flex-col gap-2", className)}
    >
      <p className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim uppercase">
        on this page
      </p>
      <TocLevel items={items} active={active} depth={0} />
    </nav>
  )
}

function TocLevel({
  items,
  active,
  depth,
}: {
  items: TocItem[]
  active: string
  depth: number
}) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const isActive = active === item.href

        return (
          <li key={item.href} className="min-w-0">
            <a
              href={item.href}
              aria-current={isActive ? "location" : undefined}
              style={{ paddingInlineStart: `${0.5 + depth * 0.75}rem` }}
              className={cn(
                "flex min-w-0 items-baseline gap-1.5 border-s py-0.5 pe-1 font-mono text-[0.7rem] crt-persist focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-terminal-rule text-terminal-ink-dim hover:bg-terminal-wash hover:text-foreground"
              )}
            >
              <span aria-hidden="true" className="w-[1ch] shrink-0 font-bold">
                {isActive ? ">" : " "}
              </span>
              <span className="truncate">{item.label}</span>
            </a>

            {item.children?.length ? (
              <TocLevel
                items={item.children}
                active={active}
                depth={depth + 1}
              />
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
