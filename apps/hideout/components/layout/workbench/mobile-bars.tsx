"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconArticle,
  IconHome,
  IconLayoutGrid,
  IconMenu2,
  IconSearch,
} from "@tabler/icons-react"
import { Sheet } from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"

import { SiteMark } from "@/components/layout/site-mark"
import { fire, isSectionActive } from "@/lib/navigation"

/**
 * The narrow-screen shell.
 *
 * Not the workbench squeezed. The rail, the tabs, the gutter and the
 * breadcrumb are instruments for a pointer and a wide screen, and a phone that
 * carries them spends most of its glass reporting instead of reading.
 * What is left is a bar that says where you are and a bar you can press.
 *
 * Every control here is a control at rest. There is no hover on a touch
 * screen, so an affordance that only appears under a pointer is an affordance
 * that does not exist on this half of the site.
 */

type Icon = React.ComponentType<{ className?: string }>

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
        className="-ms-3 flex size-11 shrink-0 items-center justify-center focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
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

/**
 * Where a phone can go in one press.
 *
 * The bar used to open surfaces — the archive tree, the log, the radio — and
 * name them in Cyrillic, so a first visit had to guess which key led to the
 * work. Destinations take the bar now, under the icons every phone already
 * uses for them; the tree, the links and the console keys wait behind Menu.
 */
export function MobileTabBar({
  files,
  links,
  className,
}: {
  files: React.ReactNode
  links: React.ReactNode
  className?: string
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false)

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          "flex h-14 shrink-0 items-stretch border-t bg-sidebar pb-[env(safe-area-inset-bottom)]",
          className
        )}
      >
        <TabLink
          href="/"
          label="Home"
          Icon={IconHome}
          active={pathname === "/"}
        />
        <TabLink
          href="/projects"
          label="Projects"
          Icon={IconLayoutGrid}
          active={isSectionActive(pathname, "/projects")}
        />
        <TabLink
          href="/posts"
          label="Posts"
          Icon={IconArticle}
          active={isSectionActive(pathname, "/posts")}
        />
        <TabButton
          label="Search"
          Icon={IconSearch}
          onPress={() => fire("palette")}
        />
        <TabButton
          label="Menu"
          Icon={IconMenu2}
          expanded={menuOpen}
          onPress={() => setMenuOpen(!menuOpen)}
        />
      </nav>

      {/* Full height, not a drawer: the archive is in here, and a tree in a
          60%-tall sheet is a tree you scroll in a letterbox. It opens from the
          side its key is on. */}
      <Sheet
        isOpen={menuOpen}
        onOpenChange={setMenuOpen}
        side="right"
        isDismissable
        aria-label="Menu"
        className="mobile-sheet w-[88%] max-w-sm bg-sidebar"
      >
        <div className="flex h-11 shrink-0 items-center border-b border-sidebar-border px-3 font-mono text-[0.62rem] tracking-[0.2em] text-terminal-chrome-dim uppercase">
          menu
        </div>
        {/* Closed by what leaves the sheet, not by any press inside it: the
            filter field and the console keys are used in place. */}
        <div
          className="flex min-h-0 flex-1 flex-col overflow-y-auto"
          onClick={(event) => {
            const target = event.target as HTMLElement
            if (target.closest("a, [data-closes-menu]")) setMenuOpen(false)
          }}
        >
          {/* Held at their content height: shrinking, the tree scrolled in a
              box of its own inside the sheet's scroll. */}
          <div className="flex shrink-0 flex-col">{files}</div>
          <div className="shrink-0 border-t border-sidebar-border">{links}</div>
        </div>
      </Sheet>
    </>
  )
}

// A target, not a key: the whole cell is pressable, and the lit state is a
// rule along the top edge — the mark the buffer tabs use for "this is open".
const TAB_CLASS =
  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 border-t-2 font-mono text-[0.6rem] tracking-[0.12em] uppercase crt-persist focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"

function tabState(lit: boolean) {
  return lit
    ? "border-t-primary text-primary crt-glow-soft"
    : "border-t-transparent text-terminal-ink-dim"
}

function TabLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string
  label: string
  Icon: Icon
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(TAB_CLASS, tabState(active))}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  )
}

function TabButton({
  label,
  Icon,
  expanded,
  onPress,
}: {
  label: string
  Icon: Icon
  expanded?: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-expanded={expanded}
      className={cn(TAB_CLASS, tabState(expanded === true))}
    >
      <Icon className="size-5" />
      {label}
    </button>
  )
}
