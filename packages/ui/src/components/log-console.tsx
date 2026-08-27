"use client"

import * as React from "react"
import { IconTrash, IconX } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import {
  logger,
  safeStringify,
  type LogEntry,
  type LogLevel,
} from "@workspace/ui/lib/logger"
import { cn } from "@workspace/ui/lib/utils"

const LEVEL_CLASS: Record<LogLevel, string> = {
  debug: "text-terminal-ink-faint",
  info: "text-terminal-chrome-dim",
  warn: "text-foreground",
  error: "text-destructive",
}

/** The server has no log to show, and an empty array keeps its identity. */
const EMPTY: LogEntry[] = []

/** Subscribe to the shared log. Exported so a status bar can count from it. */
export function useLogEntries() {
  return React.useSyncExternalStore(
    logger.subscribe,
    logger.entries,
    () => EMPTY
  )
}

export function isProblem(entry: LogEntry) {
  return entry.level === "warn" || entry.level === "error"
}

type Panel = "output" | "problems"

/**
 * The app's own log, as the panel an editor keeps across the bottom.
 *
 * Two tabs, for the same reason an editor has them: Output is everything the
 * app said, in order, and Problems is only what went wrong. A level dropdown
 * would express the same thing less directly — nobody opens a log panel
 * wanting "warn and above", they want to know whether anything broke.
 */
export function LogConsole({
  open,
  onClose,
  className,
}: {
  open: boolean
  onClose: () => void
  className?: string
}) {
  const entries = useLogEntries()
  const [panel, setPanel] = React.useState<Panel>("output")
  const scroller = React.useRef<HTMLDivElement>(null)

  const problems = React.useMemo(() => entries.filter(isProblem), [entries])
  const visible = panel === "problems" ? problems : entries

  // Follow the tail, the way `tail -f` does — but only when the reader is
  // already at the bottom, so scrolling back to read something does not get
  // yanked away by the next line.
  React.useEffect(() => {
    const element = scroller.current
    if (!element || !open) return

    const distance =
      element.scrollHeight - element.scrollTop - element.clientHeight
    if (distance < 80) element.scrollTop = element.scrollHeight
  }, [visible, open])

  if (!open) return null

  return (
    <section
      aria-label="Site log"
      className={cn(
        "z-10 flex h-56 shrink-0 flex-col border-t bg-background",
        className
      )}
    >
      <header className="flex h-8 shrink-0 items-center border-b border-terminal-rule pe-1">
        <div role="tablist" aria-label="Log panels" className="flex h-full">
          <PanelTab
            id="output"
            active={panel}
            onSelect={setPanel}
            count={entries.length}
          >
            output
          </PanelTab>
          <PanelTab
            id="problems"
            active={panel}
            onSelect={setPanel}
            count={problems.length}
            emphasis={problems.length > 0}
          >
            problems
          </PanelTab>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="ms-auto"
          aria-label="Clear the log"
          onPress={() => logger.clear()}
        >
          <IconTrash />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close the panel"
          onPress={onClose}
        >
          <IconX />
        </Button>
      </header>

      <div
        ref={scroller}
        role="tabpanel"
        // A log is a live region, but an assertive one would read every line
        // aloud as it lands. Polite means it is available without hijacking.
        aria-live="polite"
        className="min-h-0 flex-1 overflow-y-auto p-2 font-mono text-[0.7rem] leading-relaxed"
      >
        {visible.length === 0 ? (
          <p className="text-terminal-ink-faint">
            {panel === "problems"
              ? "No problems. Nothing has failed this session."
              : "Nothing logged yet."}
          </p>
        ) : (
          <ol className="flex flex-col">
            {visible.map((entry) => (
              <LogLine key={entry.id} entry={entry} />
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

function PanelTab({
  id,
  active,
  count,
  emphasis = false,
  onSelect,
  children,
}: {
  id: Panel
  active: Panel
  count: number
  emphasis?: boolean
  onSelect: (panel: Panel) => void
  children: React.ReactNode
}) {
  const selected = active === id

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={() => onSelect(id)}
      className={cn(
        // The selected tab is marked by a rule along its top edge, the way an
        // editor marks the active panel — not by a filled pill.
        "flex h-full items-center gap-1.5 border-t-2 px-3 font-mono text-[0.65rem] tracking-widest uppercase crt-persist focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        selected
          ? "border-primary text-foreground"
          : "border-transparent text-terminal-ink-dim hover:text-foreground"
      )}
    >
      {children}
      <span
        className={cn(
          "tabular-nums",
          emphasis ? "text-destructive" : "text-terminal-ink-faint"
        )}
      >
        {count}
      </span>
    </button>
  )
}

function LogLine({ entry }: { entry: LogEntry }) {
  // Locale-independent and second-resolution: this is a timeline, not a clock.
  const stamp = new Date(entry.time).toISOString().slice(11, 19)

  return (
    <li className="flex min-w-0 gap-2 whitespace-pre-wrap">
      <span className="shrink-0 text-terminal-ink-faint tabular-nums">
        {stamp}
      </span>
      <span className={cn("w-10 shrink-0 uppercase", LEVEL_CLASS[entry.level])}>
        {entry.level}
      </span>
      <span className="shrink-0 text-primary">{entry.scope}</span>
      <span className="min-w-0 text-terminal-ink">
        {entry.message}
        {entry.data !== undefined ? (
          <span className="text-terminal-ink-faint">
            {" "}
            {safeStringify(entry.data)}
          </span>
        ) : null}
      </span>
    </li>
  )
}
