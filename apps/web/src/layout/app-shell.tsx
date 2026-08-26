import {
  IconBook,
  IconChecklist,
  IconCode,
  IconComponents,
  IconNotebook,
  IconSchool,
  IconSend,
  IconTargetArrow,
} from "@tabler/icons-react"
import { RouterProvider as AriaRouterProvider } from "react-aria-components"
import { Outlet, useHref, useLocation, useNavigate } from "react-router"
import { Separator } from "@workspace/ui/components/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

import { ThemeToggle } from "@/layout/theme-toggle"

const NAV = [
  {
    label: "Learn",
    items: [
      { title: "Codex", href: "/", icon: IconBook },
      { title: "Courses", href: "/courses", icon: IconSchool },
      { title: "Practice", href: "/practice", icon: IconTargetArrow },
    ],
  },
  {
    label: "Workspace",
    items: [
      { title: "Tasks", href: "/tasks", icon: IconChecklist },
      { title: "Notes", href: "/notes", icon: IconNotebook },
      { title: "Snippets", href: "/snippets", icon: IconCode },
    ],
  },
  {
    label: "Toolkit",
    items: [
      { title: "Components", href: "/components", icon: IconComponents },
      { title: "Submit", href: "/submit", icon: IconSend },
    ],
  },
]

function isActiveHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    // Every react-aria component that takes an `href` routes through this,
    // so links navigate client-side instead of reloading the document.
    <AriaRouterProvider navigate={navigate} useHref={useHref}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex size-6 shrink-0 items-center justify-center bg-primary font-mono text-[11px] font-semibold text-primary-foreground">
                SK
              </div>
              <span className="truncate font-mono text-xs font-semibold tracking-wide uppercase group-data-[collapsible=icon]:hidden">
                SKT Codex
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {NAV.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          href={item.href}
                          tooltip={item.title}
                          isActive={isActiveHref(pathname, item.href)}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <div className="px-2 py-1 font-mono text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
              skt-ui-toolkit
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b bg-background px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <div id="shell-breadcrumb" className="min-w-0 flex-1" />
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
