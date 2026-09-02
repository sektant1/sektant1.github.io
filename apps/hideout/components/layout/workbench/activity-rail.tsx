"use client"

import type * as React from "react"
import {
  IconBinaryTree,
  IconCube3dSphere,
  IconSearch,
  IconAntenna,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import type { SidePanel } from "@/lib/workbench"

/**
 * The rail down the left edge: which panel the side of the workbench shows.
 *
 * Four keys, because four is what this station has to show — the archive, the
 * search, the instrument, and the ways to reach the operator. Pressing the lit
 * key collapses the panel, the way a rail behaves in an editor: the key
 * reports what is open, and pressing what is already open closes it.
 *
 * Each is a key by the site's affordance grammar — a bordered box, lit while
 * active — so nothing here depends on a hover to say it can be pressed.
 */

type RailItem = {
  id: Exclude<SidePanel, null> | "search"
  label: string
  hint: string
  Icon: React.ComponentType<{ className?: string }>
}

const ITEMS: RailItem[] = [
  { id: "files", label: "ФАЙЛЫ", hint: "Content tree", Icon: IconBinaryTree },
  { id: "search", label: "ПОИСК", hint: "Search (ctrl+k)", Icon: IconSearch },
  {
    id: "visor",
    label: "ВИЗОР",
    hint: "The instrument",
    Icon: IconCube3dSphere,
  },
  {
    id: "links",
    label: "СВЯЗЬ",
    hint: "Ways to reach the operator",
    Icon: IconAntenna,
  },
]

export function ActivityRail({
  panel,
  onSelect,
  onSearch,
  className,
}: {
  panel: SidePanel
  onSelect: (panel: SidePanel) => void
  onSearch: () => void
  className?: string
}) {
  return (
    <nav
      aria-label="Workbench panels"
      className={cn(
        "flex w-[3.25rem] shrink-0 flex-col items-center gap-1 border-e border-sidebar-border bg-sidebar py-2",
        className
      )}
    >
      {ITEMS.map((item) => {
        // Search has no panel of its own: the palette is a dialog, and giving
        // it a rail key that opens a dialog is how every editor does it.
        const active = item.id !== "search" && panel === item.id

        return (
          <button
            key={item.id}
            type="button"
            title={item.hint}
            aria-pressed={item.id === "search" ? undefined : active}
            onClick={() =>
              item.id === "search"
                ? onSearch()
                : onSelect(active ? null : (item.id as SidePanel))
            }
            className={cn(
              "flex size-9 items-center justify-center border crt-persist focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
              active
                ? "border-primary text-primary crt-glow-soft"
                : "border-terminal-rule text-terminal-ink-dim hover:border-terminal-edge hover:text-foreground"
            )}
          >
            <item.Icon className="size-4" />
            <span className="sr-only">{item.hint}</span>
          </button>
        )
      })}
    </nav>
  )
}
