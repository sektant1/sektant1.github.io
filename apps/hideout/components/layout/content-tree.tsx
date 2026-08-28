"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@workspace/ui/lib/utils"

import type { ContentTreeNode } from "@/lib/content/types"

/**
 * The sidebar file tree.
 *
 * It renders the real `content/` directory, so what the reader browses is the
 * repository behind the site rather than a menu that borrows the look of one.
 * Markers are decorative and hidden from assistive tech; the structure is
 * nested lists, and every directory toggle reports its expanded state.
 */
export function ContentTree({ tree }: { tree: ContentTreeNode[] }) {
  return (
    <nav
      aria-label="Content"
      className="flex min-w-0 flex-col gap-0.5 py-2 font-mono text-[0.72rem]"
    >
      <TreeLevel nodes={tree} depth={0} />
    </nav>
  )
}

function TreeLevel({
  nodes,
  depth,
}: {
  nodes: ContentTreeNode[]
  depth: number
}) {
  return (
    <ul className="flex min-w-0 flex-col">
      {nodes.map((node) =>
        node.kind === "dir" ? (
          <TreeDirectory
            key={`${node.label}-${depth}`}
            node={node}
            depth={depth}
          />
        ) : (
          <TreeLeaf key={node.href} node={node} depth={depth} />
        )
      )}
    </ul>
  )
}

function TreeDirectory({
  node,
  depth,
}: {
  node: Extract<ContentTreeNode, { kind: "dir" }>
  depth: number
}) {
  const [open, setOpen] = React.useState(node.defaultOpen ?? false)

  return (
    <li className="flex min-w-0 flex-col">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        style={{ paddingInlineStart: `${0.5 + depth * 0.75}rem` }}
        className="flex w-full items-center gap-1 py-0.5 pe-2 text-start crt-persist hover:bg-terminal-wash focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      >
        {/* [-] open, [+] closed: how a terminal tree has marked expansion
            since long before disclosure triangles existed, and it says which
            way the control goes rather than which way the node points. */}
        <span aria-hidden="true" className="shrink-0 text-terminal-chrome-dim">
          {open ? "[-]" : "[+]"}
        </span>
        <span className="truncate text-primary">{node.label}</span>
        <span className="shrink-0 text-[0.65rem] text-terminal-ink-faint">
          ({node.children.length})
        </span>
      </button>

      {open ? <TreeLevel nodes={node.children} depth={depth + 1} /> : null}
    </li>
  )
}

function TreeLeaf({
  node,
  depth,
}: {
  node: Extract<ContentTreeNode, { kind: "leaf" }>
  depth: number
}) {
  return (
    <li className="min-w-0">
      <Link
        href={node.href}
        aria-current={node.active ? "page" : undefined}
        style={{ paddingInlineStart: `${1.25 + depth * 0.75}rem` }}
        className={cn(
          "flex min-w-0 items-center gap-1.5 py-0.5 pe-2 text-terminal-ink-dim crt-persist hover:bg-terminal-wash hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
          // The open file is marked the way an editor marks it: a bar in the
          // gutter and full-strength ink, not a coloured pill.
          node.active &&
            "border-s-2 border-primary bg-terminal-wash text-foreground crt-glow-soft"
        )}
      >
        {/* A chevron on the open file, a hyphen on the rest: selection is
            marked by the cursor pointing at it, not by a bullet that every
            row carries. */}
        <span aria-hidden="true" className="shrink-0 text-terminal-chrome-dim">
          {node.active ? ">" : "-"}
        </span>
        <span className="truncate">{node.label}</span>
      </Link>
    </li>
  )
}
