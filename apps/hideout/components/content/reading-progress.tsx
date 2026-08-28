"use client"

import * as React from "react"
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@workspace/ui/components/progress"

/**
 * How far through the post you are, as a rule under the header.
 *
 * Posts here run long — the Neovim one is a full config walkthrough — and the
 * shell scrolls its buffer rather than the page, so the browser's own
 * scrollbar is a thin line inside a panel and reads as nothing. This is the
 * one piece of chrome that answers "how much is left".
 *
 * Shown only where it can answer that: a page that does not scroll renders no
 * rule at all rather than a full or empty bar.
 */
export function ReadingProgress() {
  const [progress, setProgress] = React.useState<number | null>(null)

  React.useEffect(() => {
    const buffer = document.querySelector<HTMLElement>('[data-slot="buffer"]')
    if (!buffer) return

    let frame: number | null = null

    const measure = () => {
      frame = null
      const scrollable = buffer.scrollHeight - buffer.clientHeight
      // A page shorter than the viewport has no progress to report.
      if (scrollable < 200) {
        setProgress(null)
        return
      }
      setProgress(Math.min(100, (buffer.scrollTop / scrollable) * 100))
    }

    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure)
    }

    measure()
    buffer.addEventListener("scroll", schedule, { passive: true })
    // Images and embeds land after first paint and change the height, so the
    // denominator has to be re-measured rather than read once.
    const resize = new ResizeObserver(schedule)
    resize.observe(buffer)
    if (buffer.firstElementChild) resize.observe(buffer.firstElementChild)

    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      buffer.removeEventListener("scroll", schedule)
      resize.disconnect()
    }
  }, [])

  if (progress === null) return null

  return (
    <Progress
      aria-label="Reading progress"
      value={progress}
      className="pointer-events-none z-10 shrink-0"
    >
      <ProgressTrack className="h-px bg-terminal-rule">
        <ProgressIndicator className="bg-primary crt-glow-soft" />
      </ProgressTrack>
    </Progress>
  )
}
