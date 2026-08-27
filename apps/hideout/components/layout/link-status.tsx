"use client"

import * as React from "react"

import { logger } from "@workspace/ui/lib/logger"
import { cn } from "@workspace/ui/lib/utils"

const subscribe = (onChange: () => void) => {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

/**
 * Whether the machine still has a link, in the corner of the status bar.
 *
 * A field terminal reports the state of its uplink, and here it is a real
 * reading rather than dressing: this site is static, so it keeps working from
 * cache when the connection drops, and the one thing that stops working —
 * following a link to something not yet fetched — is exactly what this warns
 * about.
 */
export function LinkStatus({ className }: { className?: string }) {
  const online = React.useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    // The server cannot know, and assuming a link is the safe default: it
    // renders the quiet state rather than a warning that flashes and clears.
    () => true
  )

  React.useEffect(() => {
    logger[online ? "info" : "warn"](
      "link",
      online ? "uplink acquired" : "uplink lost — cached pages only"
    )
  }, [online])

  return (
    <span
      className={cn("flex shrink-0 items-center gap-1", className)}
      title={online ? "Connected" : "No connection"}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0",
          online
            ? "bg-primary shadow-[0_0_6px_var(--primary)]"
            : "bg-destructive motion-safe:animate-pulse"
        )}
      />
      <span className={cn(!online && "text-destructive")}>
        {online ? "lnk" : "no lnk"}
      </span>
    </span>
  )
}
