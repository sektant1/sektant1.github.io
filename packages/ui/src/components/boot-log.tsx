"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { usePrefersReducedMotion } from "@workspace/ui/hooks/use-reduced-motion"

export type BootLine = {
  label: string
  status?: "ok" | "warn" | "fail" | "skip"
  detail?: string
}

const STATUS_TEXT: Record<NonNullable<BootLine["status"]>, string> = {
  ok: "  OK  ",
  warn: " WARN ",
  fail: " FAIL ",
  skip: " SKIP ",
}

const STATUS_CLASS: Record<NonNullable<BootLine["status"]>, string> = {
  ok: "text-primary crt-glow-soft",
  warn: "text-terminal-ink",
  fail: "text-destructive",
  skip: "text-terminal-ink-dim",
}

type BootLogProps = Omit<React.ComponentProps<"div">, "children"> & {
  lines: BootLine[]
  /** Milliseconds between lines. */
  interval?: number
  /** Lines revealed together on each interval. */
  batchSize?: number
  /** Keep only this many latest lines visible. */
  windowSize?: number
  /** Keep a blinking block after the last line. */
  cursor?: boolean
}

/**
 * Prints lines one at a time, like a POST sequence. All lines are present for
 * assistive tech from the first render; only the visual reveal is staged, and
 * prefers-reduced-motion shows the whole log at once.
 */
function BootLog({
  lines,
  interval = 140,
  batchSize = 1,
  windowSize,
  cursor = true,
  className,
  ...props
}: BootLogProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [shown, setShown] = React.useState(0)
  // Derived rather than stored, so no effect writes state during commit.
  const visible = reduceMotion ? lines.length : shown
  const firstVisible = windowSize
    ? Math.max(0, visible - Math.max(1, windowSize))
    : 0
  const visibleLines = lines.slice(firstVisible, visible)

  // Reset during render when the log changes, rather than from an effect.
  const [seenLines, setSeenLines] = React.useState(lines)
  if (seenLines !== lines) {
    setSeenLines(lines)
    setShown(0)
  }

  React.useEffect(() => {
    if (reduceMotion) return

    const startedAt = performance.now()
    const pace = Math.max(1, interval)
    const batch = Math.max(1, Math.floor(batchSize))
    let id: ReturnType<typeof setTimeout>

    const tick = () => {
      const elapsed = performance.now() - startedAt
      const completedBatches = Math.floor(elapsed / pace)
      const next = Math.min(lines.length, completedBatches * batch)
      setShown(next)

      if (next < lines.length) {
        id = setTimeout(
          tick,
          Math.max(0, (completedBatches + 1) * pace - elapsed)
        )
      }
    }

    id = setTimeout(tick, pace)

    return () => clearTimeout(id)
  }, [lines, interval, batchSize, reduceMotion])

  return (
    <div
      data-slot="boot-log"
      className={cn("font-mono text-[0.72rem] leading-relaxed", className)}
      {...props}
    >
      <span className="sr-only">
        {lines.map((line) => `${line.label} ${line.status ?? ""}`).join(". ")}
      </span>

      <div aria-hidden="true" className="flex flex-col">
        {visibleLines.map((line, index) => (
          <div
            key={`${line.label}-${firstVisible + index}`}
            className="flex gap-2"
          >
            <span className="shrink-0 text-terminal-chrome">
              [{line.status ? STATUS_TEXT[line.status] : "······"}]
            </span>
            <span
              className={cn(
                "min-w-0 truncate",
                line.status ? STATUS_CLASS[line.status] : "text-foreground"
              )}
            >
              {line.label}
            </span>
            {line.detail ? (
              <span className="ms-auto hidden shrink-0 text-muted-foreground sm:inline">
                {line.detail}
              </span>
            ) : null}
          </div>
        ))}

        {cursor && visible >= lines.length ? (
          <span className="text-primary crt-glow motion-safe:animate-pulse">
            _
          </span>
        ) : null}
      </div>
    </div>
  )
}

export { BootLog }
