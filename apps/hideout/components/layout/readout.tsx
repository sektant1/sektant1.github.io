import type * as React from "react"

/**
 * One line of a terminal summary: a label, a dotted leader, a value.
 *
 * The leader is a dotted rule that flexes, not a run of typed periods — so it
 * lands on the same right edge for every row and never wraps to its own line
 * when the label is long.
 */
export function Readout({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-baseline gap-1.5 font-mono text-[0.7rem] tracking-[0.08em] uppercase">
      <dt className="shrink-0 text-terminal-ink-dim">{label}</dt>
      <span
        aria-hidden="true"
        className="min-w-4 flex-1 translate-y-[-0.2em] border-b border-dotted border-terminal-rule"
      />
      <dd className="shrink-0 text-primary crt-glow-soft">{value}</dd>
    </div>
  )
}
