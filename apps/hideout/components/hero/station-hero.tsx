import Link from "next/link"
import { AsciiBannerView } from "@workspace/ui/components/ascii-banner-view"
import { AsciiMeter } from "@workspace/ui/components/ascii-meter"
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
 * The front page as an instrument panel.
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
  // Posts and projects share a scale so their bars compare. Reading time is a
  // different unit and gets a plain row instead of a bar.
  const ceiling = Math.max(posts, projects, 1)

  return (
    <section className="flex flex-col gap-4 sm:gap-5">
      <header className="field-frame overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
        {/* The banner leads. The rule that used to sit above it named the
            station and reported the link — one of those is on the panel's own
            foot now, and the other was a typed string saying what the status
            bar reports live. */}
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

        <div className="mt-3 flex flex-col gap-3 border-t border-terminal-rule pt-3">
          <div>
            <p className="font-sans text-lg leading-tight font-bold tracking-[0.08em] text-primary uppercase crt-glow-soft sm:text-xl">
              {content.tagline}
            </p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-terminal-ink-dim sm:text-sm">
              {content.description}
            </p>
          </div>

          <p className="flex items-center justify-between gap-3 border-t border-terminal-rule pt-2 font-mono text-[0.58rem] tracking-[0.15em] text-terminal-chrome-dim uppercase sm:text-[0.62rem]">
            <span>
              <span className="text-terminal-ink-faint">
                {content.systemLabel}
              </span>{" "}
              {content.systemUnit}
            </span>
            <span>{content.operator}</span>
          </p>
        </div>
      </header>

      {/* One rail of instruments against the subject. Three columns left a
          third of the row empty once the panels carried only real values. */}
      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:gap-4">
        {/* One panel, not two. The counts and the index answer the same
            question — what is in the archive — and splitting them left the
            tags in a half-empty frame beside a globe four times its height. */}
        <TerminalFrame
          title={content.summaryTitle}
          stamp={content.summaryRef}
          footer="ARCHIVE"
          footerStamp={`${pad(posts + projects)} OBJ // ${pad(tags.length, 2)} TAG`}
          className="order-2 min-w-0 lg:order-1"
          bodyClassName="flex min-w-0 flex-col"
        >
          <ActivityTrace
            buckets={activity}
            className="h-[5.5rem] border-b border-terminal-rule"
          />

          <div className="flex flex-col gap-1.5 px-2 py-2.5">
            <AsciiMeter
              label={content.metricPosts}
              value={posts / ceiling}
              cells={16}
              display={pad(posts)}
            />
            <AsciiMeter
              label={content.metricProjects}
              value={projects / ceiling}
              cells={16}
              display={pad(projects)}
            />

            {/* Reading time is a different unit, so it is a readout on a
                leader rather than a third bar on a scale it does not share. */}
            <p className="flex items-baseline gap-1.5 pt-0.5">
              <span className="shrink-0 font-mono text-[0.58rem] tracking-wider text-terminal-chrome-dim uppercase">
                {content.metricMinutes}
              </span>
              <span
                aria-hidden="true"
                className="min-w-3 flex-1 translate-y-[-0.15em] border-b border-dotted border-terminal-rule"
              />
              <span className="shrink-0 font-mono text-[0.62rem] text-terminal-ink-dim tabular-nums">
                {minutes ? pad(minutes) : "---"}
              </span>
            </p>
          </div>

          {/* The index of what the archive covers, and the way into it. */}
          <div className="flex flex-col border-t border-terminal-rule">
            <p className="flex items-center gap-2 px-2 pt-2 font-mono text-[0.55rem] tracking-[0.28em] text-terminal-chrome-dim uppercase">
              {content.tagsTitle}
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-terminal-rule"
              />
              <span className="text-terminal-ink-faint">{content.tagsRef}</span>
            </p>

            {tags.length ? (
              <ul className="flex flex-wrap content-start gap-1 p-2">
                {tags.map((tag) => (
                  <li key={tag.name}>
                    <Link
                      href={`/posts?tag=${encodeURIComponent(tag.name)}`}
                      // Under the pointer the chip inverts rather than
                      // brightening: a tube highlights by driving the whole
                      // cell and letting the glyphs fall out of it, which is
                      // the same thing the page's own selection does.
                      className="group/tag flex items-center gap-1.5 border border-terminal-rule px-1.5 py-0.5 font-mono text-[0.62rem] tracking-wider text-terminal-ink-dim lowercase crt-persist hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <span className="text-terminal-chrome-dim group-hover/tag:text-primary-foreground">
                        #
                      </span>
                      <span className="truncate">{tag.name}</span>
                      <span className="text-terminal-ink-faint tabular-nums group-hover/tag:text-primary-foreground">
                        {pad(tag.count, 2)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-2 font-mono text-[0.62rem] text-terminal-ink-faint lowercase">
                nothing indexed yet
              </p>
            )}
          </div>

          {/* The tail of the archive, and what closes the panel.

              The counts say how much is here and the index says what it is
              about; neither says what happened last, and the column under the
              tags was empty enough that the panel ended a third of the way up
              the globe beside it. One line per entry, newest first, with the
              kind in the gutter — a log, which is the one thing on this page
              that reports a date. */}
          <div className="flex min-h-0 flex-1 flex-col border-t border-terminal-rule">
            <p className="flex items-center gap-2 px-2 pt-2 font-mono text-[0.55rem] tracking-[0.28em] text-terminal-chrome-dim uppercase">
              {content.logTitle}
              <span
                aria-hidden="true"
                className="h-px flex-1 bg-terminal-rule"
              />
              <span className="text-terminal-ink-faint">{content.logRef}</span>
            </p>

            {recent.length ? (
              <ul className="flex flex-col p-1">
                {recent.map((entry) => (
                  <li key={entry.href}>
                    <Link
                      href={entry.href}
                      className="group/log flex items-baseline gap-2 px-1 py-1 font-mono text-[0.62rem] text-terminal-ink-dim crt-persist hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <span
                        aria-hidden="true"
                        className="w-8 shrink-0 text-[0.55rem] tracking-[0.1em] text-terminal-chrome-dim uppercase"
                      >
                        {KINDS[entry.kind]}
                      </span>
                      <span className="min-w-0 flex-1 truncate lowercase">
                        {entry.title}
                      </span>
                      <span className="shrink-0 text-[0.58rem] text-terminal-ink-faint tabular-nums group-hover/log:text-primary">
                        {stampDate(entry.date)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-2 font-mono text-[0.62rem] text-terminal-ink-faint lowercase">
                nothing logged yet
              </p>
            )}
          </div>
        </TerminalFrame>

        <GeoPanel
          title={content.globeTitle}
          hint={content.globeFooterEnd}
          style={renderStyle}
          className="geo-display order-1 min-w-0 lg:order-2"
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
 * all three is rendered here, on the server — the browser receives glyphs
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
