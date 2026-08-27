import type * as React from "react"

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
export function StatusBar({ fields = [] }: { fields?: StatusField[] }) {
  return (
    <footer className="z-10 flex h-6 shrink-0 items-center gap-3 overflow-hidden border-t bg-sidebar px-3 font-mono text-[0.65rem] tracking-wider text-terminal-ink-dim uppercase">
      {/* The mode block, inverted the way a modal editor inverts it. The site
          is read-only, and saying so is more honest than borrowing NORMAL. */}
      {/* Inverted and bracketed: a mode field on a readout, not a badge. */}
      <span className="shrink-0 bg-primary px-1.5 py-0.5 font-medium text-primary-foreground">
        [ read ]
      </span>

      {/* Errors and warnings first, as an editor puts them: the count is the
          reason to look, so it leads. */}
      <SiteLogToggle />

      {fields.map((field) => (
        <span key={field.label} className="hidden shrink-0 gap-1 sm:flex">
          <span className="text-terminal-ink-faint">{field.label}</span>
          <span className="text-terminal-ink">{field.value}</span>
        </span>
      ))}

      <LinkStatus className="ms-auto text-terminal-chrome-dim" />
      <ZuluClock className="shrink-0 text-terminal-chrome-dim" />
      <span className="hidden shrink-0 text-terminal-chrome-dim sm:inline">
        utf-8
      </span>
    </footer>
  )
}
