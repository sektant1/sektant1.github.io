import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"

import { THUMB_ASPECT } from "@/components/media/thumbnail"
import { postThumb } from "@/components/posts/post-thumb"
import type { PostMeta } from "@/lib/content/types"

/**
 * The post index, drawn as a directory listing: date first, then the file.
 *
 * Sorting is always by date, so the date is the column the eye scans and it
 * leads every row. The thumbnail sits to the side rather than above: most are
 * animated, and a full-width loop over every row would pull attention off the
 * titles they are there to support. On a phone it shrinks to a chip beside the
 * date — enough to tell two rows apart at a glance, not enough to outrank the
 * title. Colour is held back until the row is hovered, because a full-colour
 * frame is the loudest thing on a monochrome screen.
 */
export function PostList({
  posts,
  startIndex = 0,
}: {
  posts: PostMeta[]
  startIndex?: number
}) {
  return (
    <ul className="flex flex-col border-t border-terminal-rule">
      {posts.map((post, index) => (
        <PostRow key={post.slug} post={post} index={startIndex + index} />
      ))}
    </ul>
  )
}

function PostRow({ post, index }: { post: PostMeta; index: number }) {
  return (
    <li className="border-b border-terminal-rule">
      <Link
        href={`/posts/${post.slug}`}
        className="group flex min-w-0 items-start gap-3 py-3 crt-persist hover:bg-terminal-wash focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:gap-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={postThumb(post.thumbnail, index)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{ aspectRatio: THUMB_ASPECT }}
          className="w-[4.5rem] shrink-0 border border-terminal-rule object-fill opacity-85 saturate-[0.85] transition-[opacity,filter] group-hover:opacity-100 group-hover:saturate-100 sm:w-32 lg:w-40"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Stacked on a phone, one line from sm up. Sharing a line only when
              the title happens to be short gave every row a different shape,
              and a listing is read down its left edge. */}
          <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3 sm:gap-y-1">
            <time
              dateTime={post.date}
              className="shrink-0 font-mono text-[0.7rem] text-terminal-chrome-dim tabular-nums"
            >
              {post.date}
            </time>
            <h3 className="line-clamp-2 min-w-0 font-sans text-sm text-foreground group-hover:text-primary group-hover:crt-glow-soft">
              {post.title}
            </h3>
          </div>

          {post.description ? (
            <p className="line-clamp-1 max-w-prose text-xs text-terminal-ink-dim sm:line-clamp-2">
              {post.description}
            </p>
          ) : null}

          {/* One line, always. Tags that do not fit are dropped rather than
              wrapped: an orphan chip under a row is what makes a listing look
              ragged, and the tag index on the front page is where tags are
              meant to be browsed anyway. */}
          <div className="flex min-w-0 flex-nowrap items-center gap-x-3 overflow-hidden font-mono text-[0.65rem] text-terminal-ink-faint">
            {post.readingTime ? (
              <span className="shrink-0">{post.readingTime}</span>
            ) : null}
            {post.series ? (
              <span className="shrink-0 truncate text-terminal-chrome-dim">
                {post.series.title} #{post.series.order}
              </span>
            ) : null}
            {post.tags.slice(0, 3).map((tag, position) => (
              <Badge
                key={tag}
                variant="outline"
                className={`shrink-0 font-mono ${position > 1 ? "hidden sm:inline-flex" : ""}`}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </Link>
    </li>
  )
}
