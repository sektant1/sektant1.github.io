import type * as React from "react"

/**
 * The MDX elements that need no server work.
 *
 * They live apart from the element map so the CMS preview, which compiles in
 * the browser, renders a post with exactly the same components the published
 * page uses. The old CMS kept a second list and a component added to a post
 * could compile on the server and then throw in the preview.
 */

/**
 * Posts here illustrate with screen recordings, and some of those GIFs run to
 * tens of megabytes. Loading them lazily keeps a clip near the bottom of a
 * post from competing for bandwidth with everything above it.
 */
function LazyImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img loading="lazy" decoding="async" alt="" {...props} />
}

function YouTube({ id, title = "Embedded video" }: { id: string; title?: string }) {
  return (
    // nocookie: the embed is illustrating a post, and it does not need to set
    // a tracking cookie on a reader who never presses play.
    <iframe
      className="my-5 aspect-video w-full border border-border"
      src={`https://www.youtube-nocookie.com/embed/${id}`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}

function Video({ src, title }: { src: string; title?: string }) {
  return (
    <video
      className="my-5 w-full border border-border"
      src={src}
      title={title}
      controls
      playsInline
      preload="metadata"
    />
  )
}

/** An inline aside in the voice of a source comment. */
function Comment({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-terminal-ink-faint">
      {"// "}
      {children}
    </span>
  )
}

/** The end mark. A post finishes the way a file does. */
export function EndOfFile({ label = "EOF" }: { label?: string }) {
  return (
    <div
      aria-label="End of post"
      className="my-8 flex items-center gap-3 font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim"
    >
      <span aria-hidden="true" className="h-px flex-1 bg-terminal-rule" />
      {`// ${label} //`}
      <span aria-hidden="true" className="h-px flex-1 bg-terminal-rule" />
    </div>
  )
}

export const mdxElements = {
  img: LazyImage,
  YouTube,
  Video,
  C: Comment,
  EOF: EndOfFile,
}
