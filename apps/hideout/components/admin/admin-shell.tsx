"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FontPicker } from "@workspace/ui/components/font-picker"
import { LinkButton } from "@workspace/ui/components/button"
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
import { Toaster } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"

const SECTIONS = [
  {
    dir: "cms",
    links: [
      { label: "dashboard", href: "/admin" },
      { label: "front page", href: "/admin/home" },
      { label: "posts", href: "/admin/posts" },
      { label: "projects", href: "/admin/projects" },
      { label: "games", href: "/admin/games" },
    ],
  },
  {
    dir: "new",
    links: [
      { label: "post", href: "/admin/posts/new" },
      { label: "project", href: "/admin/projects/new" },
      { label: "game", href: "/admin/games/new" },
    ],
  },
]

type AdminShellProps = {
  /** The file being edited, or the view being listed. */
  path: string
  /** Editor mode shown in the status block. */
  mode?: "browse" | "edit"
  /** True once the form has changes that are not on disk. */
  dirty?: boolean
  status?: { label: string; value: React.ReactNode }[]
  actions?: React.ReactNode
  children: React.ReactNode
}

/**
 * The CMS chrome.
 *
 * Same editor as the public site, switched to writing: the mode block reads
 * EDIT instead of READ and turns into an unsaved-changes warning, and the
 * sidebar lists the operations rather than the content — when you are here you
 * came to change something, not to browse.
 *
 * This runs against files on the local disk and is not part of the published
 * site, which is why it is allowed to be denser than the reading pages.
 */
export function AdminShell({
  path,
  mode = "browse",
  dirty = false,
  status = [],
  actions,
  children,
}: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    // The provider defaults to min-h-svh, which is a full viewport *below*
    // the classification banner and pushes the status bar off the bottom. It
    // fills the space it is given instead.
    <SidebarProvider className="h-full min-h-0">
      <Sidebar>
        <SidebarHeader className="h-11 justify-center border-b border-sidebar-border p-0 px-3">
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-mono text-xs tracking-[0.2em] text-primary uppercase crt-glow">
              sektant
            </span>
            <span className="truncate font-mono text-[0.6rem] tracking-[0.2em] text-terminal-ink-faint uppercase">
              cms // local
            </span>
          </span>
        </SidebarHeader>

        <SidebarContent className="px-1">
          <nav
            aria-label="CMS sections"
            className="flex flex-col gap-3 py-3 font-mono text-[0.72rem]"
          >
            {SECTIONS.map((section) => (
              <div key={section.dir} className="flex flex-col">
                <span className="px-2 py-0.5 text-primary">{section.dir}/</span>
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 py-0.5 ps-5 pe-2 text-terminal-ink-dim hover:bg-terminal-wash hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                      pathname === link.href &&
                        "border-s-2 border-primary bg-terminal-wash text-foreground"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="text-terminal-chrome-dim"
                    >
                      {pathname === link.href ? ">" : "-"}
                    </span>
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </SidebarContent>

        <SidebarFooter className="p-0">
          <div className="flex items-center gap-3 border-t border-sidebar-border px-3 py-2 font-mono text-[0.65rem]">
            <Link href="/" className="text-terminal-ink-dim hover:text-primary">
              view site
            </Link>
            <button
              type="button"
              className="text-terminal-ink-dim hover:text-primary"
              onClick={() => {
                void fetch("/api/admin/logout", { method: "POST" }).then(() => {
                  router.replace("/admin/login")
                  router.refresh()
                })
              }}
            >
              sign out
            </button>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-0 overflow-hidden">
        <header className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b bg-background px-3">
          <SidebarTrigger className="md:hidden" />
          <Separator orientation="vertical" className="h-4 md:hidden" />

          <span className="min-w-0 flex-1 truncate font-mono text-[0.72rem]">
            <span className="text-terminal-ink-faint">~/</span>
            <span className="text-terminal-ink">{path}</span>
            {/* The editor's own unsaved marker, in the place an editor puts
                it: next to the filename. */}
            {dirty ? <span className="ms-1 text-primary">[+]</span> : null}
          </span>

          {actions}
          <FontPicker defaultFace="Bender" />
        </header>

        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>

        <footer className="z-10 flex h-6 shrink-0 items-center gap-3 overflow-hidden border-t bg-sidebar px-3 font-mono text-[0.65rem] tracking-wider text-terminal-ink-dim uppercase">
          <span
            className={cn(
              "shrink-0 px-1.5 py-0.5 font-medium",
              dirty
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            )}
          >
            [ {dirty ? "unsaved" : mode} ]
          </span>

          {status.map((field) => (
            <span key={field.label} className="hidden shrink-0 gap-1 sm:flex">
              <span className="text-terminal-ink-faint">{field.label}</span>
              <span className="text-terminal-ink">{field.value}</span>
            </span>
          ))}

          <span className="ms-auto shrink-0 text-terminal-chrome-dim">
            local
          </span>
        </footer>
      </SidebarInset>

      {/* theme is pinned rather than read from next-themes: this site has one
          mode, and there is no ThemeProvider above to ask. */}
      <Toaster theme="dark" position="bottom-right" />
    </SidebarProvider>
  )
}

/** A header action, so pages do not each restate the button styling. */
export function AdminAction({
  children,
  ...props
}: React.ComponentProps<typeof LinkButton>) {
  return (
    <LinkButton variant="outline" size="xs" {...props}>
      {children}
    </LinkButton>
  )
}
