import type * as React from "react"
import Link from "next/link"

type SectionHeadingProps = {
  /** The path this section lists, e.g. `content/posts`. */
  path: string
  title: string
  action?: { label: string; href: string }
  children?: React.ReactNode
}

/**
 * A section break, drawn as a directory listing header.
 *
 * The eyebrow is the real path the section reads from rather than a decorative
 * label, so the structural device carries information: the reader can see that
 * "latest" below is `content/posts` and nothing else.
 */
export function SectionHeading({
  path,
  title,
  action,
  children,
}: SectionHeadingProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-terminal-rule pb-2">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim">
          {path}
        </span>
        <h2 className="flex items-center gap-2 font-sans text-lg leading-none font-bold tracking-[0.08em] text-primary uppercase crt-glow-soft">
          <span
            aria-hidden="true"
            className="font-mono text-[0.65em] leading-none tracking-normal"
          >
            [&gt;]
          </span>
          <span>{title}</span>
        </h2>
        {children}
      </div>

      {action ? (
        <Link
          href={action.href}
          className="shrink-0 font-mono text-[0.7rem] text-terminal-chrome hover:text-primary hover:crt-glow focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          {action.label} →
        </Link>
      ) : null}
    </header>
  )
}
