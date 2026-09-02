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

type StationHeroProps = {
  posts: number
  projects: number
  minutes: number
  /** The tags the archive actually uses, busiest first. */
  tags: HeroTag[]
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
        <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
          <TerminalFrame
            title={content.summaryTitle}
            stamp={content.summaryRef}
            footer="ARCHIVE"
            footerStamp={`${pad(posts + projects)} OBJ`}
            className="min-w-0"
            bodyClassName="flex flex-col"
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
            </div>

            <p className="border-t border-terminal-rule px-2 py-2 font-mono text-[0.58rem] tracking-wider text-terminal-chrome-dim uppercase">
              {content.metricMinutes}
              <span className="ms-2 text-terminal-ink-dim">
                {minutes ? pad(minutes) : "---"}
              </span>
            </p>
          </TerminalFrame>

          {/* Replaces the quote that used to sit here: the index says what the
              archive covers, how much of each, and links straight into it. */}
          <TerminalFrame
            title={content.tagsTitle}
            stamp={content.tagsRef}
            footer={`${pad(tags.length, 2)} TAGS`}
            className="flex-1"
            bodyClassName="flex flex-col"
          >
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
              <p className="p-2 font-mono text-[0.62rem] text-terminal-ink-faint uppercase">
                no tags indexed yet
              </p>
            )}
          </TerminalFrame>
        </div>

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
