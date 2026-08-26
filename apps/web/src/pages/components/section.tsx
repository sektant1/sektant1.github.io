import type * as React from "react"

/**
 * A component's entry on the verification index. The key is the registry item
 * name, so the index can be diffed against registry.json.
 */
export type SectionMap = Record<string, () => React.ReactNode>

/** One labelled row of variants inside a section. */
export function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-16 shrink-0 font-mono text-[0.65rem] tracking-widest text-foreground/40 uppercase">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  )
}
