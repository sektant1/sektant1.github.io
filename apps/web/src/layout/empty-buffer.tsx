import * as React from "react"
import {
  AsciiSolid,
  type AsciiSolidShape,
} from "@workspace/ui/components/ascii-solid"
import { Kbd } from "@workspace/ui/components/kbd"

const SHAPES: AsciiSolidShape[] = ["sphere", "torus", "cube"]

const SHORTCUTS = [
  { keys: ["ctrl", "k"], label: "Go to anything" },
  { keys: ["ctrl", "b"], label: "Toggle the tree" },
  { keys: ["d"], label: "Cycle the theme" },
]

/**
 * Shown when every buffer is closed — the editor's start screen. The solid is
 * the one on the codex masthead, here as something to fiddle with: clicking
 * it cycles the shape, which is the only way to see the torus and the cube
 * without opening the component index.
 */
export function EmptyBuffer() {
  const [shapeIndex, setShapeIndex] = React.useState(0)
  const shape = SHAPES[shapeIndex]

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-8 p-6">
      <button
        type="button"
        onClick={() => setShapeIndex((index) => (index + 1) % SHAPES.length)}
        aria-label={`Rendering a ${shape}. Activate to change shape.`}
        className="w-full max-w-[18rem] cursor-pointer focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      >
        <AsciiSolid shape={shape} columns={56} />
      </button>

      <div className="flex flex-col items-center gap-3">
        <span className="font-mono text-[0.65rem] tracking-[0.3em] text-terminal-ink-faint uppercase">
          no open buffers
        </span>

        <dl className="flex flex-col gap-1.5">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.label}
              className="flex items-center justify-between gap-6 text-[0.72rem]"
            >
              <dt className="text-terminal-ink-dim">{shortcut.label}</dt>
              <dd className="flex shrink-0 items-center gap-1">
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
