"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { IconAlertOctagon, IconAlertTriangle } from "@tabler/icons-react"
import { LogConsole, useLogEntries } from "@workspace/ui/components/log-console"
import { captureConsole, logger } from "@workspace/ui/lib/logger"
import { cn } from "@workspace/ui/lib/utils"

const TOGGLE_EVENT = "hideout:toggle-log"

/**
 * The integrated terminal.
 *
 * ctrl+` opens it, the way it does in an editor. It is off by default and the
 * panel renders nothing while closed, so the reader who never asks for it pays
 * for one keydown listener and a ring buffer.
 *
 * What lands in it is what the site actually did: navigations, the globe
 * warming up, the visitor's location resolving, and anything the page logs to
 * the console on its own.
 */
export function SiteLog() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    const restore = captureConsole()

    logger.info("boot", "tube warm, session started", {
      viewport: `${window.innerWidth}×${window.innerHeight}`,
    })

    function onKeyDown(event: KeyboardEvent) {
      // ctrl+` — the editor shortcut. Not cmd on mac: cmd+` cycles windows.
      if (event.ctrlKey && event.key === "`") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    const onRequest = () => setOpen((current) => !current)

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener(TOGGLE_EVENT, onRequest)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener(TOGGLE_EVENT, onRequest)
      restore()
    }
  }, [])

  React.useEffect(() => {
    logger.info("router", `opened ${pathname}`)
  }, [pathname])

  return <LogConsole open={open} onClose={() => setOpen(false)} />
}

/**
 * The status bar's way in, in the idiom an editor uses for it: live counts of
 * errors and warnings, on the left, opening the panel when clicked.
 *
 * Two counts rather than one "log" link, because the number is the reason to
 * look. A zero next to both is itself the message — nothing has failed.
 */
export function SiteLogToggle({ className }: { className?: string }) {
  const entries = useLogEntries()

  const errors = entries.filter((entry) => entry.level === "error").length
  const warnings = entries.filter((entry) => entry.level === "warn").length

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(TOGGLE_EVENT))}
      title="Toggle the panel (ctrl+`)"
      className={cn(
        "flex shrink-0 items-center gap-2 border border-terminal-rule px-1.5 text-terminal-ink-dim crt-persist hover:border-terminal-edge hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
    >
      <span className="flex items-center gap-1">
        <IconAlertOctagon
          aria-hidden="true"
          className={cn("size-3", errors > 0 && "text-destructive")}
        />
        <span className={cn("tabular-nums", errors > 0 && "text-destructive")}>
          {errors}
        </span>
      </span>

      <span className="flex items-center gap-1">
        <IconAlertTriangle aria-hidden="true" className="size-3" />
        <span className="tabular-nums">{warnings}</span>
      </span>

      <span className="sr-only">
        {errors} errors and {warnings} warnings. Open the log panel.
      </span>
    </button>
  )
}
