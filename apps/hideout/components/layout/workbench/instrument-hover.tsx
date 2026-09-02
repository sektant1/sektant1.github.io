"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import {
  Visor,
  VisorPlate,
  MODEL_LABEL,
} from "@/components/layout/workbench/visor"
import { useInstrument } from "@/components/layout/workbench/use-instrument"

/**
 * The instrument, brought up under the pointer.
 *
 * Hovering the station's mark opens a small panel with the object turning in
 * it — the same renderer the dock and the archive panel can hold, borrowed for
 * as long as the pointer stays. It is the one flourish on the site that costs
 * a WebGL context, so it is gated hard:
 *
 *   a fine pointer that can hover at all,
 *   a screen wide enough for the panel not to cover the thing it belongs to,
 *   the glass switched on, motion not held,
 *   and a beat of hover, so crossing the mark on the way somewhere else does
 *   not start a renderer the reader never asked for.
 *
 * It also has the lowest standing of the three surfaces that can claim the
 * viewer: a glance should never take the instrument away from a panel the
 * reader deliberately opened.
 */

/** Long enough to mean it, short enough not to feel broken. */
const INTENT_MS = 260

/** How far the card sits from the thing it belongs to. */
const CARD_GAP = 8
const CARD_WIDTH = 176

export function InstrumentHover({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const trigger = React.useRef<HTMLSpanElement>(null)
  const [hovering, setHovering] = React.useState(false)
  // Where the card goes, measured from the trigger when it arms.
  //
  // The card is fixed *and* portalled to the body, which is two escapes for
  // two different traps: the panel around a slot clips its overflow, and the
  // slot itself lifts on hover — a transform, which makes it the containing
  // block for any fixed descendant and pins the card back inside the box it
  // was trying to leave.
  const [at, setAt] = React.useState<{ left: number; top: number } | null>(null)
  const allowed = useHoverAllowed()

  // The effect only ever arms the preview; the pointer leaving disarms it, in
  // the handler that already knows it happened. A reset from in here would be
  // a synchronous setState in an effect — a second render for a state the
  // event had in its hand.
  React.useEffect(() => {
    if (!hovering || !allowed) return

    const timer = setTimeout(() => {
      const rect = trigger.current?.getBoundingClientRect()
      if (!rect) return

      // Beside the trigger, or on its other side when there is no room —
      // this panel lives against the left edge, but the same component hung
      // on something at the right edge should not run off the glass.
      const right = rect.right + CARD_GAP
      const fits = right + CARD_WIDTH < window.innerWidth
      setAt({
        left: fits
          ? right
          : Math.max(CARD_GAP, rect.left - CARD_GAP - CARD_WIDTH),
        top: rect.top,
      })
    }, INTENT_MS)

    return () => clearTimeout(timer)
  }, [hovering, allowed])

  return (
    <span
      ref={trigger}
      className={className}
      // Pointer events, not mouse: a pen hovers, and a touch does not — which
      // is exactly the distinction this needs.
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse" || event.pointerType === "pen") {
          setHovering(true)
        }
      }}
      onPointerLeave={() => {
        setHovering(false)
        setAt(null)
      }}
    >
      {children}
      {at && hovering && allowed
        ? createPortal(<InstrumentCard at={at} />, document.body)
        : null}
    </span>
  )
}

function InstrumentCard({ at }: { at: { left: number; top: number } }) {
  const busy = useInstrument("hover")

  return (
    <span
      aria-hidden="true"
      style={{ left: at.left, top: at.top, width: CARD_WIDTH }}
      className="instrument-card fixed z-50 flex flex-col gap-2 border border-terminal-edge bg-background p-2 shadow-lg"
    >
      <span className="block">
        {busy ? <VisorPlate reason={busy} /> : <Visor resolution={0.22} />}
      </span>

      {/* Real values or nothing: the model this draws and the grid it draws it
          on. A panel of invented telemetry would make the whole thing a
          screensaver. */}
      <span className="flex items-center justify-between font-mono text-[0.55rem] tracking-[0.15em] text-terminal-chrome-dim uppercase">
        <span>объект</span>
        <span className="text-terminal-ink-dim">{MODEL_LABEL}</span>
      </span>
    </span>
  )
}

/**
 * Whether a preview is worth starting on this device, right now.
 *
 * All four questions are asked of the platform rather than of a breakpoint
 * class, because the answer decides whether a renderer starts — and a class
 * that hides an element still pays for everything inside it.
 */
function useHoverAllowed() {
  const query =
    "(hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)"

  const capable = React.useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )

  // The glass being off is a statement about motion, and this is motion.
  const glassOn = React.useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-crt"],
      })
      return () => observer.disconnect()
    },
    () => document.documentElement.dataset.crt !== "off",
    () => true
  )

  return capable && glassOn
}
