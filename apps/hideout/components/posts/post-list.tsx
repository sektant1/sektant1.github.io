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
 * titles they are there to support.
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
          className="hidden w-32 shrink-0 border border-terminal-rule object-cover sm:block lg:w-40"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <time
              dateTime={post.date}
              className="shrink-0 font-mono text-[0.7rem] text-terminal-chrome-dim tabular-nums"
            >
              {post.date}
            </time>
            <h3 className="min-w-0 font-sans text-sm text-foreground group-hover:text-primary group-hover:crt-glow-soft">
              {post.title}
            </h3>
          </div>

          {post.description ? (
            <p className="line-clamp-2 max-w-prose text-xs text-terminal-ink-dim">
              {post.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.65rem] text-terminal-ink-faint">
            {post.readingTime ? <span>{post.readingTime}</span> : null}
            {post.series ? (
              <span className="text-terminal-chrome-dim">
                {post.series.title} #{post.series.order}
              </span>
            ) : null}
            {post.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="font-mono">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </Link>
    </li>
  )
}
