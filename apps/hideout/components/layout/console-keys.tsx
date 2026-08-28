"use client"

import {
  CommandKey,
  CommandStrip,
  CommandStripDivider,
} from "@workspace/ui/components/command-strip"

import { REPLAY_BOOT_EVENT } from "@/components/layout/cold-boot"
import { PALETTE_EVENT } from "@/components/layout/command-palette"
import { TOGGLE_EVENT } from "@/components/layout/site-log"

/**
 * The labelled keys along the bottom edge, the way a terminal of this kind
 * carried them.
 *
 * Every key does something this page can actually do — there is no decorative
 * SCAN or PRIME here — and each is named for the thing it produces rather
 * than for the machinery behind it.
 */
export function ConsoleKeys({ className }: { className?: string }) {
  const scrollBufferToTop = () => {
    const buffer = document.querySelector<HTMLElement>('[data-slot="buffer"]')
    buffer?.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  }

  return (
    <CommandStrip className={className}>
      <CommandKey
        onClick={() => window.dispatchEvent(new Event(PALETTE_EVENT))}
        title="Search everything (ctrl+k)"
      >
        find
      </CommandKey>
      <CommandKey
        onClick={() => window.dispatchEvent(new Event(TOGGLE_EVENT))}
        title="Open the log panel (ctrl+`)"
      >
        log
      </CommandKey>

      <CommandStripDivider />

      <CommandKey onClick={scrollBufferToTop} title="Back to the top">
        top
      </CommandKey>
      <CommandKey
        onClick={() => window.dispatchEvent(new Event(REPLAY_BOOT_EVENT))}
        title="Run the boot sequence again"
      >
        boot
      </CommandKey>
      {/* Print is the one key with no use on a phone, so it is the one that
          gives up its space there. */}
      <CommandKey
        onClick={() => window.print()}
        title="Print this page"
        className="hidden lg:inline-flex"
      >
        print
      </CommandKey>
    </CommandStrip>
  )
}
