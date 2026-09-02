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
export function ContentTree({
  tree,
  /** Lowercased. Only leaves whose label contains it survive. */
  filter = "",
}: {
  tree: ContentTreeNode[]
  filter?: string
}) {
  const shown = React.useMemo(() => filterTree(tree, filter), [tree, filter])

  if (shown.length === 0) {
    return (
      <p className="px-3 py-3 font-mono text-[0.68rem] text-terminal-ink-faint lowercase">
        nothing here matches
      </p>
    )
  }

  return (
    <nav
      aria-label="Content"
      className="flex min-w-0 flex-col gap-0.5 py-2 font-mono text-[0.72rem]"
    >
      <TreeLevel nodes={shown} depth={0} filtering={filter.length > 0} />
    </nav>
  )
}

/**
 * The tree with everything that does not match taken out.
 *
 * Directories survive on their children: an empty one under a filter is a
 * folder the reader would open to find nothing in, which is worse than not
 * offering it. A directory that matches by its own name keeps all of its
 * children — searching for "posts" is asking for the posts, not for the
 * files that happen to repeat the word.
 */
function filterTree(
  nodes: ContentTreeNode[],
  filter: string
): ContentTreeNode[] {
  const needle = filter.trim().toLowerCase()
  if (!needle) return nodes

  const kept: ContentTreeNode[] = []
  for (const node of nodes) {
    const hit = node.label.toLowerCase().includes(needle)

    if (node.kind === "leaf") {
      if (hit) kept.push(node)
      continue
    }

    if (hit) {
      kept.push(node)
      continue
    }

    const children = filterTree(node.children, needle)
    if (children.length > 0) kept.push({ ...node, children })
  }

  return kept
}

function TreeLevel({
  nodes,
  depth,
  filtering,
}: {
  nodes: ContentTreeNode[]
  depth: number
  /** A filtered tree is already the answer, so every directory in it is open. */
  filtering: boolean
}) {
  return (
    <ul className="flex min-w-0 flex-col">
      {nodes.map((node) =>
        node.kind === "dir" ? (
          <TreeDirectory
            key={`${node.label}-${depth}`}
            node={node}
            depth={depth}
            filtering={filtering}
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
  filtering,
}: {
  node: Extract<ContentTreeNode, { kind: "dir" }>
  depth: number
  filtering: boolean
}) {
  const [chosen, setChosen] = React.useState(node.defaultOpen ?? false)
  // While a filter is on, what is left is what matched, and collapsing it
  // would hide the answer behind the same click that asked the question. The
  // reader's own choice is remembered underneath and returns with the filter.
  const open = filtering || chosen

  return (
    <li className="flex min-w-0 flex-col">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setChosen((value) => !value)}
        style={{ paddingInlineStart: `${0.5 + depth * 0.75}rem` }}
        // 44px of row on a touch screen, where this tree is a full-height
        // sheet and the only way into the archive; back to a dense list on a
        // pointer, where the whole tree should be readable at once.
        className="flex min-h-11 w-full items-center gap-1 pe-2 text-start crt-persist hover:bg-terminal-wash focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:min-h-0 md:py-0.5"
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

      {open ? (
        <TreeLevel
          nodes={node.children}
          depth={depth + 1}
          filtering={filtering}
        />
      ) : null}
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
          "flex min-h-11 min-w-0 items-center gap-1.5 pe-2 text-terminal-ink-dim crt-persist hover:bg-terminal-wash hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:min-h-0 md:py-0.5",
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
