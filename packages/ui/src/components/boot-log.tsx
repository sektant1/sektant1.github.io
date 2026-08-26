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
  warn: "text-foreground/90",
  fail: "text-destructive",
  skip: "text-foreground/60",
}

type BootLogProps = Omit<React.ComponentProps<"div">, "children"> & {
  lines: BootLine[]
  /** Milliseconds between lines. */
  interval?: number
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
  cursor = true,
  className,
  ...props
}: BootLogProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [shown, setShown] = React.useState(0)
  // Derived rather than stored, so no effect writes state during commit.
  const visible = reduceMotion ? lines.length : shown

  // Reset during render when the log changes, rather than from an effect.
  const [seenLines, setSeenLines] = React.useState(lines)
  if (seenLines !== lines) {
    setSeenLines(lines)
    setShown(0)
  }

  React.useEffect(() => {
    if (reduceMotion) return

    const id = setInterval(() => {
      setShown((current) => {
        if (current >= lines.length) {
          clearInterval(id)
          return current
        }
        return current + 1
      })
    }, interval)

    return () => clearInterval(id)
  }, [lines, interval, reduceMotion])

  return (
    <div
      data-slot="boot-log"
      className={cn("font-mono text-[11px] leading-relaxed", className)}
      {...props}
    >
      <span className="sr-only">
        {lines.map((line) => `${line.label} ${line.status ?? ""}`).join(". ")}
      </span>

      <div aria-hidden="true" className="flex flex-col">
        {lines.slice(0, visible).map((line, index) => (
          <div key={`${line.label}-${index}`} className="flex gap-2">
            <span className="shrink-0 text-primary/80">
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
