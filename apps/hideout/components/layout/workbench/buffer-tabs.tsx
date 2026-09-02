"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconX } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import { buffers as bufferStore } from "@/lib/workbench-state"
import { nextAfterClose, type Buffer } from "@/lib/workbench"

/**
 * The strip of open documents.
 *
 * The shell deliberately had no tabs: reading is one document at a time, and a
 * tab strip promised a multi-document workflow the public site did not have.
 * What it also did was throw away the only record of where the reader has
 * been — a station that keeps a log of everything it does, and no trace of
 * what you opened. The strip is that trace, and it is honest about its span:
 * this session, eight documents, then the oldest falls off.
 *
 * The marker before each label says what kind of thing it is, in the same
 * bracket idiom the file tree uses for directories.
 */

const MARKER: Record<Buffer["kind"], string> = {
  post: "[p]",
  project: "[w]",
  game: "[g]",
  page: "[·]",
}

export function BufferTabs({
  activeHref,
  className,
}: {
  activeHref: string
  className?: string
}) {
  const router = useRouter()
  const open = React.useSyncExternalStore(
    bufferStore.subscribe,
    bufferStore.read,
    bufferStore.serverSnapshot
  )

  const close = (href: string) => {
    // Closing the document you are reading moves to a neighbour; closing any
    // other tab leaves the page alone.
    const target = href === activeHref ? nextAfterClose(open, href) : null
    bufferStore.close(href)
    if (target) router.push(target)
  }

  if (open.length === 0) return null

  return (
    <div
      role="tablist"
      aria-label="Open documents"
      className={cn(
        "flex h-8 shrink-0 [scrollbar-width:none] items-stretch overflow-x-auto border-b border-terminal-rule bg-sidebar [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {open.map((buffer) => {
        const active = buffer.href === activeHref

        return (
          <span
            key={buffer.href}
            className={cn(
              // The active tab is marked by a phosphor rule along its top
              // edge, matching the log panel's tabs — one idiom for "this is
              // the one you are looking at" across the whole shell.
              "flex max-w-52 shrink-0 items-center gap-1.5 border-e border-t-2 border-e-terminal-rule ps-2 pe-1 font-mono text-[0.68rem]",
              active
                ? "border-t-primary bg-background text-foreground"
                : "border-t-transparent text-terminal-ink-dim"
            )}
          >
            <Link
              href={buffer.href}
              role="tab"
              aria-selected={active}
              onAuxClick={(event) => {
                // Middle click closes, as it does in a browser and an editor.
                if (event.button === 1) {
                  event.preventDefault()
                  close(buffer.href)
                }
              }}
              className="flex min-w-0 items-center gap-1.5 py-1 crt-persist hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className="shrink-0 text-terminal-chrome-dim"
              >
                {MARKER[buffer.kind]}
              </span>
              <span className="truncate">{buffer.label}</span>
            </Link>

            <button
              type="button"
              onClick={() => close(buffer.href)}
              aria-label={`Close ${buffer.label}`}
              // Always present, never hover-only: a control that appears when
              // a pointer arrives does not exist on a touch screen.
              className="flex size-4 shrink-0 items-center justify-center text-terminal-chrome-dim crt-persist hover:bg-terminal-wash hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <IconX className="size-3" />
            </button>
          </span>
        )
      })}
    </div>
  )
}

/**
 * Records the open document in the strip.
 *
 * Separate from the strip itself because it runs on every route, including the
 * ones where the strip is not drawn: the record is of what the reader opened,
 * not of what the viewport was wide enough to show.
 */
export function useBufferRecord(buffer: Buffer | null) {
  React.useEffect(() => {
    if (buffer) bufferStore.open(buffer)
  }, [buffer])
}
