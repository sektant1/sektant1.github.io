import { cn } from "@workspace/ui/lib/utils"

export type Segment = {
  id: string
  label: string
  done: number
  total: number
  /**
   * "count" is for a row that is a quantity rather than a progress: keys to
   * carry are owned or not owned, and this app has no inventory to ask. Drawn
   * as unlit cells with the number beside them, so it never reads as nought
   * out of twelve done.
   */
  mode?: "progress" | "count"
}

/**
 * Measure in blocks: one cell per thing, lit when that thing is settled.
 *
 * A percentage tells you how far along you are; a row of cells tells you how
 * much is left, which is the question being asked here — five keys short is
 * a different raid from one key short, and "80%" is the same either way.
 *
 * Groups of more than the cell budget fall back to a proportional bar, so a
 * fifty-item find-in-raid list does not become a hairline mosaic.
 */
const MAX_CELLS = 24

function Cells({
  done,
  total,
  mode,
}: {
  done: number
  total: number
  mode: "progress" | "count"
}) {
  // An empty group still occupies its column. Collapsing it to the word
  // "none" pulled every value on that row out of line with the rows above.
  if (total === 0) {
    return (
      <span
        aria-hidden="true"
        className="h-px w-full self-center bg-terminal-rule/50"
      />
    )
  }

  if (total > MAX_CELLS) {
    const filled = done / total
    return (
      <span className="flex h-2 w-full border border-terminal-rule">
        <span
          className="bg-primary/80"
          style={{ width: `${filled * 100}%` }}
          aria-hidden="true"
        />
      </span>
    )
  }

  return (
    <span aria-hidden="true" className="flex w-full gap-0.5">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-2 flex-1",
            mode === "count"
              ? "border border-terminal-rule/70 bg-terminal-rule/20"
              : index < done
                ? "bg-primary crt-glow-soft"
                : "border border-terminal-rule bg-transparent"
          )}
        />
      ))}
    </span>
  )
}

export function SegmentTape({
  segments,
  className,
}: {
  segments: Segment[]
  className?: string
}) {
  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {segments.map((segment) => {
        const mode = segment.mode ?? "progress"
        const settled =
          mode === "progress" &&
          segment.total > 0 &&
          segment.done >= segment.total
        return (
          <li
            key={segment.id}
            className="grid grid-cols-[7.5rem_minmax(0,1fr)_3.5rem] items-center gap-x-3"
          >
            <span
              className={cn(
                "truncate font-mono text-[0.65rem] tracking-[0.14em] uppercase",
                settled ? "text-primary" : "text-terminal-chrome"
              )}
            >
              {segment.label}
            </span>
            <Cells done={segment.done} total={segment.total} mode={mode} />
            <span className="text-right font-mono text-[0.65rem] text-terminal-ink-dim tabular-nums">
              {segment.total === 0
                ? "—"
                : mode === "count"
                  ? segment.total
                  : `${segment.done} / ${segment.total}`}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
