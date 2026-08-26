import { IconX } from "@tabler/icons-react"
import { useLocation, useNavigate } from "react-router"

import { cn } from "@workspace/ui/lib/utils"

import { useBuffers } from "@/layout/buffers"
import { toFileName } from "@/lib/file-name"

/**
 * The tab strip. Buffer state lives in BuffersProvider, because the shell
 * needs it too — an empty strip means an empty editor.
 */
export function EditorTabs() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { open, close } = useBuffers()

  function closeTab(path: string) {
    // Closing the focused buffer moves to the neighbouring one, as an editor
    // does. Closing the last leaves the editor empty rather than navigating.
    const next = open.filter((item) => item !== path)
    if (path === pathname && next.length) navigate(next[next.length - 1])
    close(path)
  }

  if (open.length === 0) return null

  return (
    <div
      role="tablist"
      aria-label="Open buffers"
      className="flex h-8 shrink-0 items-stretch overflow-x-auto border-b border-border bg-[color-mix(in_oklch,var(--background),var(--foreground)_2%)]"
    >
      {open.map((path) => {
        const active = path === pathname

        return (
          <div
            key={path}
            className={cn(
              "group/tab flex shrink-0 items-center gap-2 border-e border-border px-3 font-mono text-[0.65rem] transition-colors",
              active
                ? "bg-background text-terminal-chrome"
                : "text-terminal-ink-dim hover:text-terminal-ink"
            )}
          >
            {/* The active tab is marked by a top rule, the way an editor
                marks the focused buffer. */}
            {active ? (
              <span
                aria-hidden="true"
                className="absolute mt-[-1.75rem] h-px w-8 bg-primary"
              />
            ) : null}

            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => navigate(path)}
              className="truncate"
            >
              {toFileName(path)}
            </button>

            <button
              type="button"
              aria-label={`Close ${toFileName(path)}`}
              onClick={() => closeTab(path)}
              className="text-terminal-ink-faint opacity-0 transition-opacity group-hover/tab:opacity-100 hover:text-terminal-chrome focus-visible:opacity-100"
            >
              <IconX className="size-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
