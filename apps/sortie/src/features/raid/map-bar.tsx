import { cn } from "@workspace/ui/lib/utils"

import { Toggle } from "@/components/segmented"
import type { SnapshotMap } from "@/domain/types"

/**
 * The map you are packing for, picked from a strip of instrument stops.
 *
 * Seventeen identical bordered boxes over two lines gave every map the same
 * weight and made the one you had chosen hard to find. Here the count is the
 * big figure and the name is its caption, the strip is ordered by how much
 * each map has waiting, and the empty ones sit at the end, dimmed but still
 * reachable — a map with nothing on it is a real answer.
 */
export function MapBar({
  maps,
  counts,
  selected,
  globalCount,
  includeGlobal,
  onSelect,
  onToggleGlobal,
}: {
  maps: SnapshotMap[]
  counts: Record<string, number>
  selected: SnapshotMap
  globalCount: number
  includeGlobal: boolean
  onSelect: (map: SnapshotMap) => void
  onToggleGlobal: () => void
}) {
  const ordered = [...maps].sort((a, b) => {
    const difference = (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
    return difference !== 0 ? difference : a.name.localeCompare(b.name)
  })

  return (
    <div className="flex items-stretch gap-2">
      <div
        role="radiogroup"
        aria-label="Map"
        className="flex min-w-0 flex-1 divide-x divide-terminal-rule overflow-x-auto border border-terminal-rule"
      >
        {ordered.map((map) => {
          const count = counts[map.id] ?? 0
          const active = map.id === selected.id
          return (
            <button
              key={map.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(map)}
              className={cn(
                "group flex min-w-[5.5rem] shrink-0 flex-col items-start justify-center gap-0.5 px-3 py-2 text-left transition-colors",
                "focus-visible:ring-1 focus-visible:ring-ring focus-visible:-outline-offset-1 focus-visible:outline-none",
                active
                  ? "bg-primary/15"
                  : count === 0
                    ? "opacity-45 hover:bg-primary/5 hover:opacity-100"
                    : "hover:bg-primary/5"
              )}
            >
              <span
                className={cn(
                  "font-sans text-lg leading-none font-bold tabular-nums",
                  active
                    ? "text-primary crt-glow"
                    : count === 0
                      ? "text-terminal-chrome-dim"
                      : "text-primary/80"
                )}
              >
                {count}
              </span>
              <span
                className={cn(
                  "max-w-[7rem] truncate font-mono text-[0.6rem] tracking-[0.12em] uppercase",
                  active ? "text-primary" : "text-terminal-chrome"
                )}
              >
                {map.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Not a map, so not in the strip: it decides whether the anywhere
          tasks join whichever map is selected. */}
      <Toggle
        active={includeGlobal}
        onClick={onToggleGlobal}
        title="Tasks that name no map, or name most of them"
        className="shrink-0 self-stretch"
      >
        anywhere
        <span className="tabular-nums opacity-70">{globalCount}</span>
      </Toggle>
    </div>
  )
}
