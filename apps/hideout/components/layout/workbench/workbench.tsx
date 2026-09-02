"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { usePersistedPreference } from "@workspace/ui/hooks/use-persisted-preference"

import { PALETTE_EVENT } from "@/components/layout/command-palette"
import { ConsoleKeys } from "@/components/layout/console-keys"
import { SiteLog } from "@/components/layout/site-log"
import { StatusBar, type StatusField } from "@/components/layout/status-bar"
import { ActivityRail } from "@/components/layout/workbench/activity-rail"
import { BreadcrumbBar } from "@/components/layout/workbench/breadcrumb-bar"
import {
  BufferTabs,
  useBufferRecord,
} from "@/components/layout/workbench/buffer-tabs"
import { DocMinimap } from "@/components/layout/workbench/doc-minimap"
import {
  MobileTabBar,
  MobileTopBar,
} from "@/components/layout/workbench/mobile-bars"
import { SidePanelView } from "@/components/layout/workbench/side-panel"
import { dockVisor, sidePanel } from "@/lib/workbench-state"
import type { Buffer, SidePanel } from "@/lib/workbench"

/**
 * The workbench.
 *
 * One document, two compositions. On a wide screen it is an editor: a rail of
 * panels down the left edge, the strip of what is open across the top, the
 * path and the section you are in under it, the document between a gutter and
 * a minimap, the dock across the bottom. On a narrow one it is a reader with a
 * bar it can be driven from, and every instrument that was reporting rather
 * than working has been taken off the glass.
 *
 * The two are the same DOM. The document is rendered once, as children, and
 * the surfaces around it are shown or hidden by width — a phone never mounts
 * the minimap's measuring loop or the viewer's renderer, because both gate on
 * `matchMedia` rather than on a class.
 */

export type WorkbenchProps = {
  /** The open document's path, as the breadcrumb walks it. */
  path: string
  /** Sections nav and content tree, rendered on the server. */
  files: React.ReactNode
  links: { label: string; href: string }[]
  byline: { name: string; href: string }
  status?: StatusField[]
  /** Rendered above the buffer, edge to edge: the reading progress rule. */
  gauge?: React.ReactNode
  children: React.ReactNode
}

export function Workbench({
  path,
  files,
  links,
  byline,
  status,
  gauge,
  children,
}: WorkbenchProps) {
  const pathname = usePathname()
  const [stored, storePanel] = usePersistedPreference(sidePanel)
  const panel: SidePanel = stored === "off" ? null : stored
  const visorInDock = React.useSyncExternalStore(
    dockVisor.subscribe,
    dockVisor.read,
    dockVisor.serverSnapshot
  )

  useBufferRecord(React.useMemo(() => describe(pathname), [pathname]))

  // One renderer on this site. The dock takes it when its tab is open, and the
  // front page has it already — the globe up there is the same scene, and a
  // second canvas beside it would be two WebGL contexts drawing the same
  // instrument at once.
  const instrumentBusy = visorInDock
    ? "running in the dock"
    : pathname === "/"
      ? "the globe has it"
      : null

  const selectPanel = (next: SidePanel) => storePanel(next ?? "off")
  const openPalette = () => window.dispatchEvent(new Event(PALETTE_EVENT))

  return (
    <div className="flex h-full min-h-0 w-full">
      <ActivityRail
        panel={panel}
        onSelect={selectPanel}
        onSearch={openPalette}
        className="hidden md:flex"
      />

      <SidePanelView
        panel={panel}
        files={files}
        links={links}
        byline={byline}
        visorBusy={instrumentBusy}
        className="hidden md:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar path={path} className="md:hidden" />
        <BufferTabs activeHref={pathname} className="hidden md:flex" />
        <BreadcrumbBar path={path} className="hidden md:flex" />

        {gauge}

        <div className="flex min-h-0 flex-1">
          {/* scroll-smooth belongs here, not on <html>: this element is what
              actually scrolls, so it is what a TOC anchor jump moves. */}
          <div
            data-slot="buffer"
            className="doc-gutter relative z-1 min-w-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth motion-reduce:scroll-auto"
          >
            {children}
          </div>

          <DocMinimap className="hidden lg:block" />
        </div>

        <SiteLog />

        {/* One bar along the bottom, not two. On a narrow screen the tab bar
            already offers find and the log, and what the status bar has left
            is readouts — so the keys move into the console sheet and the bar
            stays with the width that has room to report. */}
        <StatusBar fields={status} className="hidden md:flex" />

        <MobileTabBar
          files={files}
          links={<MobileLinks links={links} byline={byline} />}
          className="md:hidden"
        />
      </div>
    </div>
  )
}

/**
 * The buffer this route opens.
 *
 * Read from the URL rather than passed down, because it has to be the same
 * fact on every route: a page that forgot to declare its buffer would drop
 * silently out of the strip.
 */
function describe(pathname: string): Buffer | null {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) return { href: "/", label: "home", kind: "page" }

  const [section] = segments
  const kind: Buffer["kind"] =
    section === "posts"
      ? "post"
      : section === "projects"
        ? "project"
        : section === "games"
          ? "game"
          : "page"

  return {
    href: pathname,
    label: segments[segments.length - 1] ?? section,
    kind,
  }
}

function MobileLinks({
  links,
  byline,
}: {
  links: { label: string; href: string }[]
  byline: { name: string; href: string }
}) {
  return (
    <div className="flex flex-col gap-4 p-3">
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="flex min-h-11 items-center gap-2 border border-terminal-rule px-3 font-mono text-[0.72rem] text-terminal-ink-dim crt-persist focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span aria-hidden="true" className="text-terminal-chrome-dim">
                &gt;
              </span>
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      {/* The console the status bar carries on a wide screen. It is where the
          screen, the phosphor and the boot sequence are switched, and dropping
          the bar on a phone would have dropped them with it. */}
      <div className="flex flex-col gap-2 border-t border-sidebar-border pt-3">
        <span className="font-mono text-[0.6rem] tracking-[0.2em] text-terminal-chrome-dim uppercase">
          пульт
        </span>
        <ConsoleKeys />
      </div>

      <p className="font-mono text-[0.65rem] text-terminal-ink-faint">
        made by{" "}
        <a
          href={byline.href}
          target="_blank"
          rel="noreferrer"
          className="byline-link text-terminal-ink-dim underline underline-offset-4 crt-persist focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          {byline.name}
        </a>
      </p>
    </div>
  )
}
