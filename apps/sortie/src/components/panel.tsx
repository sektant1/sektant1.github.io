import type * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * A bordered section with signage across its top edge. The title is Cyrillic
 * caps because it is chrome; everything inside it is either a readout or a
 * control.
 */
export function Panel({
  title,
  srTitle,
  controls,
  className,
  children,
}: {
  title: string
  /** What the title says, for anyone who does not read Cyrillic. */
  srTitle: string
  controls?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col border border-terminal-rule bg-sidebar/40",
        className
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-terminal-rule px-3 py-2">
        <h2 className="font-sans text-xs font-bold tracking-[0.18em] text-primary uppercase crt-glow-soft">
          <span aria-hidden="true">{title}</span>
          <span className="sr-only">{srTitle}</span>
        </h2>
        {controls ? <div className="flex gap-1">{controls}</div> : null}
      </header>
      <div className="min-w-0 flex-1 p-3">{children}</div>
    </section>
  )
}
