"use client"

import type * as React from "react"
import {
  IconCurrencyBitcoin,
  IconFolder,
  IconLink,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import type { SidePanel } from "@/lib/workbench"

/**
 * The rail down the left edge: which panel the side of the workbench shows.
 *
 * The archive, the search, the instrument, the console and the ways to reach
 * the operator. Pressing the lit key collapses the panel, the way a rail
 * behaves in an editor: the key reports what is open, and pressing what is
 * already open closes it.
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

// English names under the icons every editor uses for them. The keys were
// Cyrillic glyph-only, and a first visit had to press each to learn it.
const ITEMS: RailItem[] = [
  { id: "files", label: "Files", hint: "Files", Icon: IconFolder },
  {
    id: "search",
    label: "Search",
    hint: "Search (ctrl+k)",
    Icon: IconSearch,
  },
  {
    id: "visor",
    label: "Farm",
    hint: "BTC farm",
    Icon: IconCurrencyBitcoin,
  },
  {
    id: "stash",
    label: "Settings",
    hint: "Settings",
    Icon: IconSettings,
  },
  {
    id: "links",
    label: "Links",
    hint: "Links",
    Icon: IconLink,
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
              "key-sweep flex w-11 flex-col items-center justify-center gap-0.5 border py-1.5 font-mono text-[0.48rem] leading-none tracking-normal uppercase crt-persist focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
              active
                ? "border-primary text-primary crt-glow-soft"
                : "border-terminal-rule text-terminal-ink-dim hover:border-terminal-edge hover:text-foreground"
            )}
          >
            <item.Icon className="size-5" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
