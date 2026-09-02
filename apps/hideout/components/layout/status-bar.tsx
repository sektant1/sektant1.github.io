import type * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

import { LinkStatus } from "@/components/layout/link-status"
import { SiteLogToggle } from "@/components/layout/site-log"
import { ZuluClock } from "@/components/layout/zulu-clock"

export type StatusField = {
  label: string
  value: React.ReactNode
}

/**
 * The bar along the bottom of the screen.
 *
 * It reports the open buffer, so every field has to be a fact the page
 * actually knows — a post's reading time, a listing's count. Nothing here is
 * filler: an empty field is dropped rather than shown as a dash.
 */
export function StatusBar({
  fields = [],
  className,
}: {
  fields?: StatusField[]
  className?: string
}) {
  return (
    <footer
      className={cn(
        "z-10 flex h-7 shrink-0 items-center gap-2 overflow-hidden border-t bg-sidebar px-2 font-mono text-[0.65rem] tracking-wider text-terminal-ink-dim uppercase sm:gap-3 sm:px-3",
        className
      )}
    >
      {/* The mode block, inverted the way a modal editor inverts it. The site
          is read-only, and saying so is more honest than borrowing NORMAL. */}
      {/* Inverted and bracketed: a mode field on a readout, not a badge. */}
      {/* Dropped on a phone: it reports a mode the site never leaves, and the
          keys next to it are things the reader can actually press. */}
      <span className="hidden shrink-0 bg-primary px-1.5 py-0.5 font-medium text-primary-foreground sm:inline">
        [ read ]
      </span>

      {/* Errors and warnings first, as an editor puts them: the count is the
          reason to look, so it leads. */}
      <SiteLogToggle />

      {fields.map((field) => (
        <span key={field.label} className="hidden shrink-0 gap-1 lg:flex">
          <span className="text-terminal-ink-faint">{field.label}</span>
          <span className="text-terminal-ink">{field.value}</span>
        </span>
      ))}

      {/* The link field gives its room to the keys on a phone: the clock next
          to it already says the connection is live. */}
      <LinkStatus className="ms-auto hidden text-terminal-chrome-dim sm:flex" />
      {/* The clock gives its room to the keys on a phone. It reports the time,
          which the device already does in its own status bar a few pixels
          above; the keys are the only thing here a reader can press, and with
          six of them the strip needs every pixel it can get. */}
      <ZuluClock className="ms-auto hidden shrink-0 text-terminal-chrome-dim min-[26rem]:block sm:ms-0" />
      <span className="hidden shrink-0 text-terminal-chrome-dim sm:inline">
        utf-8
      </span>
    </footer>
  )
}
