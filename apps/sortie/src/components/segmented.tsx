import type * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

export type SegmentedOption<T extends string> = {
  value: T
  label: React.ReactNode
  /** A count, a portrait — anything that trails the label. */
  trailing?: React.ReactNode
  leading?: React.ReactNode
  title?: string
}

/**
 * One control, several positions — a rotary switch, not a row of loose keys.
 *
 * A screen of identical bordered boxes cannot say which of them are a set and
 * which are independent. Sharing one border and dividing it internally says
 * "pick one of these" before a single label is read, and it costs the row
 * about a third of its ink.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "default",
  className,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Names the group for assistive tech; not drawn. */
  label: string
  size?: "default" | "compact"
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex min-w-0 divide-x divide-terminal-rule border border-terminal-rule",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-w-0 items-center gap-1.5 font-mono tracking-[0.12em] uppercase transition-colors",
              "focus-visible:ring-1 focus-visible:ring-ring focus-visible:-outline-offset-1 focus-visible:outline-none",
              size === "compact"
                ? "min-h-9 px-2 text-[0.65rem] md:min-h-8"
                : "min-h-11 px-3 text-[0.7rem] md:min-h-9",
              active
                ? "bg-primary/15 text-primary crt-glow-soft"
                : "text-terminal-chrome hover:bg-primary/5 hover:text-primary"
            )}
          >
            {option.leading}
            <span className="truncate">{option.label}</span>
            {option.trailing ? (
              <span
                className={cn(
                  "tabular-nums",
                  active ? "text-primary" : "text-terminal-chrome-dim"
                )}
              >
                {option.trailing}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A single switch that is on or off, drawn to match the segmented group so a
 * row of controls reads as one instrument rather than as a pile.
 */
export function Toggle({
  active,
  onClick,
  title,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      title={title}
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center gap-1.5 border px-3 font-mono text-[0.7rem] tracking-[0.12em] uppercase transition-colors md:min-h-9",
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? "border-primary/60 bg-primary/15 text-primary crt-glow-soft"
          : "border-terminal-rule text-terminal-chrome hover:border-primary/40 hover:text-primary",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5",
          active ? "bg-primary" : "border border-terminal-rule bg-transparent"
        )}
      />
      {children}
    </button>
  )
}
