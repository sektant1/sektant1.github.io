import * as React from "react"
import { IconTypography } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"

import { readLocal, writeLocal } from "@/lib/use-local-state"

/**
 * Every face here carries a Cyrillic subset, so switching does not silently
 * drop half the glyph set — the whole point of offering the choice.
 */
const FACES = [
  { id: "Play", label: "Play", note: "geometric technical" },
  { id: "Jura", label: "Jura", note: "rounded technical" },
  { id: "Oswald", label: "Oswald", note: "condensed" },
  { id: "Chakra Petch", label: "Chakra Petch", note: "angular" },
] as const

type FaceId = (typeof FACES)[number]["id"]

const STORAGE_KEY = "display-face"

export function FontPicker() {
  const [face, setFace] = React.useState<FaceId>(() =>
    readLocal<FaceId>(STORAGE_KEY, "Play")
  )

  React.useEffect(() => {
    // --font-display feeds --font-sans, so one property swaps the whole
    // display face without touching the mono stack.
    document.documentElement.style.setProperty("--font-display", face)
  }, [face])

  function choose(next: FaceId) {
    setFace(next)
    writeLocal(STORAGE_KEY, next)
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
