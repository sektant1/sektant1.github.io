import Link from "next/link"

import { destinations as gameDestinations } from "@/components/games/game-grid"
import { THUMB_ASPECT } from "@/components/media/thumbnail"
import {
  destinations as projectDestinations,
  isExternal,
} from "@/components/projects/project-grid"
import type { GameDocument, ProjectDocument } from "@/lib/content/types"

/** A project or a game, reduced to what one row of the index prints. */
export type Work = {
  kind: "project" | "game"
  slug: string
  title: string
  description?: string
  thumbnail?: string
  date: string
  /** What it is made of: a project's stack, a game's engine and platforms. */
  makeup: string[]
  /** Where it opens, primary first. */
  links: { key: string; label: string; href: string }[]
}

/** Every work the station holds, newest first. */
export function worksFrom(
  projects: ProjectDocument[],
  games: GameDocument[]
): Work[] {
  return [
    ...projects.map(({ meta }) => ({
      kind: "project" as const,
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      thumbnail: meta.thumbnail,
      date: meta.date,
      makeup: meta.stack,
      links: projectDestinations(meta),
    })),
    ...games.map(({ meta }) => ({
      kind: "game" as const,
      slug: meta.slug,
      title: meta.title,
      description: meta.description,
      thumbnail: meta.thumbnail,
      date: meta.date,
      makeup: [meta.engine, ...meta.platforms].filter((item): item is string =>
        Boolean(item)
      ),
      links: gameDestinations(meta),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * The whole body of work, one row each, on the front page.
 *
 * Rows rather than cards so every work fits in the first screen or two: a
 * card grid put three projects three screens down, and a recruiter does not
 * scroll that far. The row is one target, opening where front matter says the
 * work should open; the other destinations ride along where there is room.
 *
 * Needs an `@container` ancestor: it is laid out by the buffer's width, which
 * the side panel changes, not by the viewport's.
 */
export function WorkIndex({ works }: { works: Work[] }) {
  return (
    <ul className="grid gap-2 @min-[44rem]:grid-cols-2">
      {works.map((work) => (
        <WorkRow key={`${work.kind}:${work.slug}`} work={work} />
      ))}
    </ul>
  )
}

function WorkRow({ work }: { work: Work }) {
  const [primary, ...others] = work.links
  const external = isExternal(primary.href)

  return (
    <li className="group relative flex min-w-0 gap-3 border border-terminal-rule p-2 crt-persist hover:border-terminal-edge hover:bg-terminal-wash">
      <div
        aria-hidden="true"
        className="work-thumb w-26 shrink-0 self-start overflow-hidden border border-terminal-rule @min-[44rem]:w-36"
        style={{ aspectRatio: THUMB_ASPECT }}
      >
        {work.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={work.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {work.makeup.length > 0 ? (
          <p className="console-label truncate text-terminal-chrome-dim">
            {work.makeup.slice(0, 4).join(" / ")}
          </p>
        ) : null}

        {/* Stretched over the row, so the whole row is the target. The
            heading holds the title alone: the breadcrumb reads its text. */}
        <Link
          href={primary.href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="flex items-baseline gap-1.5 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-1 focus-visible:after:ring-ring"
        >
          <h3 className="font-sans text-sm leading-snug text-foreground group-hover:text-primary">
            {work.title}
          </h3>
          <span aria-hidden="true" className="text-terminal-chrome-dim">
            {external ? "↗" : "→"}
          </span>
          {external ? (
            <span className="sr-only">
              ({primary.label.toLowerCase()}, opens in a new tab)
            </span>
          ) : null}
        </Link>

        {work.description ? (
          <p className="line-clamp-2 text-xs text-terminal-ink-dim">
            {work.description}
          </p>
        ) : null}

        {/* Below md a 44px target each would double the row, and the row
            itself already opens the work; its write-up carries the rest. */}
        {others.length > 0 ? (
          <p className="relative z-10 mt-auto hidden flex-wrap gap-x-3 pt-1 font-mono text-[0.65rem] md:flex">
            {others.map((link) => {
              const out = isExternal(link.href)
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  target={out ? "_blank" : undefined}
                  rel={out ? "noreferrer" : undefined}
                  className="text-terminal-chrome-dim lowercase underline decoration-dotted underline-offset-4 hover:text-primary hover:decoration-solid focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {link.label} {out ? "↗" : "→"}
                </Link>
              )
            })}
          </p>
        ) : null}
      </div>
    </li>
  )
}
