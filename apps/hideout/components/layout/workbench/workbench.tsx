"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { usePersistedPreference } from "@workspace/ui/hooks/use-persisted-preference"

import { ConsoleKeys } from "@/components/layout/console-keys"
import { SiteLog } from "@/components/layout/site-log"
import { StatusBar, type StatusField } from "@/components/layout/status-bar"
import type { FleaState } from "@/lib/tarkov"
import { ActivityRail } from "@/components/layout/workbench/activity-rail"
import { BreadcrumbBar } from "@/components/layout/workbench/breadcrumb-bar"
import {
  BufferTabs,
  useBufferRecord,
} from "@/components/layout/workbench/buffer-tabs"
import {
  MobileTabBar,
  MobileTopBar,
} from "@/components/layout/workbench/mobile-bars"
import { SidePanelView } from "@/components/layout/workbench/side-panel"
import { BYLINE, SOCIAL_LINKS, fire } from "@/lib/navigation"
import { sidePanel } from "@/lib/workbench-state"
import type { Buffer, SidePanel } from "@/lib/workbench"

/**
 * The workbench.
 *
 * One document, two compositions. On a wide screen it is an editor: a rail of
 * panels down the left edge, the strip of what is open across the top, the
 * path and the section you are in under it, the document in a numbered
 * gutter, the dock across the bottom. On a narrow one it is a reader with a
 * bar it can be driven from, and every instrument that was reporting rather
 * than working has been taken off the glass.
 *
 * The two are the same DOM. The document is rendered once, as children, and
 * the surfaces around it are shown or hidden by width — the one piece that
 * costs something, the viewer, gates on `matchMedia` rather than on a class,
 * so a phone never starts a renderer it cannot show.
 */

export type WorkbenchProps = {
  /** The open document's path, as the breadcrumb walks it. */
  path: string
  /** Sections nav and content tree, rendered on the server. */
  files: React.ReactNode
  links: { label: string; href: string }[]
  byline: { name: string; href: string }
  /** Flea prices for the item the instrument draws, read on the server. */
  flea: FleaState
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
  flea,
  status,
  gauge,
  children,
}: WorkbenchProps) {
  const pathname = usePathname()
  const [stored, storePanel] = usePersistedPreference(sidePanel)
  const panel: SidePanel = stored === "off" ? null : stored
  useBufferRecord(React.useMemo(() => describe(pathname), [pathname]))

  const selectPanel = (next: SidePanel) => storePanel(next ?? "off")
  const openPalette = () => fire("palette")

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
        flea={flea}
        className="hidden md:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar path={path} className="md:hidden" />
        <BufferTabs activeHref={pathname} className="hidden md:flex" />
        <BreadcrumbBar path={path} className="hidden md:flex" />

        {gauge}

        {/* scroll-smooth belongs here, not on <html>: this element is what
            actually scrolls, so it is what a TOC anchor jump moves. */}
        <div
          data-slot="buffer"
          className="doc-gutter relative z-1 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth motion-reduce:scroll-auto"
        >
          {children}
        </div>

        <SiteLog />

        {/* Readouts only. The keys that used to sit here — the screen, the
            phosphor, the boot sequence — are the console panel's rows now, and
            a second copy a few pixels away is how two controls for one setting
            end up disagreeing about which is lit. */}
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
