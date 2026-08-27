"use client"

import * as React from "react"
import { IconTypography } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"

/**
 * Bender is the face the identity was drawn against, so it leads. It has no
 * Cyrillic, which is why it is not the theme default — the rest of the list
 * carries a Cyrillic subset, so switching among them never silently drops
 * half the glyph set.
 */
const FACES = [
  { id: "Bender", label: "Bender", note: "the original" },
  { id: "Play", label: "Play", note: "geometric technical" },
  { id: "Jura", label: "Jura", note: "rounded technical" },
  { id: "Oswald", label: "Oswald", note: "condensed" },
  { id: "Chakra Petch", label: "Chakra Petch", note: "angular" },
] as const

type FaceId = (typeof FACES)[number]["id"]

export const FONT_STORAGE_KEY = "display-face"

/** Notifies every mounted picker when one of them writes a new choice. */
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function readStored(): string | null {
  // Private windows and blocked site data make this throw rather than return
  // null, so the read is guarded and the caller's default stands.
  try {
    return window.localStorage.getItem(FONT_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Swaps the display face for the whole page.
 *
 * `--font-display` feeds `--font-sans`, so one property changes every heading
 * and label without touching the mono stack the body copy is set in.
 *
 * The stored choice is read through useSyncExternalStore rather than in an
 * effect: localStorage does not exist on the server, and this is the API that
 * lets the server render the default and the client correct it during
 * hydration instead of after it, with no flash in between.
 */
export function FontPicker({ defaultFace = "Play" }: { defaultFace?: FaceId }) {
  const stored = React.useSyncExternalStore(
    subscribe,
    readStored,
    () => null // The server has no storage; it renders defaultFace.
  )

  const face: FaceId = FACES.some((option) => option.id === stored)
    ? (stored as FaceId)
    : defaultFace

  React.useEffect(() => {
    document.documentElement.style.setProperty("--font-display", face)
  }, [face])

  function choose(next: FaceId) {
    try {
      window.localStorage.setItem(FONT_STORAGE_KEY, next)
    } catch {
      // Not recallable, but the effect below still applies it to this page.
      document.documentElement.style.setProperty("--font-display", next)
    }
    // `storage` only fires in other tabs, so this tab is told directly.
    for (const listener of listeners) listener()
  }

  return (
    <DropdownMenuTrigger>
      <TooltipTrigger>
        <Button variant="ghost" size="icon-sm" aria-label="Change display face">
          <IconTypography />
        </Button>
        <Tooltip>Display face — {face}</Tooltip>
      </TooltipTrigger>

      <DropdownMenu>
        {FACES.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onAction={() => choose(option.id)}
            className="gap-3"
          >
            <span style={{ fontFamily: option.id }}>{option.label}</span>
            <span className="ms-auto font-mono text-[0.6rem] tracking-widest text-terminal-ink-faint uppercase">
              {face === option.id ? "active" : option.note}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
