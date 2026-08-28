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
import {
  createPersistedPreference,
  oneOf,
} from "@workspace/ui/lib/persisted-preference"
import { usePersistedPreference } from "@workspace/ui/hooks/use-persisted-preference"

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

// Null rather than a face id, so "nothing chosen yet" stays distinguishable
// from "chose the same face the caller defaults to".
const storedFace = createPersistedPreference<FaceId | null>({
  key: FONT_STORAGE_KEY,
  fallback: null,
  parse: oneOf(FACES.map((option) => option.id)),
})

/**
 * Swaps the display face for the whole page.
 *
 * `--font-display` feeds `--font-sans`, so one property changes every heading
 * and label without touching the mono stack the body copy is set in.
 */
export function FontPicker({
  defaultFace = "Play",
  className,
}: {
  defaultFace?: FaceId
  /** Styles the trigger, so a host can dress it as its own chrome does. */
  className?: string
}) {
  const [stored, choose] = usePersistedPreference(storedFace)
  const face = stored ?? defaultFace

  React.useEffect(() => {
    document.documentElement.style.setProperty("--font-display", face)
  }, [face])

  return (
    <DropdownMenuTrigger>
      <TooltipTrigger>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Change display face"
          className={className}
        >
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
