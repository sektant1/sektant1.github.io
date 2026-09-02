"use client"

import {
  CommandKey,
  CommandStrip,
  CommandStripDivider,
} from "@workspace/ui/components/command-strip"

import { fire } from "@/lib/navigation"
import { useCrtScreen, useTube } from "@/lib/console-controls"

/**
 * The labelled keys along the bottom edge, the way a terminal of this kind
 * carried them.
 *
 * Every key does something this page can actually do — there is no decorative
 * SCAN or PRIME here — and each is named for the thing it produces rather
 * than for the machinery behind it.
 *
 * What it does not carry is a second way to do something already offered a
 * few pixels away, which is why it is down to the phone's sheet: on a wide
 * screen the console panel carries these same three, and two banks for one set
 * of switches is how they end up disagreeing about which is lit.
 */
export function ConsoleKeys({ className }: { className?: string }) {
  return (
    <CommandStrip className={className}>
      <CommandKey
        onClick={() => fire("boot")}
        title="Run the boot sequence again"
      >
        boot
      </CommandKey>

      <CommandStripDivider />
      <CrtKey />
      <TubeKey />
    </CommandStrip>
  )
}

/**
 * Which phosphor the screen is coated with.
 *
 * Green and amber are the two coatings these terminals shipped with, so this
 * swaps one real screen for another rather than tinting the page. The key is
 * lit on amber because that is the state worth reporting — green is the
 * identity, and a console does not light a lamp to tell you it is normal.
 */
function TubeKey() {
  const [current, toggle] = useTube()
  const amber = current === "amber"

  return (
    <CommandKey
      onClick={toggle}
      tone={amber ? "active" : "default"}
      aria-pressed={amber}
      title={amber ? "Back to the green tube" : "Switch to the amber tube"}
    >
      {amber ? "amber" : "green"}
    </CommandKey>
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
  const [on, toggle] = useCrtScreen()

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
