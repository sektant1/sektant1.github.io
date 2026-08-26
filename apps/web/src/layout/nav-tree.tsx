import * as React from "react"
import { NavLink, useLocation } from "react-router"

import { cn } from "@workspace/ui/lib/utils"

export type NavNode = {
  /** Directory name, rendered with a trailing slash. */
  dir: string
  children: { label: string; href: string }[]
}

type NavTreeProps = {
  tree: NavNode[]
}

/**
 * A file-tree sidebar in the NERDTree idiom: collapsible directories, ASCII
 * disclosure markers, child counts.
 *
 * The tree markers are decorative and hidden from assistive tech — the real
 * structure is a nav of lists, and each directory toggle is a button that
 * reports its expanded state.
 */
export function NavTree({ tree }: NavTreeProps) {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = React.useState<string[]>([])

  return (
    <nav
      aria-label="Site sections"
      className="flex min-w-0 flex-col gap-1.5 pt-3 font-mono text-[0.72rem]"
    >
      <div className="flex flex-col gap-1.5">
        {tree.map((node) => {
          const isCollapsed = collapsed.includes(node.dir)

          return (
            <div key={node.dir} className="flex min-w-0 flex-col">
              <button
                type="button"
                aria-expanded={!isCollapsed}
                onClick={() =>
                  setCollapsed((current) =>
                    current.includes(node.dir)
                      ? current.filter((dir) => dir !== node.dir)
                      : [...current, node.dir]
                  )
                }
                className="flex w-full items-center gap-1 px-2 py-0.5 text-start hover:bg-muted/40"
              >
                <span
                  aria-hidden="true"
                  className="w-2 shrink-0 text-terminal-chrome-dim"
                >
                  {isCollapsed ? "▸" : "▾"}
                </span>
                <span className="truncate text-primary">{node.dir}/</span>
                <span className="shrink-0 text-[0.65rem] text-terminal-ink-faint">
                  ({node.children.length})
                </span>
              </button>

              {isCollapsed ? null : (
                <ul className="flex flex-col">
                  {node.children.map((child, index) => {
                    const isLast = index === node.children.length - 1
                    const isActive =
                      child.href === "/"
                        ? pathname === "/"
                        : pathname === child.href ||
                          pathname.startsWith(`${child.href}/`)

                    return (
                      <li key={child.href} className="flex min-w-0">
                        {/* Box-drawing guides, purely decorative. */}
                        <span
                          aria-hidden="true"
                          className="ps-3 text-terminal-ink-faint select-none"
                        >
                          {isLast ? "└─" : "├─"}
                        </span>
                        <NavLink
                          to={child.href}
                          className={cn(
                            "min-w-0 flex-1 truncate px-1.5 py-0.5 transition-colors",
                            isActive
                              ? "bg-terminal-wash text-primary crt-glow-soft"
                              : "text-terminal-ink-dim hover:bg-muted/40 hover:text-foreground"
                          )}
                        >
                          {child.label}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
