import Link from "next/link"

import type { PostSeriesSummary } from "@/lib/content/types"

/**
 * Series index.
 *
 * A series is the one place on this site where order carries meaning — part 2
 * assumes part 1 — so entries are numbered here and nowhere else. The card
 * shows the span it covers, which is the question a reader has about a series
 * they have not started: is this finished, and how long is it.
 */
export function SeriesList({ series }: { series: PostSeriesSummary[] }) {
  if (series.length === 0) {
    return (
      <p className="py-6 text-xs text-terminal-ink-dim">
        No series yet. Posts get grouped into one when they build on each other.
      </p>
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {series.map((entry) => (
        <li key={entry.id}>
          <Link
            href={`/posts/series/${entry.id}`}
            className="group flex h-full flex-col gap-2 border border-border p-3 crt-persist hover:border-primary hover:bg-terminal-wash focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="min-w-0 font-sans text-sm text-foreground group-hover:text-primary">
                {entry.title}
              </h3>
              <span className="shrink-0 font-mono text-[0.7rem] text-terminal-chrome tabular-nums">
                {entry.count} parts
              </span>
            </div>

            {entry.description ? (
              <p className="line-clamp-2 text-xs text-terminal-ink-dim">
                {entry.description}
              </p>
            ) : null}

            <ol className="mt-auto flex flex-col gap-0.5 font-mono text-[0.65rem] text-terminal-ink-faint">
              {entry.posts.slice(0, 3).map((post, index) => (
                <li key={post.slug} className="truncate">
                  <span className="text-terminal-chrome-dim tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>{" "}
                  {post.title}
                </li>
              ))}
              {entry.count > 3 ? (
                <li className="text-terminal-chrome-dim">
                  +{entry.count - 3} more
                </li>
              ) : null}
            </ol>
          </Link>
        </li>
      ))}
    </ul>
  )
}
