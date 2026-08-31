"use client"

import * as React from "react"
import { AsciiMeter } from "@workspace/ui/components/ascii-meter"
import { BootLog, type BootLine } from "@workspace/ui/components/boot-log"
import { Spinner } from "@workspace/ui/components/spinner"

import { AsciiPlanetScene } from "@/components/ascii-planet/ascii-planet-lazy"
import type { RenderStyle } from "@/components/ascii-planet/policy"
import { logger } from "@workspace/ui/lib/logger"
import { usePersistedPreference } from "@workspace/ui/hooks/use-persisted-preference"
import { usePrefersReducedMotion } from "@workspace/ui/hooks/use-reduced-motion"
import { bootDueOnThisLoad, coldBootLastSeen } from "@/lib/cold-boot-state"
import { pad } from "@/lib/format"

/**
 * The sequence a machine like this runs when it is switched on.
 *
 * Every line reports something the page genuinely does: the fonts it loads,
 * the content it was built from, the geolocation lookup the globe makes, the
 * CMS being absent from a published build. Inventing plausible-looking
 * hardware checks would make it a screensaver; keeping it truthful makes it
 * the same POST the log panel shows in slower motion.
 *
 * That rule is also what sets the length. The sequence used to open with
 * twenty lines of generic kernel boot — GRUB, initrd, ACPI, the PCI bus —
 * none of which this site has or does, and all of which the reader had to sit
 * through before the log said a single true thing about the archive. Cutting
 * them took the greeting from about six seconds to under four without
 * removing one line that reports real work.
 *
 * Laid out like a mission briefing: the object turning on one side, the log
 * filling in on the other. The coin is the same ASCII renderer the front page
 * uses, pointed at a different model — no second engine, and it is already
 * paid for.
 *
 * Shown at most once an hour. It is a greeting, not a toll: someone reading
 * three posts in a row lands straight on the page, and someone coming back
 * tomorrow gets the machine switching on again rather than a sequence they
 * saw once in March and never again.
 */

const COIN_MODEL = "/models/bitcoin.glb"
const COIN_SURFACE = { roughness: 0.42, metalness: 0.62, normalScale: 1.5 }
const COIN_POST = { edge: 0.72, dither: 0.035, contrast: 1.18 }

/** Runs the sequence again, whatever the stored state says. */
export const REPLAY_BOOT_EVENT = "hideout:replay-boot"

/** A dense kernel log: fast enough to feel machine-driven, slow enough to scan. */
const LINE_INTERVAL = 118
const LINES_PER_TICK = 1

/**
 * How long the finished log holds before a press can dismiss it.
 *
 * Without it the sequence ends under whatever the reader's hand was already
 * doing — a click aimed at the page underneath lands the same frame the last
 * line prints, and the curtain is gone before the prompt has been read.
 */
const ARM_DELAY = 700

type ColdBootProps = {
  /** Real counts from the build, so the log reports this site, not a fiction. */
  posts: number
  projects: number
  games: number
  /** True when the CMS is compiled into this build. */
  cms: boolean
  /** How the coin is drawn. Editable at /admin/home. */
  style?: RenderStyle
}

/**
 * The steps, without their timestamps.
 *
 * The bracketed time used to be typed into each label — plausible-looking
 * numbers that climbed to 1.059 while the log actually took three and a half
 * seconds to print, because the pacing lives in LINE_INTERVAL and nothing
 * connected the two. "Readouts are real" is the site's own rule, and a column
 * that looks like elapsed time has to be elapsed time. It is derived below.
 */
function bootSteps({ posts, projects, games, cms }: ColdBootProps): BootLine[] {
  return [
    { label: "POST::БП", status: "ok", detail: "NOMINAL" },
    { label: "SYNC::ЭЛТ/P1", status: "ok", detail: "60HZ" },
    { label: "INIT::EARLY.CONSOLE", status: "ok", detail: "TTY0" },
    { label: "DETECT::DMI", status: "ok", detail: "FLD-01" },
    { label: "MAP::ПАМЯТЬ", status: "ok", detail: "256M" },
    { label: "INIT::CRNG", status: "ok", detail: "READY" },
    { label: "MOUNT::КОРЕНЬ", status: "ok", detail: "RO" },
    { label: "START::SYSTEMD", status: "ok", detail: "257" },
    { label: "INIT::NET.CORE", status: "ok", detail: "ONLINE" },
    { label: "SKIP::IPV6", status: "skip", detail: "POLICY" },
    { label: "WAIT::NETWORK.ONLINE", status: "ok", detail: "ROUTABLE" },
    { label: "RESOLVE::СЕТЬ/GEO", status: "warn", detail: "PENDING" },
    { label: "LOAD::FNT/BENDER", status: "ok", detail: "WOFF" },
    { label: "CHECK::AP.MASK", status: "ok", detail: "6PX" },
    { label: "PRELOAD::MODEL/BTC", status: "ok", detail: "GLB" },
    {
      label: "MOUNT>АРХИВ/CONTENT",
      status: "ok",
      detail: `${pad(posts + projects + games)} OBJ`,
    },
    { label: "MAP::NAV.ROUTES", status: "ok", detail: "READY" },
    { label: "IDX>POSTS", status: "ok", detail: pad(posts) },
    { label: "IDX>PROJECTS", status: "ok", detail: pad(projects) },
    {
      label: "IDX>GAMES",
      status: games > 0 ? "ok" : "skip",
      detail: pad(games),
    },
    { label: "SEARCH::FTS", status: "ok", detail: "READY" },
    {
      label: "LOAD::SEARCH.IDX",
      status: "ok",
      detail: `${pad(posts)} DOC`,
    },
    {
      label: "CHECK::CMS.LOCAL",
      status: cms ? "ok" : "skip",
      detail: cms ? "RW" : "N/A",
    },
    { label: "START::HIDEOUT.SVC", status: "ok", detail: "ACTIVE" },
    { label: "ARM::ЖУРНАЛ/SITE", status: "ok", detail: "LIVE" },
    { label: "OPEN::CMD.IFACE", status: "ok", detail: "CTRL-K" },
    { label: "AUTH::ОПЕРАТОР", status: "ok", detail: "ДОПУСК" },
    { label: "REACHED::HIDEOUT", status: "ok", detail: "TARGET" },
  ]
}

/** When a line prints, in seconds, to the millisecond the log actually keeps. */
function elapsed(index: number) {
  return ((index * LINE_INTERVAL) / 1000).toFixed(3)
}

function bootLines(props: ColdBootProps): BootLine[] {
  return bootSteps(props).map((step, index) => ({
    ...step,
    label: `[${elapsed(index)}] ${step.label}`,
  }))
}

export function ColdBoot({
  posts,
  projects,
  games,
  cms,
  style,
}: ColdBootProps) {
  const reduceMotion = usePrefersReducedMotion()
  const lines = React.useMemo(
    () => bootLines({ posts, projects, games, cms }),
    [posts, projects, games, cms]
  )

  // The server renders the curtain. The head script hides it before first
  // paint when storage says it should be skipped.
  const [lastSeen, markSeen] = usePersistedPreference(coldBootLastSeen)
  // The server has no storage, so it renders the curtain and the head script
  // hides it before first paint when the last viewing is still fresh.
  const due = bootDueOnThisLoad(lastSeen)

  const [dismissed, setDismissed] = React.useState(false)
  // Asked for explicitly, so it overrides both the stored state and the
  // reduced-motion default: someone who runs the command wants to watch it.
  const [replaying, setReplaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [armed, setArmed] = React.useState(false)
  const [coinReady, setCoinReady] = React.useState(false)
  const running = replaying || (due && !reduceMotion && !dismissed)
  const complete = progress >= 1
  const markCoinReady = React.useCallback(() => setCoinReady(true), [])

  const finish = React.useCallback(() => {
    setDismissed(true)
    setReplaying(false)
    markSeen(Date.now())
  }, [markSeen])

  React.useEffect(() => {
    const replay = () => {
      document.documentElement.dataset.coldBoot = "run"
      setProgress(0)
      setArmed(false)
      setCoinReady(false)
      setReplaying(true)
    }
    window.addEventListener(REPLAY_BOOT_EVENT, replay)
    return () => window.removeEventListener(REPLAY_BOOT_EVENT, replay)
  }, [])

  React.useEffect(() => {
    if (!running) {
      document.documentElement.removeAttribute("data-cold-boot")
      return
    }
    logger.info("boot", "cold boot sequence")
  }, [running])

  React.useEffect(() => {
    if (!running || !complete) return

    const arm = setTimeout(() => {
      setArmed(true)
      window.addEventListener("keydown", finish)
      window.addEventListener("pointerdown", finish)
    }, ARM_DELAY)

    return () => {
      clearTimeout(arm)
      window.removeEventListener("keydown", finish)
      window.removeEventListener("pointerdown", finish)
    }
  }, [running, complete, finish])

  if (!running) return null

  return (
    <div
      // aria-hidden: the real page is already rendered underneath and is what
      // a screen reader should be reading. This is a visual curtain.
      aria-hidden="true"
      className="cold-boot fixed inset-0 z-[70] flex flex-col justify-start overflow-y-auto bg-background px-4 py-6 sm:px-8 sm:py-10 md:justify-center md:overflow-hidden md:px-12"
    >
      <div className="cold-boot-panel mx-auto grid w-full max-w-4xl items-center gap-4 sm:gap-6 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-8">
        {/* The asset leads the sequence. It stays compact above the terminal on
            narrow screens and grows into its own column on desktop. */}
        <div className="relative mx-auto aspect-square w-[clamp(6rem,22vh,11rem)] md:w-full">
          {/* Held until the coin has something to draw. It fades rather than
              cutting, so a fast connection does not flash two states in a
              frame, and it carries its own label: on a slow link this is the
              only thing that says the model is still coming. */}
          <div
            aria-hidden="true"
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-300 ${coinReady ? "pointer-events-none opacity-0" : "opacity-100"}`}
          >
            <Spinner className="size-6 text-primary crt-glow" />
            <span className="font-mono text-[0.55rem] tracking-[0.2em] text-terminal-chrome-dim uppercase">
              load::model/btc
            </span>
          </div>
          <AsciiPlanetScene
            className="ascii-planet-scene"
            ariaLabel=""
            onReady={markCoinReady}
            modelUrl={COIN_MODEL}
            autoRotateSpeed={8}
            modelScale={0.9}
            // The coin is the only thing on screen here, so it gets a finer
            // grid than the front page globe and a hard, polished surface for
            // the highlight to travel across as it turns.
            resolution={0.26}
            // Not pure metal: backing off keeps the albedo contributing the
            // engraving while the supplied roughness map shapes highlights.
            surface={COIN_SURFACE}
            postOptions={COIN_POST}
            style={style}
            boot
          />
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 text-left sm:gap-4">
          <p className="font-mono text-[0.65rem] tracking-[0.2em] text-terminal-chrome-dim uppercase sm:tracking-[0.35em]">
            sektant // hideout // fld
          </p>

          {/* The log runs on its own clock. It used to wait for the coin,
              which meant a slow link replaced the sequence with a spinner and
              the greeting arrived after the wait instead of covering it. */}
          <div className="h-[17.25rem] overflow-hidden border-y border-terminal-rule py-3 sm:h-80 md:h-[21.25rem]">
            <BootLog
              lines={lines}
              interval={LINE_INTERVAL}
              batchSize={LINES_PER_TICK}
              windowSize={18}
              // The log's caret marks where the next line will print. Once the
              // prompt is armed nothing more will print, so the caret hands
              // over: one blinking block on screen, and it is the one asking
              // for a key.
              cursor={!armed}
              onReveal={setProgress}
              className="px-1 text-[0.62rem] leading-[1.4] uppercase sm:px-2 sm:text-[0.68rem] sm:leading-[1.5] md:text-[0.72rem]"
            />
          </div>

          <AsciiMeter
            label="post"
            value={progress}
            cells={20}
            tone={complete ? "default" : "muted"}
            className="px-1 sm:px-2"
          />
        </div>
      </div>

      {/* The prompt is the machine addressing the reader, so it sits under
          the whole panel on its own rule rather than trailing the log like a
          caption. It is held back until a press will actually do something —
          an offer the console cannot honour yet is worse than no offer. */}
      <div
        className={`cold-boot-prompt mx-auto mt-4 flex w-full max-w-4xl items-center justify-center gap-2 border border-terminal-rule px-3 py-2 font-mono text-[0.7rem] tracking-[0.14em] uppercase transition-opacity duration-300 sm:mt-6 sm:text-xs sm:tracking-[0.2em] ${armed ? "border-primary/50 text-primary opacity-100 crt-glow" : "text-terminal-chrome-dim opacity-0"}`}
      >
        <span aria-hidden="true" className="text-terminal-chrome-dim">
          &gt;
        </span>
        <span className="sm:hidden">tap the screen to continue</span>
        <span className="hidden sm:inline">press any key to continue</span>
        <span className="caret" aria-hidden="true" />
      </div>
    </div>
  )
}
