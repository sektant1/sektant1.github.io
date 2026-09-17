import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"

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

export function destinations(meta: ProjectMeta): Destination[] {
  return [
    { key: "project", label: "Write-up", href: `/projects/${meta.slug}` },
    ...(meta.repo
      ? [{ key: "repo" as const, label: "Repo", href: meta.repo }]
      : []),
    ...(meta.href
      ? [{ key: "website" as const, label: "Site", href: meta.href }]
      : []),
  ]
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
  return (
    <li className="relative flex min-w-0 flex-col border border-border crt-persist hover:border-terminal-edge">
      {/* The image fills the band edge to edge, cropped rather than
          stretched: every card carries the same band, and nothing in it is
          squashed out of its own proportions. */}
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
            className="size-full object-cover"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate font-sans text-sm text-foreground">
            <Link
              href={`/projects/${meta.slug}`}
              className="after:absolute after:inset-0 hover:text-primary hover:crt-glow-soft focus-visible:outline-none focus-visible:after:ring-1 focus-visible:after:ring-ring"
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

        <span
          className="mt-auto pt-1 font-mono text-xs text-primary"
          aria-hidden="true"
        >
          read write-up →
        </span>
      </div>
    </li>
  )
}
