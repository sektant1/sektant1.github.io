import { RouterProvider as AriaRouterProvider } from "react-aria-components"
import { Outlet, useHref, useLocation, useNavigate } from "react-router"
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

import { BuffersProvider, useBuffers } from "@/layout/buffers"
import { CommandPalette } from "@/layout/command-palette"
import { EditorTabs } from "@/layout/editor-tabs"
import { EmptyBuffer } from "@/layout/empty-buffer"
import { NavTree, type NavNode } from "@/layout/nav-tree"
import { SidebarCollapseCommand } from "@/layout/sidebar-collapse-command"
import { StatusBar } from "@/layout/status-bar"
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

/** The buffer area: the route, or the start screen when nothing is open. */
function Buffer() {
  const { open } = useBuffers()

  if (open.length === 0) {
    return (
      <div className="min-w-0 flex-1 overflow-y-auto">
        <EmptyBuffer />
      </div>
    )
  }

  return (
    <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
      <Outlet />
    </div>
  )
}

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    // Every react-aria component that takes an `href` routes through this,
    // so links navigate client-side instead of reloading the document.
    <AriaRouterProvider navigate={navigate} useHref={useHref}>
      <BuffersProvider>
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
              <div className="flex items-center gap-2 border-t border-terminal-rule px-3 py-1.5">
                <SidebarCollapseCommand />
                {/* Ventilation slots. Two rules and a gap is enough to read as
                  a chassis rather than a page edge. */}
                <span
                  aria-hidden="true"
                  className="ms-auto flex shrink-0 flex-col gap-[3px] opacity-30"
                >
                  <span className="block h-px w-6 bg-current" />
                  <span className="block h-px w-6 bg-current" />
                  <span className="block h-px w-6 bg-current" />
                </span>
              </div>
            </SidebarFooter>

            {/* The panel's own edge is the collapse control — an editor
              collapses a sidebar by its border, not by a button in the
              toolbar. Keyboard users get ctrl+b; the rail is pointer-only. */}
            <SidebarRail />
          </Sidebar>

          {/* Editor layout: the chrome holds still at viewport height and the
            buffer scrolls inside it, rather than the whole page scrolling and
            carrying the status bar off-screen. */}
          <SidebarInset className="h-svh overflow-hidden">
            <header className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b bg-background px-3">
              <SidebarTrigger className="md:hidden" />
              <Separator orientation="vertical" className="h-4 md:hidden" />

              {/* The prefix stays quiet so the current segment is what reads. */}
              <span className="min-w-0 flex-1 truncate font-mono text-[0.72rem]">
                <span className="text-terminal-ink-faint">~/</span>
                <span className="text-terminal-ink">{toSegment(pathname)}</span>
              </span>

              <FontPicker />
              <ThemeToggle />
            </header>

            <EditorTabs />

            <Buffer />

            <StatusBar />
          </SidebarInset>

          <CommandPalette />
        </SidebarProvider>
      </BuffersProvider>
    </AriaRouterProvider>
  )
}
