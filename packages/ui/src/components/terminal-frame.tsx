"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type Status = "online" | "standby" | "fault"

const STATUS_CLASS: Record<Status, string> = {
  online: "bg-primary shadow-[0_0_6px_var(--primary)]",
  standby: "bg-muted-foreground",
  fault: "bg-destructive motion-safe:animate-pulse",
}

/* The lamp says the state at the top of the panel; the edge says it down the
   whole side, which is what makes a column of panels scannable without
   reading a word. Standby drops to the border colour rather than going dark —
   an unlit edge would read as a panel that lost its frame. */
const STATUS_EDGE: Record<Status, string> = {
  online: "[--crt-edge-color:var(--primary)]",
  standby: "[--crt-edge-color:var(--border)]",
  fault: "[--crt-edge-color:var(--destructive)]",
}

type TerminalFrameProps = React.ComponentProps<"section"> & {
  /** Shown in the top rule, military-readout style. */
  title: string
  /** Shown in the bottom rule. Use for a path, revision, or count. */
  footer?: string
  status?: Status
  /**
   * Right-hand end of the title rule: a file number, a channel, a mode. The
   * status word is dropped when one is given, since the lamp already says it
   * and two readouts fighting for the same corner is what makes a panel look
   * decorative rather than instrumented.
   */
  stamp?: React.ReactNode
  /** Right-hand end of the bottom rule, opposite `footer`. */
  footerStamp?: React.ReactNode
  /** Draws the scroll rail down the inside edge. Decorative. */
  rail?: boolean
  /** Removes the padding-free default so short panels can breathe. */
  bodyClassName?: string
}

/**
 * A bordered panel dressed as a terminal readout: a bracketed title cut into
 * the top rule, a status lamp, and an optional footer stamp.
 *
 * The optional chrome — a scroll rail, a stamp at each end of the rules — is
 * what a windowed console of this era actually carried, and it is what makes
 * a stack of panels read as one instrument rather than as cards with borders.
 *
 * The four boxed `x` marks that used to sit in the corners are gone. They
 * were drawn over the rules rather than in them, so each one covered whatever
 * the corner already held — the stamp on the right, the footer label on the
 * left — and the panel is denser without them anyway.
 */
function TerminalFrame({
  title,
  footer,
  status = "online",
  stamp,
  footerStamp,
  rail = false,
  className,
  bodyClassName,
  children,
  ...props
}: TerminalFrameProps) {
  return (
    <section
      data-slot="terminal-frame"
      data-status={status}
      className={cn(
        "crt-edge relative flex flex-col border border-border",
        STATUS_EDGE[status],
        className
      )}
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

      {/* The title rule is a plate, not a line of text on the body: a wash
          behind it separates the panel's label from its contents at a glance,
          which is what stops a stack of frames reading as one long list. */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-terminal-wash py-1 ps-3 pe-2">
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
          {stamp ?? status}
        </span>
      </div>

      <div className={cn("relative min-w-0 flex-1", bodyClassName)}>
        {children}
        {rail ? <ScrollRail /> : null}
      </div>

      {footer || footerStamp ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-border px-2 py-1 font-mono text-[0.65rem] tracking-wider text-terminal-chrome uppercase">
          <span className="truncate">{footer}</span>
          {footerStamp ? (
            <span className="ms-auto shrink-0">{footerStamp}</span>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

/** The scroll gutter, arrows and all. Reads as depth; controls nothing. */
function ScrollRail() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 end-0 flex w-3 flex-col items-center justify-between border-s border-border py-0.5 font-mono text-[0.5rem] text-terminal-chrome-dim"
    >
      <span>▲</span>
      <span className="my-auto h-6 w-1.5 bg-terminal-rule" />
      <span>▼</span>
    </span>
  )
}

export { TerminalFrame }
