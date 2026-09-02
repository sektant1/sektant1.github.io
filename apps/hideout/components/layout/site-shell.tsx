import type * as React from "react"

import { CommandPalette } from "@/components/layout/command-palette"
import { ColdBoot } from "@/components/layout/cold-boot"
import { FilesPanel } from "@/components/layout/workbench/files-panel"
import { Workbench } from "@/components/layout/workbench/workbench"
import type { StatusField } from "@/components/layout/status-bar"
import { buildCommandIndex } from "@/lib/content/command-index"
import { BYLINE, SOCIAL_LINKS } from "@/lib/navigation"
import { getHomeContent } from "@/lib/content/home"
import { isAdminVisible } from "@/lib/runtime/mode"
import { getFleaPrices } from "@/lib/tarkov"
import type { ContentTreeNode } from "@/lib/content/types"

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
  const [commandIndex, home, flea] = await Promise.all([
    buildCommandIndex(),
    getHomeContent(),
    getFleaPrices(),
  ])

  return (
    <>
      <Workbench
        path={path}
        files={<FilesPanel tree={tree} />}
        flea={flea}
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
