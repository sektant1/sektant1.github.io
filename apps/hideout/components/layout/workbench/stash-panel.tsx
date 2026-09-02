"use client"

import { cn } from "@workspace/ui/lib/utils"

import { InstrumentHover } from "@/components/layout/workbench/instrument-hover"
import { useCrtScreen, useTube } from "@/lib/console-controls"
import { fire } from "@/lib/navigation"
import { pad } from "@/lib/format"

/**
 * The stash: what this station is carrying, laid out on a grid of slots.
 *
 * A toy, and the site says so — `CONTEXT.md` allows console toys a reader can
 * find, as long as they are not the thing a screenshot shows. What keeps it
 * from being a screensaver is that every slot holds something the build
 * actually ships: the GLB the viewer draws, the two faces the page is set in,
 * the coating on the tube, the glass over it, and the count of documents in
 * the archive. Nothing here is invented loot.
 *
 * Slots that do something do it — the coating and the glass are the same two
 * switches the status bar carries, because they are objects in the rack as
 * much as they are keys on a console. Slots that are only cargo say what they
 * are and light up when you point at them.
 */

type Slot = {
  id: string
  /** Cyrillic, like every other piece of signage. */
  label: string
  /** What it actually is, in the reader's own voice. */
  detail: string
  /** How many cells wide and tall, on a four-column grid. */
  span?: string
  action?: () => void
  /** Lit slots are switched on, not selected. */
  lit?: boolean
  hint?: string
}

export function StashPanel({
  /** Everything the archive holds. A real count, from the build. */
  objects,
  className,
}: {
  objects: number
  className?: string
}) {
  const [glass, toggleGlass] = useCrtScreen()
  const [coating, toggleCoating] = useTube()

  const slots: Slot[] = [
    {
      id: "model",
      label: "МОДЕЛЬ",
      detail: "bitcoin.glb",
      span: "col-span-2 row-span-2",
      hint: "The object the viewer draws",
    },
    {
      id: "glass",
      label: "СТЕКЛО",
      detail: glass ? "on" : "off",
      lit: glass,
      action: toggleGlass,
      hint: "The CRT treatment over the whole page",
    },
    {
      id: "coating",
      label: coating === "amber" ? "P3" : "P1",
      detail: coating,
      lit: coating === "amber",
      action: toggleCoating,
      hint: "Which phosphor the tube is coated with",
    },
    {
      id: "display-face",
      label: "ШРИФТ",
      detail: "bender",
      span: "col-span-2",
      hint: "The display face this site is set in",
    },
    {
      id: "body-face",
      label: "ШРИФТ",
      detail: "plex mono",
      span: "col-span-2",
      hint: "The face the prose is set in",
    },
    {
      id: "archive",
      label: "АРХИВ",
      detail: `${pad(objects)} obj`,
      span: "col-span-2",
      hint: "Documents in the archive",
    },
    {
      id: "boot",
      label: "ЗАПУСК",
      detail: "post",
      span: "col-span-2",
      action: () => fire("boot"),
      hint: "Run the boot sequence again",
    },
  ]

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* Fixed rows rather than square cells: a slot spanning two rows has
          to be exactly two cells plus the gap, and auto rows size themselves
          to their content instead. */}
      <div className="stash-grid grid [grid-auto-rows:3.5rem] grid-cols-4 gap-1 p-2">
        {slots.map((slot) => (
          <StashSlot key={slot.id} slot={slot} />
        ))}

        {/* The empty rack. Slots the station has room for and is not using —
            the part of a stash that makes the full ones read as full. */}
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={`empty-${index}`}
            aria-hidden="true"
            className="stash-slot-empty border border-dashed border-terminal-rule/60"
          />
        ))}
      </div>

      <p className="mt-auto border-t border-sidebar-border px-3 py-2 font-mono text-[0.6rem] text-terminal-ink-faint lowercase">
        what the station is carrying. two of these are switches.
      </p>
    </div>
  )
}

function StashSlot({ slot }: { slot: Slot }) {
  const body = (
    <span className="flex h-full w-full flex-col justify-between p-1.5 text-start">
      <span
        className={cn(
          "font-mono text-[0.58rem] tracking-[0.12em] uppercase",
          slot.lit ? "text-primary" : "text-terminal-chrome-dim"
        )}
      >
        {slot.label}
      </span>
      <span className="truncate font-mono text-[0.58rem] text-terminal-ink-dim lowercase">
        {slot.detail}
      </span>
    </span>
  )

  const className = cn(
    "stash-slot relative flex border crt-persist",
    slot.span,
    slot.lit
      ? "border-primary bg-terminal-wash/40 crt-glow-soft"
      : "border-terminal-rule bg-terminal-wash/20 hover:border-terminal-edge"
  )

  if (slot.id === "model") {
    // The one slot that carries a renderer: hovering it brings the object up
    // under the pointer, which is the whole reason a stash is worth drawing.
    return (
      <InstrumentHover className={cn(className, "block")}>
        {body}
      </InstrumentHover>
    )
  }

  if (!slot.action) {
    return (
      <span className={className} title={slot.hint}>
        {body}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={slot.action}
      title={slot.hint}
      aria-pressed={slot.lit}
      className={cn(
        className,
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      )}
    >
      {body}
    </button>
  )
}
