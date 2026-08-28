import type * as React from "react"
import Link from "next/link"
import { FontPicker } from "@workspace/ui/components/font-picker"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

import {
  CommandPalette,
  CommandTrigger,
} from "@/components/layout/command-palette"
import { ColdBoot } from "@/components/layout/cold-boot"
import { ContentTree } from "@/components/layout/content-tree"
import { SiteLog } from "@/components/layout/site-log"
import { StatusBar, type StatusField } from "@/components/layout/status-bar"
import { buildCommandIndex } from "@/lib/content/command-index"
import { getHomeContent } from "@/lib/content/home"
import { isAdminVisible } from "@/lib/runtime/mode"
import type { ContentTreeNode } from "@/lib/content/types"

const SECTIONS = [
  { label: "posts", href: "/posts" },
  { label: "projects", href: "/projects" },
  { label: "games", href: "/games" },
  { label: "about", href: "/about" },
]

const SOCIAL_LINKS = [
  { label: "github", href: "https://github.com/sektant1" },
  { label: "youtube", href: "https://youtube.com/@sektant1swe" },
  { label: "rss", href: "/rss.xml" },
]

/** The person behind the operator callsign. */
const BYLINE = {
  name: "gabriel fernandes",
  href: "https://www.linkedin.com/in/gabrielfernandesbr/",
}

type SiteShellProps = {
  /** The file path shown in the header rule, without the leading `~/`. */
  path: string
  tree: ContentTreeNode[]
  /** Right-hand fields in the status bar: whatever this buffer knows. */
  status?: StatusField[]
  /** Rendered above the buffer, edge to edge: the reading progress rule. */
  gauge?: React.ReactNode
  children: React.ReactNode
}

/**
 * The site chrome: an editor with the content repository open in it.
 *
 * The sidebar is the file tree, the header rule is the path of the open file,
 * and the status bar carries that file's own numbers. Deliberately no buffer
 * tabs — reading is one document at a time, and tabs would promise a
 * multi-document workflow the public site does not have. The CMS, which does,
 * has them.
 */
export async function SiteShell({
  path,
  tree,
  status,
  gauge,
  children,
}: SiteShellProps) {
  const [commandIndex, home] = await Promise.all([
    buildCommandIndex(),
    getHomeContent(),
  ])

  return (
    // The provider defaults to min-h-svh, which is a full viewport *below*
    // the classification banner and pushes the status bar off the bottom. It
    // fills the space it is given instead.
    <SidebarProvider className="h-full min-h-0">
      <Sidebar>
        {/* Same height and bottom rule as the content header, so the two read
            as one bar across the top rather than two misaligned ones. */}
        <SidebarHeader className="h-11 justify-center border-b border-sidebar-border p-0 px-3">
          {/* Host designation, the way a terminal names itself at the top of
              a session: the operator, then the machine. */}
          <Link
            href="/"
            className="flex min-w-0 flex-col leading-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="truncate font-mono text-xs tracking-[0.2em] text-primary uppercase crt-glow">
              sektant
            </span>
            <span className="truncate font-mono text-[0.6rem] tracking-[0.2em] text-terminal-ink-faint uppercase">
              hideout // fld
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-1">
          {/* The tree lists files. These are the listing pages above them —
              without this row there is no way to reach /games at all, and
              /posts is only reachable from the front page. */}
          <nav
            aria-label="Sections"
            className="flex flex-col border-b border-sidebar-border pb-2 font-mono text-[0.72rem]"
          >
            {SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="flex items-center gap-1.5 px-2 py-0.5 text-terminal-ink-dim crt-persist hover:bg-terminal-wash hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span aria-hidden="true" className="text-terminal-chrome-dim">
                  &gt;
                </span>
                {section.label}
              </Link>
            ))}
          </nav>

          <ContentTree tree={tree} />
        </SidebarContent>

        <SidebarFooter className="p-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-sidebar-border px-3 py-2 font-mono text-[0.65rem]">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-terminal-ink-dim crt-persist hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* The one human name in the chrome. The machine calls itself
              SEKTANT1 upstairs; this is who runs it. */}
          <p className="border-t border-sidebar-border px-3 py-2 font-mono text-[0.65rem] text-terminal-ink-faint">
            made by{" "}
            <a
              href={BYLINE.href}
              target="_blank"
              rel="noreferrer"
              className="byline-link text-terminal-ink-dim crt-persist hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              {BYLINE.name}
            </a>
          </p>
        </SidebarFooter>

        {/* The panel's own edge is the collapse control, the way an editor
            collapses a sidebar. Keyboard users get ctrl+b. */}
        <SidebarRail />
      </Sidebar>

      {/* The chrome holds still at viewport height and the buffer scrolls
          inside it, so the status bar never rides off-screen. */}
      <SidebarInset className="min-h-0 overflow-hidden">
        {/* The title bar of the open buffer. Everything else on the screen is
            labelled the way a panel is — a Cyrillic caption, a rule, keys with
            borders — and this bar used to be the one place speaking plain app
            chrome, so it is dressed the same: the machine names what is open,
            then the keys that act on it. */}
        <header className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b bg-background px-3">
          <SidebarTrigger className="size-6 rounded-none border border-terminal-rule text-terminal-ink-dim hover:border-terminal-edge hover:bg-transparent hover:text-primary md:hidden" />
          <Separator orientation="vertical" className="h-4 md:hidden" />

          <span className="flex min-w-0 flex-1 items-baseline gap-2 font-mono text-[0.72rem]">
            <span className="shrink-0 text-[0.62rem] tracking-[0.16em] text-terminal-chrome-dim uppercase">
              БУФЕР //
            </span>
            <span className="min-w-0 truncate">
              <span className="text-terminal-ink-faint">~/</span>
              <span className="text-terminal-ink">{path}</span>
            </span>
          </span>

          <CommandTrigger className="hidden sm:inline-flex" />

          {/* Bender is the face this site was drawn in, so it is the default
              here even though the toolkit ships Play — Bender has no Cyrillic
              and cannot be the library-wide default. */}
          <FontPicker
            defaultFace="Bender"
            className="size-6 rounded-none border border-terminal-rule text-terminal-ink-dim hover:border-terminal-edge hover:bg-transparent hover:text-primary"
          />
        </header>

        {gauge}

        {/* scroll-smooth belongs here, not on <html>: this element is what
            actually scrolls, so it is what a TOC anchor jump moves. */}
        <div
          data-slot="buffer"
          className="relative z-1 min-w-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth motion-reduce:scroll-auto"
        >
          {children}
        </div>

        <SiteLog />

        <StatusBar fields={status} />
      </SidebarInset>

      <CommandPalette index={commandIndex} />

      {/* The counts come from the index that is already built for the palette,
          so the boot log reports this build rather than re-reading disk. */}
      <ColdBoot
        posts={commandIndex.posts.length}
        projects={commandIndex.projects.length}
        games={commandIndex.games.length}
        cms={isAdminVisible()}
        style={home.render.style}
      />
    </SidebarProvider>
  )
}
