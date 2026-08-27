import { LinkButton } from "@workspace/ui/components/button"

import { destinations, isExternal } from "@/components/games/game-grid"
import { THUMB_ASPECT } from "@/components/media/thumbnail"
import { Readout } from "@/components/layout/readout"
import type { GameMeta } from "@/lib/content/types"

/**
 * The header of a game page: the cover, the specs, and every way to play it.
 *
 * The specs are a readout rather than prose because they are looked up, not
 * read — someone checking whether it runs on Linux wants to find that line,
 * not a sentence containing it.
 */
export function GameMasthead({ meta }: { meta: GameMeta }) {
  const links = destinations(meta).filter((link) => link.key !== "detail")

  return (
    <div className="flex flex-col gap-4">
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

      <dl className="flex max-w-xs flex-col gap-1">
        {meta.engine ? <Readout label="engine" value={meta.engine} /> : null}
        {meta.platforms.length > 0 ? (
          <Readout label="platforms" value={meta.platforms.join(" / ")} />
        ) : null}
        {meta.status ? <Readout label="status" value={meta.status} /> : null}
        {meta.jam ? <Readout label="jam" value={meta.jam} /> : null}
      </dl>

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
