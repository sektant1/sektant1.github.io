import type * as React from "react"
import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"

import { ContentToc } from "@/components/content/content-toc"
import type { TocItem } from "@/lib/content/types"

type ArticleProps = {
  title: string
  date?: string
  readingTime?: string
  tags?: string[]
  /** When set, tags link to the filtered listing at this path. */
  tagBase?: string | null
  toc: TocItem[]
  /** Extra header content: a project's links, a cover image. */
  masthead?: React.ReactNode
  /** Extra footer content: series navigation. */
  footer?: React.ReactNode
  /** Set only when the local CMS is running: opens this file in the editor. */
  editHref?: string | null
  children: React.ReactNode
}

/**
 * The reading layout: article on the left, outline on the right.
 *
 * The outline is a sibling column rather than a third shell panel, so on
 * narrow screens it collapses to a disclosure above the text instead of
 * needing a whole responsive shell of its own.
 */
export function Article({
  title,
  date,
  readingTime,
  tags = [],
  tagBase = "/posts",
  toc,
  masthead,
  footer,
  editHref,
  children,
}: ArticleProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-6 md:px-6 md:py-8">
      <article className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b border-terminal-rule pb-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="flex items-start gap-2 font-sans text-2xl leading-tight font-bold tracking-[0.04em] text-primary uppercase crt-glow-soft md:text-3xl">
              <span
                aria-hidden="true"
                className="mt-[0.3em] shrink-0 font-mono text-[0.5em] leading-none tracking-normal"
              >
                [&gt;]
              </span>
              <span>{title}</span>
            </h1>

            {editHref ? (
              <Link
                href={editHref}
                className="mt-1 shrink-0 font-mono text-[0.7rem] text-terminal-chrome hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              >
                edit
              </Link>
            ) : null}
          </div>

          {date || readingTime ? (
            <p className="flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-terminal-chrome-dim">
              {date ? <time dateTime={date}>{date}</time> : null}
              {readingTime ? <span>{readingTime}</span> : null}
            </p>
          ) : null}

          {tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li key={tag}>
                  {tagBase ? (
                    <Link
                      href={`${tagBase}?tag=${encodeURIComponent(tag)}`}
                      className="focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <Badge variant="outline" className="font-mono">
                        #{tag}
                      </Badge>
                    </Link>
                  ) : (
                    <Badge variant="outline" className="font-mono">
                      #{tag}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {masthead}
        </header>

        {/* On narrow screens the outline is a disclosure above the text: it is
            a shortcut, and a reader who does not want it should be able to put
            it away rather than scroll past it. */}
        {toc.length > 0 ? (
          <details className="mt-4 border border-terminal-rule p-3 xl:hidden">
            <summary className="cursor-pointer font-mono text-[0.7rem] tracking-widest text-terminal-chrome uppercase">
              on this page
            </summary>
            <div className="mt-2">
              <ContentToc items={toc} />
            </div>
          </details>
        ) : null}

        <div className="prose mt-6">{children}</div>

        {footer}
      </article>

      {toc.length > 0 ? (
        <aside className="hidden w-56 shrink-0 xl:block">
          <div className="sticky top-4">
            <ContentToc items={toc} />
          </div>
        </aside>
      ) : null}
    </div>
  )
}
