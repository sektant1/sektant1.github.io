"use client"

import * as React from "react"
import { AsciiMeter } from "@workspace/ui/components/ascii-meter"
import { BootLog, type BootLine } from "@workspace/ui/components/boot-log"
import { Spinner } from "@workspace/ui/components/spinner"

import { AsciiPlanetScene } from "@/components/ascii-planet/ascii-planet-lazy"
import { logger } from "@workspace/ui/lib/logger"
import { usePersistedPreference } from "@workspace/ui/hooks/use-persisted-preference"
import { usePrefersReducedMotion } from "@workspace/ui/hooks/use-reduced-motion"
import { coldBootSeen } from "@/lib/cold-boot-state"
import { pad } from "@/lib/format"

/**
 * The sequence a machine like this runs when it is switched on.
 *
 * Every line reports something the page genuinely does: the fonts and model
 * it loads, the content it was built from, and the CMS being absent from a
 * published build.
 *
 * Laid out like a mission briefing: the object turning on one side, the log
 * filling in on the other. The coin is the same ASCII renderer the front page
 * uses, pointed at a different model — no second engine, and it is already
 * paid for.
 *
 * Shown once. It is a greeting, not a toll — a reader who comes back to look
 * something up should land on the page, and someone who has never seen it
 * gets it once and continues after the final check.
 */

const COIN_MODEL = "/models/bitcoin.glb"
const COIN_SURFACE = { roughness: 0.42, metalness: 0.62, normalScale: 1.5 }
const COIN_POST = { edge: 0.72, dither: 0.035, contrast: 1.18 }

/** Runs the sequence again, whatever the stored state says. */
export const REPLAY_BOOT_EVENT = "hideout:replay-boot"

/** Fast enough to feel machine-driven, slow enough to scan. */
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
}

function bootLines({ posts, projects, games, cms }: ColdBootProps): BootLine[] {
  return [
    { label: "LOAD::FNT/BENDER", status: "ok", detail: "WOFF" },
    { label: "CHECK::AP.MASK", status: "ok", detail: "6PX" },
    { label: "REQUEST::MODEL/BTC", status: "warn", detail: "GLB" },
    {
      label: "MOUNT>АРХИВ/CONTENT",
      status: "ok",
      detail: `${pad(posts + projects + games)} OBJ`,
    },
    { label: "IDX>POSTS", status: "ok", detail: pad(posts) },
    { label: "IDX>PROJECTS", status: "ok", detail: pad(projects) },
    {
      label: "IDX>GAMES",
      status: games > 0 ? "ok" : "skip",
      detail: pad(games),
    },
    {
      label: "INDEX::SEARCH",
      status: "ok",
      detail: `${pad(posts)} DOC`,
    },
    {
      label: "CHECK::CMS.LOCAL",
      status: cms ? "ok" : "skip",
      detail: cms ? "RW" : "N/A",
    },
    { label: "ARM::ЖУРНАЛ/SITE", status: "ok", detail: "LIVE" },
    { label: "OPEN::CMD.IFACE", status: "ok", detail: "CTRL-K" },
    { label: "REACHED::HIDEOUT", status: "ok", detail: "READY" },
  ]
}

export function ColdBoot({ posts, projects, games, cms }: ColdBootProps) {
  const reduceMotion = usePrefersReducedMotion()
  const lines = React.useMemo(
    () => bootLines({ posts, projects, games, cms }),
    [posts, projects, games, cms]
  )

  // The server renders the curtain. The head script hides it before first
  // paint when storage says it should be skipped.
  const [seen, markSeen] = usePersistedPreference(coldBootSeen)

  const [dismissed, setDismissed] = React.useState(false)
  // Asked for explicitly, so it overrides both the stored state and the
  // reduced-motion default: someone who runs the command wants to watch it.
  const [replaying, setReplaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [armed, setArmed] = React.useState(false)
  const [coinReady, setCoinReady] = React.useState(false)
  const running = replaying || (!seen && !reduceMotion && !dismissed)
  const complete = progress >= 1
  const markCoinReady = React.useCallback(() => setCoinReady(true), [])

  const finish = React.useCallback(() => {
    setDismissed(true)
    setReplaying(false)
    markSeen(true)
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
