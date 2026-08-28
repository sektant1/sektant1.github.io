import Link from "next/link"
import { AsciiBanner } from "@workspace/ui/components/ascii-banner"

import { AsciiPlanetScene } from "@/components/ascii-planet/AsciiPlanetScene"
import { BANNER_FONT_OPTIONS } from "@/lib/banner-font"
import type { HomeContent } from "@/lib/content/home-schema"

type StationHeroProps = {
  posts: number
  projects: number
  minutes: number
  /** Every string drawn here, editable at /admin/home. */
  content: HomeContent["hero"]
}

export function StationHero({
  posts,
  projects,
  minutes,
  content,
}: StationHeroProps) {
  return (
    <section className="flex flex-col gap-5 sm:gap-6">
      <header className="field-frame overflow-hidden px-3 py-3 sm:px-5 sm:py-4">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-terminal-rule pb-2 font-mono text-[0.58rem] tracking-[0.16em] uppercase sm:text-[0.65rem]">
          <span className="text-terminal-chrome">
            <span className="text-terminal-ink-faint">{content.systemLabel}</span>{" "}
            {content.systemUnit}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-terminal-ink-dim">
            <span className="size-1.5 bg-primary shadow-[0_0_5px_var(--primary)]" />
            {content.linkStatus}
          </span>
        </div>

        <h1 className="sr-only">{content.srTitle}</h1>

        <div aria-hidden="true" className="hidden xl:block">
          <HeroBanner text={content.bannerWide} />
        </div>

        <div aria-hidden="true" className="flex flex-col gap-1 xl:hidden">
          <HeroBanner text={content.bannerStackedTop} />
          <HeroBanner text={content.bannerStackedBottom} quiet />
        </div>

        <div className="mt-3 grid gap-2 border-t border-terminal-rule pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-6">
          <div>
            <p className="font-sans text-lg leading-tight font-bold tracking-[0.08em] text-primary uppercase crt-glow-soft sm:text-xl">
              {content.tagline}
            </p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-terminal-ink-dim sm:text-sm">
              {content.description}
            </p>
          </div>
          <p className="font-mono text-[0.58rem] tracking-[0.15em] text-terminal-chrome-dim uppercase sm:text-right sm:text-[0.62rem]">
            {content.operator}
          </p>
        </div>
      </header>

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(20rem,1.18fr)_minmax(0,0.82fr)] lg:gap-6">
        <div className="order-2 flex min-w-0 flex-col gap-5">
          <div className="field-frame px-3 py-3 sm:px-4 sm:py-4">
            <div className="mb-3 flex items-center justify-between gap-3 font-mono text-[0.58rem] tracking-[0.14em] uppercase sm:text-[0.62rem]">
              <span className="text-terminal-chrome">{content.summaryTitle}</span>
              <span className="text-terminal-ink-faint">{content.summaryRef}</span>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-terminal-rule border-y border-terminal-rule">
              <Metric label={content.metricPosts} value={pad(posts)} />
              <Metric label={content.metricProjects} value={pad(projects)} />
              <Metric
                label={content.metricMinutes}
                value={minutes ? pad(minutes) : "---"}
              />
            </dl>
          </div>

          <nav
            aria-label="Quick access"
            className="field-frame px-3 py-3 sm:px-4"
          >
            <div className="mb-2 flex items-center justify-between font-mono text-[0.58rem] tracking-[0.14em] uppercase sm:text-[0.62rem]">
              <span className="text-terminal-chrome">
                {content.quickAccessTitle}
              </span>
              <span className="text-terminal-ink-faint">
                {content.quickAccessRef}
              </span>
            </div>
            <div className="flex flex-col border-t border-terminal-rule">
              {content.quickLinks.map((link, index) => (
                <QuickLink
                  key={`${link.href}-${index}`}
                  index={String(index + 1).padStart(2, "0")}
                  label={link.label}
                  href={link.href}
                />
              ))}
            </div>
          </nav>

          <blockquote className="field-frame relative mt-auto flex min-h-32 flex-col justify-between overflow-hidden px-4 py-4 sm:min-h-36 sm:px-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -end-1 -bottom-8 font-mono text-[6rem] leading-none text-primary/8 select-none sm:text-[8rem]"
            >
              &quot;
            </div>

            <div className="relative">
              <div className="mb-3 flex items-center justify-between gap-3 font-mono text-[0.56rem] tracking-[0.14em] uppercase sm:text-[0.6rem]">
                <span className="text-terminal-chrome">{content.quoteTitle}</span>
                <span className="text-terminal-ink-faint">{content.quoteRef}</span>
              </div>
              <p className="max-w-md font-sans text-sm leading-relaxed tracking-[0.03em] text-terminal-ink sm:text-base">
                {content.quoteText}
              </p>
            </div>

            <footer className="relative mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-terminal-rule pt-2 font-mono text-[0.56rem] tracking-[0.14em] uppercase sm:text-[0.6rem]">
              <span className="text-terminal-chrome-dim">{content.quoteAuthor}</span>
              <cite className="text-terminal-ink-faint not-italic">
                {content.quoteSource}
              </cite>
            </footer>
          </blockquote>
        </div>

        <figure className="field-frame geo-display order-1 flex min-w-0 flex-col overflow-hidden p-2">
          <figcaption className="flex items-center justify-between gap-3 border-b border-terminal-rule px-1 pb-2 font-mono text-[0.58rem] tracking-[0.14em] uppercase sm:text-[0.62rem]">
            <span className="text-terminal-chrome">{content.globeTitle}</span>
            <span className="text-primary crt-glow-soft">{content.globeStatus}</span>
          </figcaption>

          <div
            aria-hidden="true"
            className="absolute top-12 left-3 flex flex-col font-mono text-[0.52rem] leading-relaxed tracking-[0.12em] text-terminal-ink-faint uppercase sm:text-[0.56rem]"
          >
            {content.globeReadoutStart.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>

          <div
            aria-hidden="true"
            className="absolute right-3 bottom-12 flex flex-col items-end font-mono text-[0.52rem] leading-relaxed tracking-[0.12em] text-terminal-ink-faint uppercase sm:text-[0.56rem]"
          >
            {content.globeReadoutEnd.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>

          <div className="relative mx-auto w-full max-w-[18rem] min-w-0 sm:max-w-[22rem] lg:max-w-[26rem]">
            <AsciiPlanetScene
              className="ascii-planet-scene"
              ariaLabel="Rotating ASCII globe, marked with where you are reading from. Drag to spin it."
              autoRotateSpeed={6}
              modelScale={0.8}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-terminal-rule px-1 pt-2 font-mono text-[0.56rem] tracking-[0.12em] text-terminal-ink-faint uppercase sm:text-[0.6rem]">
            <span>{content.globeFooterStart}</span>
            <span>{content.globeFooterEnd}</span>
          </div>
        </figure>
      </div>
    </section>
  )
}

function HeroBanner({
  text,
  quiet = false,
}: {
  text: string
  quiet?: boolean
}) {
  return BANNER_FONT_OPTIONS.map((option) => (
    <div
      key={option.id}
      data-ascii-font={option.id}
      className="ascii-font-choice"
    >
      <AsciiBanner
        text={text}
        font={option.font}
        size="lg"
        effect={quiet ? "none" : "glitch"}
        className={quiet ? undefined : "crt-breathe"}
      />
    </div>
  ))
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-2 py-2 first:ps-0 last:pe-0 sm:px-3 sm:py-3">
      <dt className="truncate font-mono text-[0.55rem] tracking-[0.1em] text-terminal-ink-faint uppercase sm:text-[0.62rem]">
        {label}
      </dt>
      <dd className="font-mono text-base leading-none font-bold tracking-[0.08em] text-primary crt-glow-soft sm:text-lg">
        {value}
      </dd>
    </div>
  )
}

function QuickLink({
  index,
  label,
  href,
}: {
  index: string
  label: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 border-b border-terminal-rule py-1.5 font-mono text-[0.68rem] tracking-[0.08em] uppercase crt-persist hover:bg-terminal-wash focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="text-terminal-ink-faint">{index}</span>
      <span className="text-terminal-ink-dim group-hover:text-primary">
        {label}
      </span>
      <span className="ms-auto text-terminal-chrome-dim group-hover:text-primary">
        -&gt;
      </span>
    </Link>
  )
}

function pad(value: number) {
  return String(value).padStart(3, "0")
}
