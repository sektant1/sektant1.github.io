"use client"

import type * as React from "react"
import Link from "next/link"
import { cn } from "@workspace/ui/lib/utils"

import { SiteMark } from "@/components/layout/site-mark"
import {
  Visor,
  MODEL_LABEL,
  VisorPlate,
} from "@/components/layout/workbench/visor"
import type { SidePanel as SidePanelId } from "@/lib/workbench"

/**
 * The panel the rail selects.
 *
 * One panel at a time, each with the same head: a Cyrillic caption on a rule,
 * the way every other titled surface on this station is labelled. What used to
 * be one undifferentiated sidebar column — host mark, sections, file tree,
 * social links, byline — is three panels with one job each.
 */

export type SidePanelProps = {
  panel: SidePanelId
  /** The sections nav and content tree, rendered on the server. */
  files: React.ReactNode
  links: { label: string; href: string }[]
  byline: { name: string; href: string }
  /**
   * Why the panel is not drawing the instrument, if it is not. There is one
   * renderer on this site, and something else on screen may already have it.
   */
  visorBusy: string | null
  className?: string
}

export function SidePanelView({
  panel,
  files,
  links,
  byline,
  visorBusy,
  className,
}: SidePanelProps) {
  if (panel === null) return null

  return (
    <aside
      aria-label={CAPTIONS[panel].aria}
      className={cn(
        "flex w-64 shrink-0 flex-col overflow-hidden border-e border-sidebar-border bg-sidebar",
        className
      )}
    >
      <PanelHead caption={CAPTIONS[panel].caption} />

      {/* The archive pins its listings, its filter and the face control and
          scrolls only the tree between them, so it is handed the space rather
          than a scroller. The other two are short enough to scroll whole. */}
      {panel === "files" ? (
        files
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {panel === "visor" ? (
            <div className="flex flex-col gap-2 p-3">
              {visorBusy ? <VisorPlate reason={visorBusy} /> : <Visor />}
              <p className="flex items-center justify-between font-mono text-[0.6rem] text-terminal-chrome-dim uppercase">
                <span>модель</span>
                <span className="text-terminal-ink-dim">{MODEL_LABEL}</span>
              </p>
            </div>
          ) : (
            <LinksPanel links={links} byline={byline} />
          )}
        </div>
      )}

    </aside>
  )
}

const CAPTIONS: Record<
  Exclude<SidePanelId, null>,
  { caption: string; aria: string }
> = {
  files: { caption: "АРХИВ", aria: "Content" },
  visor: { caption: "ВИЗОР", aria: "Instrument" },
  links: { caption: "СВЯЗЬ", aria: "Contact" },
}

function PanelHead({ caption }: { caption: string }) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-sidebar-border px-3">
      <Link
        href="/"
        aria-label="Sektant's Hideout, home"
        className="group/mark flex min-w-0 items-center gap-2 leading-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      >
        <SiteMark className="size-4 shrink-0 crt-glow-soft" />
        <span className="truncate font-mono text-[0.62rem] tracking-[0.2em] text-primary uppercase crt-glow">
          sektant
        </span>
      </Link>

      <span
        aria-hidden="true"
        className="ms-auto font-mono text-[0.6rem] tracking-[0.2em] text-terminal-chrome-dim uppercase"
      >
        {caption}
      </span>
    </div>
  )
}

/**
 * The ways off this station, and the one human name in the chrome.
 *
 * They used to sit under the file tree, where a reader scrolling the archive
 * ran into them by accident. On their own panel they are a destination.
 */
function LinksPanel({
  links,
  byline,
}: {
  links: { label: string; href: string }[]
  byline: { name: string; href: string }
}) {
  return (
    <div className="flex flex-col gap-4 p-3">
      <ul className="flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="flex items-center gap-1.5 py-0.5 font-mono text-[0.72rem] text-terminal-ink-dim underline-offset-4 crt-persist hover:text-primary hover:underline focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span aria-hidden="true" className="text-terminal-chrome-dim">
                &gt;
              </span>
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="border-t border-sidebar-border pt-3 font-mono text-[0.65rem] text-terminal-ink-faint">
        made by{" "}
        <a
          href={byline.href}
          target="_blank"
          rel="noreferrer"
          className="byline-link text-terminal-ink-dim underline-offset-4 crt-persist hover:text-primary hover:underline focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        >
          {byline.name}
        </a>
      </p>
    </div>
  )
}
