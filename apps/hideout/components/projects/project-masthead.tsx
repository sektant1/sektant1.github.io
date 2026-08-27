import { LinkButton } from "@workspace/ui/components/button"

import { destinations, isExternal } from "@/components/projects/project-grid"
import { THUMB_ASPECT } from "@/components/media/thumbnail"
import type { ProjectMeta } from "@/lib/content/types"

/**
 * What a project page needs above the write-up: what it is, what it is built
 * with, and every way out of here.
 *
 * The links are buttons because they are the point of the page — a reader who
 * came to find the repository should not have to read to the bottom. The
 * write-up itself is dropped from the list: they are already on it.
 */
export function ProjectMasthead({ meta }: { meta: ProjectMeta }) {
  const links = destinations(meta).filter((link) => link.key !== "project")

  return (
    <div className="flex flex-col gap-3">
      {meta.thumbnail ? (
        <div
          className="w-full overflow-hidden border border-border bg-card"
          style={{ aspectRatio: THUMB_ASPECT }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.thumbnail}
            alt=""
            aria-hidden="true"
            className="size-full object-cover object-center"
          />
        </div>
      ) : null}

      {meta.description ? (
        <p className="max-w-prose text-sm text-terminal-ink">{meta.description}</p>
      ) : null}

      {meta.stack.length > 0 ? (
        <p className="font-mono text-[0.7rem] text-terminal-chrome-dim">
          {meta.stack.join(" · ")}
        </p>
      ) : null}

      {links.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => (
            <LinkButton
              key={link.key}
              href={link.href}
              target={isExternal(link.href) ? "_blank" : undefined}
              rel={isExternal(link.href) ? "noreferrer" : undefined}
              variant={index === 0 ? "default" : "outline"}
              size="sm"
            >
              {link.label} {isExternal(link.href) ? "↗" : "→"}
            </LinkButton>
          ))}
        </div>
      ) : null}
    </div>
  )
}
