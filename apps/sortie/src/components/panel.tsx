import type * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * A bordered section with signage across its top edge, set in Bender.
 *
 * The station's own chrome is Cyrillic; this app's is not. Every heading here
 * is a word the reader has to act on — what to pack, what to find, who to
 * turn a task in to — and a label nobody can read is decoration wearing a
 * heading's clothes.
 */
/**
 * `tone` is the hierarchy. Every panel used to carry the same border and the
 * same heading weight, so a screen of eight of them asked the reader to work
 * out for themselves which one to look at first. Exactly one panel per screen
 * is `lead`.
 */
export function Panel({
  title,
  tone = "default",
  controls,
  className,
  children,
}: {
  title: string
  tone?: "lead" | "default" | "quiet"
  controls?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col border",
        tone === "lead" && "border-primary/50 bg-sidebar/70",
        tone === "default" && "border-terminal-rule bg-sidebar/40",
        tone === "quiet" && "border-terminal-rule/50 bg-transparent",
        className
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-2 border-b px-3 py-2",
          tone === "lead" ? "border-primary/40" : "border-terminal-rule"
        )}
      >
        <h2
          className={cn(
            "font-sans font-bold uppercase",
            tone === "lead"
              ? "text-sm tracking-[0.2em] text-primary crt-glow"
              : "text-xs tracking-[0.18em] crt-glow-soft",
            tone === "quiet" ? "text-terminal-chrome" : "text-primary"
          )}
        >
          {title}
        </h2>
        {controls ? <div className="flex gap-1">{controls}</div> : null}
      </header>
      <div className="min-w-0 flex-1 p-3">{children}</div>
    </section>
  )
}
