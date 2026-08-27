import Link from "next/link"

import type { PostSeriesContext } from "@/lib/content/types"

/**
 * Where this post sits in its series, and the two posts either side of it.
 *
 * Shown at the end rather than the top: it answers "what next", which is a
 * question the reader has once they have finished.
 */
export function SeriesNav({ context }: { context: PostSeriesContext }) {
  const position =
    context.currentIndex >= 0 ? context.currentIndex + 1 : context.series.order

  return (
    <nav
      aria-label={`${context.series.title} series`}
      className="mt-8 flex flex-col gap-3 border-t border-terminal-rule pt-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link
          href={`/posts/series/${context.series.id}`}
          className="font-sans text-sm text-foreground hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          {context.series.title}
        </Link>
        <span className="font-mono text-[0.7rem] text-terminal-chrome-dim tabular-nums">
          part {position} of {context.posts.length}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {context.previous ? (
          <SeriesLink
            direction="previous"
            href={`/posts/${context.previous.slug}`}
            title={context.previous.title}
          />
        ) : (
          <span />
        )}
        {context.next ? (
          <SeriesLink
            direction="next"
            href={`/posts/${context.next.slug}`}
            title={context.next.title}
          />
        ) : null}
      </div>
    </nav>
  )
}

function SeriesLink({
  direction,
  href,
  title,
}: {
  direction: "previous" | "next"
  href: string
  title: string
}) {
  const isNext = direction === "next"

  return (
    <Link
      href={href}
      className={`flex flex-col gap-0.5 border border-border p-2.5 hover:border-primary hover:bg-terminal-wash focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none ${
        isNext ? "sm:col-start-2 sm:text-end" : ""
      }`}
    >
      <span className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim uppercase">
        {isNext ? "next →" : "← previous"}
      </span>
      <span className="text-xs text-foreground">{title}</span>
    </Link>
  )
}
