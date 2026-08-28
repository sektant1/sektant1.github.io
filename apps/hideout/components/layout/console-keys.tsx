"use client"

import * as React from "react"
import {
  CommandKey,
  CommandStrip,
  CommandStripDivider,
} from "@workspace/ui/components/command-strip"

import { REPLAY_BOOT_EVENT } from "@/components/layout/cold-boot"
import { PALETTE_EVENT } from "@/components/layout/command-palette"
import { TOGGLE_EVENT } from "@/components/layout/site-log"
import { crtScreenOn } from "@/lib/crt-screen"

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
      <CrtKey />
    </CommandStrip>
  )
}

/**
 * The CRT screen, on or off.
 *
 * One key for the whole treatment: the shadow mask, the raster, the refresh
 * band, the glass, and the phosphor bloom that every line of text on the site
 * is set in. Pressing it leaves the same page with nothing painted over it,
 * which is what a reader with a long post in front of them is asking for.
 *
 * The key is lit while the screen is on. It reports the state of the screen,
 * not what pressing it will do, the way a lit indicator on a console does.
 */
function CrtKey() {
  const on = React.useSyncExternalStore(
    crtScreenOn.subscribe,
    crtScreenOn.read,
    crtScreenOn.serverSnapshot
  )

  const toggle = () => {
    const next = !on
    document.documentElement.dataset.crt = next ? "on" : "off"
    crtScreenOn.write(next)
  }

  return (
    <CommandKey
      onClick={toggle}
      tone={on ? "active" : "default"}
      aria-pressed={on}
      title={on ? "Turn the CRT screen off" : "Turn the CRT screen on"}
    >
      crt
    </CommandKey>
  )
}
