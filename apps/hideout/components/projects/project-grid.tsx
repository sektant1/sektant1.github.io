import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { LinkButton } from "@workspace/ui/components/button"

import { THUMB_ASPECT } from "@/components/media/thumbnail"
import type { ProjectDocument, ProjectMeta } from "@/lib/content/types"

export function isExternal(href: string) {
  return /^https?:\/\//.test(href)
}

type Destination = {
  key: "project" | "repo" | "website"
  label: string
  href: string
}

/**
 * Everywhere a project can be opened.
 *
 * Front matter names a primary with `open`, and that one leads — but the
 * others are still offered rather than hidden behind it. Someone who wants the
 * source should not have to open the write-up to find the repository link.
 */
export function destinations(meta: ProjectMeta): Destination[] {
  const all: Destination[] = [
    { key: "project", label: "Write-up", href: `/projects/${meta.slug}` },
    ...(meta.repo ? [{ key: "repo" as const, label: "Repo", href: meta.repo }] : []),
    ...(meta.href
      ? [{ key: "website" as const, label: "Site", href: meta.href }]
      : []),
  ]

  const primary = meta.open ?? "website"
  return all.sort((a, b) =>
    a.key === primary ? -1 : b.key === primary ? 1 : 0
  )
}

export function ProjectGrid({ projects }: { projects: ProjectDocument[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.meta.slug} meta={project.meta} />
      ))}
    </ul>
  )
}

function ProjectCard({ meta }: { meta: ProjectMeta }) {
  const links = destinations(meta)

  return (
    <li className="flex min-w-0 flex-col border border-border crt-persist hover:border-terminal-edge">
      {/* The image fills the band edge to edge. These are logos and cover
          shots with their subject in the middle, so cropping the margins is
          what makes the row of cards read as one grid instead of a set of
          differently-sized stamps floating in boxes. */}
      {meta.thumbnail ? (
        <div
          className="w-full overflow-hidden border-b border-border bg-card"
          style={{ aspectRatio: THUMB_ASPECT }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.thumbnail}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="size-full object-cover object-center"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate font-sans text-sm text-foreground">
            <Link
              href={`/projects/${meta.slug}`}
              className="hover:text-primary hover:crt-glow-soft focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            >
              {meta.title}
            </Link>
          </h3>
          {meta.status ? (
            <span className="shrink-0 font-mono text-[0.65rem] tracking-widest text-terminal-chrome-dim uppercase">
              {meta.status}
            </span>
          ) : null}
        </div>

        {meta.description ? (
          <p className="line-clamp-3 text-xs text-terminal-ink-dim">
            {meta.description}
          </p>
        ) : null}

        {meta.stack.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {meta.stack.slice(0, 4).map((item) => (
              <Badge key={item} variant="outline" className="font-mono">
                {item}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {links.map((link, index) => {
            const external = isExternal(link.href)

            return (
              <LinkButton
                key={link.key}
                href={link.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                // The one front matter names is filled; the rest are outlined,
                // so the card still says where it wants to send you.
                variant={index === 0 ? "default" : "outline"}
                size="xs"
              >
                {link.label} {external ? "↗" : "→"}
              </LinkButton>
            )
          })}
        </div>
      </div>
    </li>
  )
}
