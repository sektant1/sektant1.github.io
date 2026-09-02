"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconAntenna,
  IconBinaryTree,
  IconSearch,
  IconTerminal2,
} from "@tabler/icons-react"
import { Sheet } from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"

import { SiteMark } from "@/components/layout/site-mark"
import { PALETTE_EVENT } from "@/components/layout/command-palette"
import { TOGGLE_EVENT } from "@/components/layout/site-log"

/**
 * The narrow-screen shell.
 *
 * Not the workbench squeezed. The rail, the tabs, the gutter, the minimap and
 * the breadcrumb are instruments for a pointer and a wide screen, and a phone
 * that carries them spends most of its glass reporting instead of reading.
 * What is left is a bar that says where you are and a bar you can press:
 * four targets, each 44px, each lit while its surface is open.
 *
 * Every control here is a control at rest. There is no hover on a touch
 * screen, so an affordance that only appears under a pointer is an affordance
 * that does not exist on this half of the site.
 */

type MobileSurface = "files" | "links" | null

export function MobileTopBar({
  path,
  className,
}: {
  path: string
  className?: string
}) {
  // The file, not the directories above it: 44px of bar cannot hold a path,
  // and the leaf is the part that says which document is open.
  const leaf = path.split("/").filter(Boolean).slice(-2).join("/")

  return (
    <header
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 border-b bg-sidebar px-3",
        className
      )}
    >
      <Link
        href="/"
        aria-label="Sektant's Hideout, home"
        className="flex shrink-0 items-center gap-2 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      >
        <SiteMark className="size-5 crt-glow-soft" />
      </Link>

      <span className="min-w-0 flex-1 truncate font-mono text-[0.68rem]">
        <span className="text-terminal-ink-faint">~/</span>
        <span className="text-terminal-ink">{leaf}</span>
      </span>
    </header>
  )
}

export function MobileTabBar({
  files,
  links,
  className,
}: {
  files: React.ReactNode
  links: React.ReactNode
  className?: string
}) {
  const [surface, setSurface] = React.useState<MobileSurface>(null)

  return (
    <>
      <nav
        aria-label="Sections"
        className={cn(
          "flex h-14 shrink-0 items-stretch border-t bg-sidebar",
          className
        )}
      >
        <TabTarget
          label="файлы"
          active={surface === "files"}
          onPress={() => setSurface(surface === "files" ? null : "files")}
          Icon={IconBinaryTree}
        />
        <TabTarget
          label="поиск"
          onPress={() => window.dispatchEvent(new Event(PALETTE_EVENT))}
          Icon={IconSearch}
        />
        <TabTarget
          label="журнал"
          onPress={() => window.dispatchEvent(new Event(TOGGLE_EVENT))}
          Icon={IconTerminal2}
        />
        <TabTarget
          label="связь"
          active={surface === "links"}
          onPress={() => setSurface(surface === "links" ? null : "links")}
          Icon={IconAntenna}
        />
      </nav>

      {/* Full height, not a drawer: the archive is the reason to open this,
          and a tree in a 60%-tall sheet is a tree you scroll in a letterbox. */}
      <Sheet
        isOpen={surface !== null}
        onOpenChange={(open) => setSurface(open ? surface : null)}
        side="left"
        isDismissable
        aria-label={surface === "links" ? "Contact" : "Content"}
        className="w-[88%] max-w-sm bg-sidebar"
      >
        <div className="flex h-11 shrink-0 items-center border-b border-sidebar-border px-3 font-mono text-[0.62rem] tracking-[0.2em] text-terminal-chrome-dim uppercase">
          {surface === "links" ? "связь" : "архив"}
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto"
          onClick={() => setSurface(null)}
        >
          {surface === "links" ? links : files}
        </div>
      </Sheet>
    </>
  )
}

function TabTarget({
  label,
  active = false,
  onPress,
  Icon,
}: {
  label: string
  active?: boolean
  onPress: () => void
  Icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={active}
      className={cn(
        // A target, not a key: the whole cell is pressable, and the lit state
        // is a rule along the top edge — the same mark the buffer tabs and the
        // log panel use for "this is the one that is open".
        "flex flex-1 flex-col items-center justify-center gap-1 border-t-2 font-mono text-[0.6rem] tracking-[0.15em] uppercase crt-persist focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        active
          ? "border-t-primary text-primary crt-glow-soft"
          : "border-t-transparent text-terminal-ink-dim"
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  )
}
