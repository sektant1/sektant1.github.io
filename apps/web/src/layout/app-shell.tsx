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
function toSegment(pathname: string) {
  return pathname === "/" ? "codex" : pathname.replace(/^\//, "")
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
          {/* Same height and bottom rule as the content header, so the two
              read as one bar across the top rather than two misaligned ones. */}
          <SidebarHeader className="h-11 justify-center border-b border-border p-0 px-3">
            <span className="truncate font-mono text-xs tracking-[0.2em] text-terminal-chrome uppercase crt-glow">
              skt codex
            </span>
          </SidebarHeader>

          <SidebarContent className="px-1">
            <NavTree tree={TREE} />
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

            {/* The prefix stays quiet so the current segment is what reads. */}
            <span className="min-w-0 flex-1 truncate font-mono text-[0.72rem]">
              <span className="text-terminal-ink-faint">~/</span>
              <span className="text-terminal-ink">{toSegment(pathname)}</span>
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
