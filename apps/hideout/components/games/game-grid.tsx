import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import { LinkButton } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

import { THUMB_ASPECT } from "@/components/media/thumbnail"
import type { GameDocument, GameMeta } from "@/lib/content/types"

export function isExternal(href: string) {
  return /^https?:\/\//.test(href)
}

type Destination = { key: string; label: string; href: string }

/**
 * Every way to get at a game.
 *
 * Playing it comes first wherever that is possible — a browser build is the
 * shortest path from reading about a game to being in it, and nothing else on
 * the card competes with that.
 */
export function destinations(meta: GameMeta): Destination[] {
  return [
    meta.playHref ? { key: "play", label: "Play", href: meta.playHref } : null,
    meta.downloadHref
      ? { key: "download", label: "Download", href: meta.downloadHref }
      : null,
    meta.storeHref ? { key: "store", label: "Store", href: meta.storeHref } : null,
    { key: "detail", label: "Write-up", href: `/games/${meta.slug}` },
    meta.repo ? { key: "repo", label: "Source", href: meta.repo } : null,
  ].filter((link): link is Destination => link !== null)
}

export function GameGrid({ games }: { games: GameDocument[] }) {
  if (games.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No games here yet</EmptyTitle>
          <EmptyDescription>
            Games live in <code>content/games/</code>. Add one from the CMS, or
            drop a folder with an <code>index.mdx</code> in it.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {games.map((game) => (
        <GameCard key={game.meta.slug} meta={game.meta} />
      ))}
    </ul>
  )
}

function GameCard({ meta }: { meta: GameMeta }) {
  const links = destinations(meta)

  return (
    <li className="flex min-w-0 flex-col border border-border crt-persist hover:border-terminal-edge">
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
              href={`/games/${meta.slug}`}
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

        {/* The two facts that decide whether someone can play it at all. */}
        {meta.engine || meta.platforms.length > 0 ? (
          <p className="font-mono text-[0.65rem] text-terminal-chrome-dim">
            {[meta.engine, meta.platforms.join(" / ")].filter(Boolean).join(" · ")}
          </p>
        ) : null}

        {meta.description ? (
          <p className="line-clamp-3 text-xs text-terminal-ink-dim">
            {meta.description}
          </p>
        ) : null}

        {meta.jam ? (
          <p className="font-mono text-[0.65rem] text-terminal-ink-faint">
            made for {meta.jam}
          </p>
        ) : null}

        {meta.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {meta.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="font-mono">
                {tag}
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
