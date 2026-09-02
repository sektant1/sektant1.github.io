import type * as React from "react"
import Link from "next/link"
import { FontPicker } from "@workspace/ui/components/font-picker"

import { CommandPalette } from "@/components/layout/command-palette"
import { ColdBoot } from "@/components/layout/cold-boot"
import { ContentTree } from "@/components/layout/content-tree"
import { Workbench } from "@/components/layout/workbench/workbench"
import type { StatusField } from "@/components/layout/status-bar"
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
  /** The file path of the open document, without the leading `~/`. */
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
 * This file is the seam between the server and the workbench. It reads what
 * the chrome needs from the content — the tree, the palette's index, the
 * render style the CMS holds — and hands the workbench finished markup. The
 * layout itself, and every surface in it, lives under `workbench/`.
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
    <>
      <Workbench
        path={path}
        files={<FilesPanel tree={tree} />}
        links={SOCIAL_LINKS}
        byline={BYLINE}
        status={status}
        gauge={gauge}
      >
        {children}
      </Workbench>

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
    </>
  )
}

/**
 * The archive panel: the listings, then the repository itself.
 *
 * The tree lists files. These are the listing pages above them — without this
 * row there is no way to reach /games at all, and /posts is only reachable
 * from the front page.
 */
function FilesPanel({ tree }: { tree: ContentTreeNode[] }) {
  return (
    <>
      <nav
        aria-label="Sections"
        className="flex flex-col border-b border-sidebar-border py-1 font-mono text-[0.72rem]"
      >
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex min-h-8 items-center gap-1.5 px-3 text-terminal-ink-dim underline-offset-4 crt-persist hover:bg-terminal-wash hover:text-foreground hover:underline focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:min-h-0 md:py-0.5"
          >
            <span aria-hidden="true" className="text-terminal-chrome-dim">
              &gt;
            </span>
            {section.label}
          </Link>
        ))}
      </nav>

      <ContentTree tree={tree} />

      {/* The reading faces, kept with the archive rather than in the header:
          they are a setting, and the header is where the machine reports. */}
      <div className="flex items-center gap-2 border-t border-sidebar-border px-3 py-2">
        <span className="font-mono text-[0.6rem] tracking-[0.2em] text-terminal-chrome-dim uppercase">
          шрифт
        </span>
        <FontPicker
          defaultFace="Bender"
          className="ms-auto size-6 rounded-none border border-terminal-rule text-terminal-ink-dim hover:border-terminal-edge hover:bg-transparent hover:text-primary"
        />
      </div>
    </>
  )
}
