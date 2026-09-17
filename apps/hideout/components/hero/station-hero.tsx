import Link from "next/link"
import { AsciiBannerView } from "@workspace/ui/components/ascii-banner-view"
import { TerminalFrame } from "@workspace/ui/components/terminal-frame"
import { renderAsciiArt } from "@workspace/ui/lib/ascii-art"

import { ActivityTrace } from "@/components/hero/activity-trace"
import { GeoPanel } from "@/components/hero/geo-panel"
import type { ActivityBucket } from "@/lib/activity"
import { BANNER_FONT_OPTIONS } from "@/lib/banner-font"
import { pad } from "@/lib/format"
import type { HomeContent } from "@/lib/content/home-schema"
import type { RenderStyle } from "@/lib/render-style"

export type HeroTag = {
  name: string
  count: number
}

/** One thing the archive gained, whatever kind it was. */
export type HeroEntry = {
  kind: "post" | "project" | "game"
  title: string
  href: string
  /** ISO date, as the front matter wrote it. */
  date: string
}

type StationHeroProps = {
  posts: number
  projects: number
  minutes: number
  /** The tags the archive actually uses, busiest first. */
  tags: HeroTag[]
  /** The last few things the archive gained, newest first. */
  recent: HeroEntry[]
  /** How often the archive changed, month by month. */
  activity: ActivityBucket[]
  /** Every string drawn here, editable at /admin/home. */
  content: HomeContent["hero"]
  /** How the globe is drawn, editable at /admin/home. */
  renderStyle?: RenderStyle
}

/**
 * The plate the front page opens on: the station's name and what its operator
 * does.
 *
 * Split from the instruments so the work index can sit between the two — a
 * recruiter gives a page about ten seconds, and the work has to be inside them.
 */
export function StationBanner({ content }: { content: HomeContent["hero"] }) {
  return (
    <header className="field-frame overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
      <h1 className="sr-only">{content.srTitle}</h1>

      <div aria-hidden="true" className="hidden xl:block">
        <HeroBanner text={content.bannerWide} />
      </div>

      {/* Block glyphs overrun their line box, so nine rows of art collide
          once stacked and fit to a phone. The gap pays that back. */}
      <div aria-hidden="true" className="flex flex-col gap-4 xl:hidden">
        <HeroBanner text={content.bannerStackedTop} />
        <HeroBanner text={content.bannerStackedBottom} quiet />
      </div>

      {/* The role takes the loud slot: it is the line a stranger needs. The
          motto stays on the plate, quieter, under the prose. */}
      <div className="mt-3 flex flex-col gap-1 border-t border-terminal-rule pt-3">
        <p className="font-sans text-base leading-tight font-bold tracking-[0.08em] text-primary uppercase crt-glow-soft sm:text-xl">
          {content.role}
        </p>
        <p className="max-w-2xl text-xs leading-relaxed text-terminal-ink-dim sm:text-sm">
          {content.description}
        </p>
        <p className="font-mono text-[0.68rem] text-terminal-ink-faint">
          {content.tagline}
        </p>
      </div>

      {/* Chrome only, so a phone spends the line on the work instead. */}
      <p className="mt-3 hidden items-center justify-between gap-3 border-t border-terminal-rule pt-2 font-mono text-[0.62rem] tracking-[0.15em] text-terminal-chrome-dim uppercase sm:flex">
        <span>
          <span className="text-terminal-ink-faint">{content.systemLabel}</span>{" "}
          {content.systemUnit}
        </span>
        <span>{content.operator}</span>
      </p>
    </header>
  )
}

/**
 * The front page's instrument panel.
 *
 * Archive on the left, tracked object on the right. Every readout is a value
 * the build knows — a count, a reading time, a coordinate — never invented.
 */
export function StationHero({
  posts,
  projects,
  minutes,
  tags,
  recent,
  activity,
  content,
  renderStyle,
}: StationHeroProps) {
  return (
    <section className="@container">
      <div className="grid items-stretch gap-4 @min-[56rem]:grid-cols-[minmax(20rem,0.78fr)_minmax(0,1.45fr)]">
        <TerminalFrame
          title={content.summaryTitle}
          stamp={`${pad(posts + projects)} ITEMS`}
          // Both frames on this row carry a footer rule, because the pair reads
          // as one instrument only while the two have the same anatomy: a
          // titled plate, a body, and a foot. One panel closing on a border and
          // the one beside it closing on a labelled rule is two objects.
          footer={content.summaryRef}
          footerStamp={`${pad(minutes)} MIN READ`}
          className="@container order-2 min-w-0 @min-[56rem]:order-1"
          bodyClassName="grid min-w-0 grid-cols-1 @min-[40rem]:grid-cols-2"
        >
          {/* The counters, and the shape of the same fact over time. The
              column is a flex box rather than a stack so the trace can take
              the height the index opposite runs past it by: split in two, the
              two halves are never the same length, and the difference has to
              land somewhere that reads as instrument rather than as a rule
              drawn down a gap. */}
          <div className="flex min-w-0 flex-col @min-[40rem]:border-e @min-[40rem]:border-terminal-rule">
            {/* The counters that sat under this repeated the frame's own
                stamps — items above, reading time below — so they left. */}
            <ActivityTrace buckets={activity} className="min-h-24 flex-1" />
          </div>

          <div className="flex min-h-0 flex-col border-t border-terminal-rule @min-[40rem]:border-t-0">
            <div className="flex flex-col">
              <p className="console-sign flex items-center gap-2 px-2 pt-2 text-terminal-chrome-dim">
                {content.tagsTitle}
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-terminal-rule"
                />
                <span className="text-terminal-ink-faint">
                  {pad(tags.length, 2)} LINKS
                </span>
              </p>

              {tags.length ? (
                <ul className="flex flex-wrap content-start gap-x-1 px-1 py-1.5">
                  {tags.map((tag) => (
                    <li key={tag.name}>
                      <Link
                        href={`/posts?tag=${encodeURIComponent(tag.name)}`}
                        className="group/tag flex min-h-11 items-center gap-1.5 px-1.5 font-mono text-[0.7rem] tracking-wide text-terminal-ink-dim lowercase crt-persist hover:bg-terminal-wash hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:min-h-0 md:py-1"
                      >
                        <span
                          aria-hidden="true"
                          className="text-terminal-chrome-dim group-hover/tag:text-primary"
                        >
                          &gt;
                        </span>
                        <span className="truncate underline decoration-dotted underline-offset-4 group-hover/tag:decoration-solid">
                          #{tag.name}
                        </span>
                        <span className="text-terminal-ink-faint tabular-nums group-hover/tag:text-primary">
                          {pad(tag.count, 2)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="console-note p-2 text-terminal-ink-faint">
                  no topics yet
                </p>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col border-t border-terminal-rule">
              <p className="console-sign flex items-center gap-2 px-2 pt-2 text-terminal-chrome-dim">
                {content.logTitle}
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-terminal-rule"
                />
                <span className="text-terminal-ink-faint">
                  {content.logRef}
                </span>
              </p>

              {recent.length ? (
                <ul className="flex flex-col p-1">
                  {recent.map((entry) => (
                    <li key={entry.href}>
                      <Link
                        href={entry.href}
                        className="group/log flex min-h-11 items-center gap-2 px-1 font-mono text-[0.7rem] text-terminal-ink-dim crt-persist hover:bg-terminal-wash hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:min-h-0 md:py-1"
                      >
                        <span
                          aria-hidden="true"
                          className="w-10 shrink-0 text-[0.65rem] tracking-[0.08em] text-terminal-chrome-dim uppercase group-hover/log:text-primary"
                        >
                          &gt; {KINDS[entry.kind]}
                        </span>
                        <span className="min-w-0 flex-1 truncate lowercase underline decoration-dotted underline-offset-4 group-hover/log:decoration-solid">
                          {entry.title}
                        </span>
                        <span className="shrink-0 text-[0.65rem] text-terminal-ink-faint tabular-nums group-hover/log:text-primary">
                          {stampDate(entry.date)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="console-note p-2 text-terminal-ink-faint">
                  no recent work yet
                </p>
              )}
            </div>
          </div>
        </TerminalFrame>

        <GeoPanel
          title={content.globeTitle}
          hint={content.globeFooterEnd}
          style={renderStyle}
          className="geo-display order-1 min-w-0 @min-[56rem]:order-2"
        />
      </div>
    </section>
  )
}

/** What each kind is called in the log's gutter. */
const KINDS: Record<HeroEntry["kind"], string> = {
  post: "PST",
  project: "PRJ",
  game: "GME",
}

/**
 * A date the way the rest of the station prints one: the day, then the month,
 * with no year — a log four entries long never crosses one.
 */
function stampDate(iso: string) {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return iso

  const pad = (value: number) => String(value).padStart(2, "0")
  return `${pad(at.getUTCDate())} ${MONTHS[at.getUTCMonth()]}`
}

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
]

/**
 * The hero ships every face and lets CSS pick one, so the reader's stored
 * choice applies before first paint with no script and no flash. The art for
 * every face is rendered here, on the server — the browser receives glyphs
 * instead of the figlet engine and its font tables.
 */
function HeroBanner({
  text,
  quiet = false,
}: {
  text: string
  quiet?: boolean
}) {
  return BANNER_FONT_OPTIONS.map((option) => {
    const { art, columns } = renderAsciiArt(text, option.font)
    return (
      <div
        key={option.id}
        data-ascii-font={option.id}
        className="ascii-font-choice"
      >
        <AsciiBannerView
          art={art}
          columns={columns}
          text={text}
          font={option.font}
          size="lg"
          // No crt-breathe: it pulses a drop-shadow, and a shadow traced onto
          // art whose cells have to tile bleeds into the seams and tears the
          // letters apart. The banner's own dot lattice carries the glow now,
          // one diode at a time.
          //
          // The quiet line is still on the board — a stacked banner with one
          // half unlit reads as two different objects — it just holds still
          // while the other one faults.
          effect={quiet ? "panel" : "glitch"}
        />
      </div>
    )
  })
}
