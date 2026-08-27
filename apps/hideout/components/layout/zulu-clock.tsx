"use client"

import * as React from "react"

/**
 * The time in UTC, ticking, in the corner of the status bar.
 *
 * Every field readout carries one, and it is the one number on this screen
 * that is true regardless of where the reader is — which is the point of
 * quoting Zulu rather than local time.
 *
 * Rendered empty on the server: the clock cannot agree across a hydration
 * boundary, and a wrong second in the markup is worse than a late one.
 */
export function ZuluClock({ className }: { className?: string }) {
  const [now, setNow] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Aligned to the wall clock rather than ticking every 1000ms from mount,
    // so it does not drift a fraction of a second off every real second.
    let timer: number

    const tick = () => {
      const date = new Date()
      setNow(date.toISOString().slice(11, 19).replace(/:/g, ""))
      timer = window.setTimeout(tick, 1000 - (date.getTime() % 1000))
    }

    tick()
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <span className={className}>
      <span className="tabular-nums">{now ?? "------"}</span>Z
    </span>
  )
}
