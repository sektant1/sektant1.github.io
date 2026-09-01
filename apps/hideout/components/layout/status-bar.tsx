import type * as React from "react"

import { ConsoleKeys } from "@/components/layout/console-keys"
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
    <footer className="z-10 flex h-7 shrink-0 items-center gap-2 overflow-hidden border-t bg-sidebar px-2 font-mono text-[0.65rem] tracking-wider text-terminal-ink-dim uppercase sm:gap-3 sm:px-3">
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

      {/* The key bank, on every width: these are the only controls the site
          has, and hiding them on a phone left the bar reporting without
          offering anything to press. The keys themselves drop the ones that
          make no sense there.

          flex-1, not shrink. `shrink` is the default, so it said nothing, and
          the strip was sized to its content and then squeezed by whatever the
          clock and the log toggle left over — on a phone that is narrower than
          the keys, so the last of them sat outside the viewport with the
          footer's overflow-hidden cutting them off rather than letting them
          scroll. Given the remaining space as its box, the strip scrolls inside
          it and every key stays reachable. */}
      <ConsoleKeys className="min-w-0 flex-1" />

      {/* Held back until there is room for the keys first: a half-cut key
          reads as a broken bar, a missing count reads as a quiet one. */}
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
