"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type Status = "online" | "standby" | "fault"

const STATUS_CLASS: Record<Status, string> = {
  online: "bg-primary shadow-[0_0_6px_var(--primary)]",
  standby: "bg-muted-foreground",
  fault: "bg-destructive motion-safe:animate-pulse",
}

type TerminalFrameProps = React.ComponentProps<"section"> & {
  /** Shown in the top rule, military-readout style. */
  title: string
  /** Shown in the bottom rule. Use for a path, revision, or count. */
  footer?: string
  status?: Status
}

/**
 * A bordered panel dressed as a terminal readout: a bracketed title cut into
 * the top rule, a status lamp, and an optional footer stamp.
 */
function TerminalFrame({
  title,
  footer,
  status = "online",
  className,
  children,
  ...props
}: TerminalFrameProps) {
  return (
    <section
      data-slot="terminal-frame"
      data-status={status}
      className={cn("relative border border-border", className)}
      {...props}
    >
      {/* A fault gets hazard banding across the top edge, so the state is
          legible from across the room rather than only at the lamp. */}
      {status === "fault" ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[3px] hazard-stripe"
        />
      ) : null}

      <div className="flex items-center gap-2 border-b border-border px-2 py-1">
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0", STATUS_CLASS[status])}
        />
        <span className="truncate font-mono text-[0.65rem] tracking-widest text-primary uppercase crt-glow-soft">
          [ {title} ]
        </span>
        <span
          aria-hidden="true"
          className="ms-auto hidden h-px flex-1 border-t border-border sm:block"
        />
        <span className="hidden shrink-0 font-mono text-[0.65rem] tracking-widest text-terminal-chrome uppercase sm:inline">
          {status}
        </span>
      </div>

      <div className="min-w-0">{children}</div>

      {footer ? (
        <div className="truncate border-t border-border px-2 py-1 font-mono text-[0.65rem] tracking-wider text-terminal-chrome uppercase">
          {footer}
        </div>
      ) : null}
    </section>
  )
}

export { TerminalFrame }
