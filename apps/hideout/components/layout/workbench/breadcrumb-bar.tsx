"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Where you are, as a path you can walk back up.
 *
 * The header used to print the same string as dead text — the one place the
 * shell told the reader their position and gave them no way to act on it. Each
 * segment that names a section is a link to that section's listing; the file
 * itself is not, because it is the thing already open.
 *
 * The trailing element is the heading currently under the top of the buffer,
 * which is the part a path cannot report: in a long document, knowing you are
 * in `index.mdx` stopped being useful three screens ago.
 */

/** Segments that name a listing the site actually has. */
const SECTION_HREF: Record<string, string> = {
  posts: "/posts",
  projects: "/projects",
  games: "/games",
}

export function BreadcrumbBar({
  path,
  className,
}: {
  path: string
  className?: string
}) {
  const heading = useActiveHeading()
  const segments = path.split("/").filter(Boolean)

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex h-7 shrink-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto border-b border-terminal-rule px-3 font-mono text-[0.66rem] whitespace-nowrap [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      <span aria-hidden="true" className="text-terminal-ink-faint">
        ~/
      </span>

      {segments.map((segment, index) => {
        const href = SECTION_HREF[segment]
        const last = index === segments.length - 1

        return (
          <React.Fragment key={`${segment}-${index}`}>
            {href && !last ? (
              <Link
                href={href}
                className="text-terminal-ink-dim underline-offset-4 crt-persist hover:text-primary hover:underline focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              >
                {segment}
              </Link>
            ) : (
              <span
                className={last ? "text-terminal-ink" : "text-terminal-ink-dim"}
              >
                {segment}
              </span>
            )}

            {last ? null : (
              <span aria-hidden="true" className="text-terminal-chrome-dim">
                /
              </span>
            )}
          </React.Fragment>
        )
      })}

      {heading ? (
        <>
          <span aria-hidden="true" className="text-terminal-chrome-dim">
            ▸
          </span>
          <span className="min-w-0 truncate text-terminal-chrome lowercase">
            {heading}
          </span>
        </>
      ) : null}
    </nav>
  )
}

/**
 * The heading the reader is under.
 *
 * Tracked by observing the document's headings against a band at the top of
 * the buffer rather than by measuring on every scroll event: the browser is
 * already doing this work, and a scroll handler that reads layout is the
 * classic way to make a long post stutter.
 */
function useActiveHeading() {
  const pathname = usePathname()
  // Stamped with the route it was read from, so arriving at a new document
  // shows no heading until this document has been observed — rather than
  // carrying the last one across the navigation, or clearing it from an effect
  // and rendering one frame of the wrong answer.
  const [found, setFound] = React.useState<{
    path: string
    text: string | null
  }>({ path: "", text: null })

  React.useEffect(() => {
    const buffer = document.querySelector<HTMLElement>('[data-slot="buffer"]')
    if (!buffer) return

    const headings = [...buffer.querySelectorAll<HTMLElement>("h2, h3")]
    if (headings.length === 0) return

    // The observer is the trigger, not the answer: it fires when the set of
    // headings on screen changes, and the field is then the last heading whose
    // top has passed the header. Reading the answer off the entries instead
    // blanks the field in the middle of a long section, where no heading is
    // intersecting at all.
    const observer = new IntersectionObserver(
      () => {
        let current: HTMLElement | null = null
        for (const candidate of headings) {
          if (candidate.getBoundingClientRect().top < 96) current = candidate
          else break
        }

        setFound({ path: pathname, text: current?.textContent?.trim() ?? null })
      },
      { root: buffer, rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    )

    for (const element of headings) observer.observe(element)
    return () => observer.disconnect()
  }, [pathname])

  return found.path === pathname ? found.text : null
}
