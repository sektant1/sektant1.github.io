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
  root: string
  branch?: string
}

/**
 * A file-tree sidebar in the NERDTree idiom: collapsible directories, ASCII
 * disclosure markers, child counts.
 *
 * The tree markers are decorative and hidden from assistive tech — the real
 * structure is a nav of lists, and each directory toggle is a button that
 * reports its expanded state.
 */
export function NavTree({ tree, root, branch = "local" }: NavTreeProps) {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = React.useState<string[]>([])

  return (
    <nav
      aria-label="Site sections"
      className="flex min-w-0 flex-col gap-3 font-mono text-[11px]"
    >
      <div className="flex flex-col gap-0.5 px-2">
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-1 shrink-0 bg-primary shadow-[0_0_6px_var(--primary)]"
          />
          <span className="tracking-[0.25em] text-primary/70 uppercase">
            [nav]
          </span>
        </div>
        <span className="truncate tracking-wide text-primary crt-glow">
          ~/{root.toUpperCase()}
        </span>
        <span className="text-[10px] text-foreground/40 italic">
          // {branch}
        </span>
      </div>

      <div aria-hidden="true" className="mx-2 border-t border-border/60" />

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
                  className="w-2 shrink-0 text-primary/70"
                >
                  {isCollapsed ? "▸" : "▾"}
                </span>
                <span className="truncate text-primary">{node.dir}/</span>
                <span className="shrink-0 text-[10px] text-foreground/35">
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
                          className="ps-3 text-foreground/20 select-none"
                        >
                          {isLast ? "└─" : "├─"}
                        </span>
                        <NavLink
                          to={child.href}
                          className={cn(
                            "min-w-0 flex-1 truncate px-1.5 py-0.5 transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary crt-glow-soft"
                              : "text-foreground/70 hover:bg-muted/40 hover:text-foreground"
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
