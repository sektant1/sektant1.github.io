"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { IconX } from "@tabler/icons-react"
import { FontPicker } from "@workspace/ui/components/font-picker"
import { cn } from "@workspace/ui/lib/utils"

import { ContentTree } from "@/components/layout/content-tree"
import type { ContentTreeNode } from "@/lib/content/types"

/**
 * The archive panel: the listings, a way to narrow them, and the repository.
 *
 * The three used to be one undifferentiated column — four link rows, then the
 * tree, then a font control — which read as a menu that had grown a file
 * browser. They are three jobs, so they get three bands: where to go, what to
 * look for, and what is there.
 *
 * The listing row is not the tree repeated. `content/` holds documents;
 * `/posts`, `/projects` and `/games` are the pages that index them, and
 * `/games` has no directory at all — without this row it cannot be reached.
 */

const SECTIONS = [
  { label: "posts", href: "/posts" },
  { label: "projects", href: "/projects" },
  { label: "games", href: "/games" },
  { label: "about", href: "/about" },
]

export function FilesPanel({
  tree,
  className,
}: {
  tree: ContentTreeNode[]
  className?: string
}) {
  const pathname = usePathname()
  const [filter, setFilter] = React.useState("")

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* Keys, not rows: these act on the page, and a key is what this site
          gives anything that does. Lit while its listing is the open one. */}
      <nav
        aria-label="Sections"
        className="grid shrink-0 grid-cols-2 gap-1 border-b border-sidebar-border p-2"
      >
        {SECTIONS.map((section) => {
          const active =
            pathname === section.href || pathname.startsWith(`${section.href}/`)

          return (
            <Link
              key={section.href}
              href={section.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-1.5 border px-2 font-mono text-[0.68rem] tracking-[0.08em] uppercase crt-persist focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:min-h-8",
                active
                  ? "border-primary text-primary crt-glow-soft"
                  : "border-terminal-rule text-terminal-ink-dim hover:border-terminal-edge hover:text-foreground"
              )}
            >
              <span aria-hidden="true" className="text-terminal-chrome-dim">
                &gt;
              </span>
              {section.label}
            </Link>
          )
        })}
      </nav>

      {/* The explorer's own filter. It searches the names in this tree and
          nothing else — the palette (ctrl+k) is what reads the text of every
          document, and two things that both say "search" have to differ in
          what they promise. */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-sidebar-border px-2">
        <label
          htmlFor="tree-filter"
          className="font-mono text-[0.6rem] tracking-[0.15em] text-terminal-chrome-dim uppercase"
        >
          фильтр
        </label>
        <input
          id="tree-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="name"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent font-mono text-[0.7rem] text-terminal-ink placeholder:text-terminal-ink-faint focus-visible:outline-none"
        />
        {filter ? (
          <button
            type="button"
            onClick={() => setFilter("")}
            aria-label="Clear the filter"
            className="flex size-5 shrink-0 items-center justify-center border border-terminal-rule text-terminal-chrome-dim crt-persist hover:border-terminal-edge hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            <IconX className="size-3" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ContentTree tree={tree} filter={filter} />
      </div>

      {/* The reading face. Pinned to the foot of the panel rather than left to
          scroll off the end of the archive: it is a setting, not an entry. */}
      <div className="flex shrink-0 items-center gap-2 border-t border-sidebar-border px-3 py-2">
        <span className="font-mono text-[0.6rem] tracking-[0.2em] text-terminal-chrome-dim uppercase">
          шрифт
        </span>
        <FontPicker
          defaultFace="Bender"
          className="ms-auto size-6 rounded-none border border-terminal-rule text-terminal-ink-dim hover:border-terminal-edge hover:bg-transparent hover:text-primary"
        />
      </div>
    </div>
  )
}
