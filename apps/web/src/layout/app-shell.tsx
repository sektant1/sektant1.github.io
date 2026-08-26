import { RouterProvider as AriaRouterProvider } from "react-aria-components"
import { Outlet, useHref, useLocation, useNavigate } from "react-router"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

import { FontPicker } from "@/layout/font-picker"
import { NavTree, type NavNode } from "@/layout/nav-tree"
import { ThemeToggle } from "@/layout/theme-toggle"

const TREE: NavNode[] = [
  {
    dir: "learn",
    children: [
      { label: "codex", href: "/" },
      { label: "courses", href: "/courses" },
      { label: "practice", href: "/practice" },
    ],
  },
  {
    dir: "workspace",
    children: [
      { label: "tasks", href: "/tasks" },
      { label: "notes", href: "/notes" },
      { label: "snippets", href: "/snippets" },
    ],
  },
  {
    dir: "toolkit",
    children: [
      { label: "components", href: "/components" },
      { label: "submit", href: "/submit" },
    ],
  },
]

// Shown in the header rule, so the current location reads like a path.
function toPath(pathname: string) {
  return pathname === "/" ? "~/codex" : `~${pathname}`
}

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    // Every react-aria component that takes an `href` routes through this,
    // so links navigate client-side instead of reloading the document.
    <AriaRouterProvider navigate={navigate} useHref={useHref}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="p-0 pt-3">
            <div className="flex items-center gap-2 px-3 pb-2">
              <span
                aria-hidden="true"
                className="flex size-5 shrink-0 items-center justify-center bg-primary font-mono text-[0.65rem] font-semibold text-primary-foreground"
              >
                SK
              </span>
              <span className="truncate font-mono text-xs font-semibold tracking-wide text-primary uppercase crt-glow">
                skt codex
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-1">
            <NavTree tree={TREE} root="codex" branch="local" />
          </SidebarContent>

          <SidebarFooter className="p-0">
            <div className="border-t border-terminal-rule px-3 py-1.5">
              <span className="font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim">
                :NERDTREE
              </span>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b bg-background px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <span className="min-w-0 flex-1 truncate font-mono text-[0.72rem] text-terminal-ink-dim">
              {toPath(pathname)}
            </span>
            <FontPicker />
            <ThemeToggle />
          </header>
          <div className="min-w-0 flex-1 p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AriaRouterProvider>
  )
}
