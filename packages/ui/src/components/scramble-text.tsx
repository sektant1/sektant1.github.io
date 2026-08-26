"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"
import { usePrefersReducedMotion } from "@workspace/ui/hooks/use-reduced-motion"

const NOISE = "!<>-_\\/[]{}—=+*^?#________"

type ScrambleTextProps = Omit<React.ComponentProps<"span">, "children"> & {
  text: string
  /** Milliseconds per character resolved. */
  speed?: number
  /** Re-run whenever the pointer enters. */
  scrambleOnHover?: boolean
}

/**
 * Resolves text out of noise, one character at a time. The final string is
 * always in the DOM for assistive tech; only the visible layer scrambles.
 *
 * Under prefers-reduced-motion the text renders resolved immediately.
 */
function ScrambleText({
  text,
  speed = 28,
  scrambleOnHover = false,
  className,
  ...props
}: ScrambleTextProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [run, setRun] = React.useState(0)
  const [resolved, setResolved] = React.useState(0)

  // Reset during render when the run changes, rather than from an effect —
  // an effect would set state during commit and cascade a second render.
  const [seenRun, setSeenRun] = React.useState(run)
  if (seenRun !== run) {
    setSeenRun(run)
    setResolved(0)
  }

  React.useEffect(() => {
    if (reduceMotion) return

    const id = setInterval(() => {
      setResolved((current) => {
        if (current >= text.length) {
          clearInterval(id)
          return current
        }
        return current + 1
      })
    }, speed)

    return () => clearInterval(id)
  }, [text, speed, reduceMotion, run])

  const display = reduceMotion ? text : scramble(text, resolved)

  return (
    <span
      data-slot="scramble-text"
      className={cn("font-mono", className)}
      onPointerEnter={scrambleOnHover ? () => setRun((n) => n + 1) : undefined}
      {...props}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  )
}

function scramble(text: string, resolved: number) {
  let out = ""
  for (let i = 0; i < text.length; i++) {
    if (i < resolved || text[i] === " ") {
      out += text[i]
      continue
    }
    // Index by position and progress so neighbouring characters differ
    // without a random source, which would break server rendering.
    const seed = (i * 31 + resolved * 17) % NOISE.length
    out += NOISE[seed]
  }
  return out
}

export { ScrambleText }
