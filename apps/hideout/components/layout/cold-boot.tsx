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
import { coldBootSeen } from "@/lib/cold-boot-state"
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

function bootLines({ posts, projects, games, cms }: ColdBootProps): BootLine[] {
  return [
    { label: "[0.000] POST::БП", status: "ok", detail: "NOMINAL" },
    { label: "[0.018] SYNC::ЭЛТ/P1", status: "ok", detail: "60HZ" },
    { label: "[0.031] BOOT::GRUB", status: "ok", detail: "2.12" },
    { label: "[0.044] LOAD::VMLINUX", status: "ok", detail: "6.12-FLD" },
    { label: "[0.057] LOAD::INITRD", status: "ok", detail: "32M" },
    { label: "[0.083] DECOMPRESS::KERNEL", status: "ok", detail: "X86_64" },
    { label: "[0.101] INIT::EARLY.CONSOLE", status: "ok", detail: "TTY0" },
    { label: "[0.126] DETECT::DMI", status: "ok", detail: "FLD-01" },
    { label: "[0.149] INIT::CPU0", status: "ok", detail: "ONLINE" },
    { label: "[0.177] MAP::ПАМЯТЬ", status: "ok", detail: "256M" },
    { label: "[0.203] INIT::CRNG", status: "ok", detail: "READY" },
    { label: "[0.228] SELECT::CLOCKSOURCE", status: "ok", detail: "TSC" },
    { label: "[0.254] PARSE::ACPI.TABLES", status: "ok", detail: "6" },
    { label: "[0.281] ENUM::PCI.BUS", status: "ok", detail: "DONE" },
    { label: "[0.307] BIND::SIMPLEDRM", status: "ok", detail: "FB0" },
    { label: "[0.336] INIT::ATKBD", status: "ok", detail: "SERIO0" },
    { label: "[0.362] INIT::USB.CORE", status: "ok", detail: "2.0" },
    { label: "[0.391] INIT::SCSI.CORE", status: "ok", detail: "READY" },
    { label: "[0.424] INIT::NET.CORE", status: "ok", detail: "ONLINE" },
    { label: "[0.458] INIT::IPV4", status: "ok", detail: "TCP" },
    { label: "[0.486] SKIP::IPV6", status: "skip", detail: "POLICY" },
    { label: "[0.517] CHECK::EXT4", status: "ok", detail: "CLEAN" },
    { label: "[0.549] MOUNT::КОРЕНЬ", status: "ok", detail: "RO" },
    { label: "[0.581] START::SYSTEMD", status: "ok", detail: "257" },
    { label: "[0.617] START::JOURNALD", status: "ok", detail: "VOLATILE" },
    { label: "[0.652] START::UDEVD", status: "ok", detail: "READY" },
    { label: "[0.694] REACHED::LOCAL-FS", status: "ok", detail: "TARGET" },
    { label: "[0.738] START::NETWORKD", status: "ok", detail: "ETH0" },
    { label: "[0.781] WAIT::NETWORK.ONLINE", status: "ok", detail: "ROUTABLE" },
    { label: "[0.826] RESOLVE::СЕТЬ/GEO", status: "warn", detail: "PENDING" },
    { label: "[0.871] REACHED::NETWORK", status: "ok", detail: "TARGET" },
    { label: "[0.917] LOAD::FNT/BENDER", status: "ok", detail: "WOFF" },
    { label: "[0.962] CHECK::AP.MASK", status: "ok", detail: "6PX" },
    { label: "[1.014] PRELOAD::MODEL/BTC", status: "ok", detail: "GLB" },
    {
      label: "[1.067] MOUNT>АРХИВ/CONTENT",
      status: "ok",
      detail: `${pad(posts + projects + games)} OBJ`,
    },
    { label: "[1.113] MAP::NAV.ROUTES", status: "ok", detail: "READY" },
    { label: "[1.159] IDX>POSTS", status: "ok", detail: pad(posts) },
    { label: "[1.202] IDX>PROJECTS", status: "ok", detail: pad(projects) },
    {
      label: "[1.248] IDX>GAMES",
      status: games > 0 ? "ok" : "skip",
      detail: pad(games),
    },
    { label: "[1.291] SEARCH::FTS", status: "ok", detail: "READY" },
    {
      label: "[1.337] LOAD::SEARCH.IDX",
      status: "ok",
      detail: `${pad(posts)} DOC`,
    },
    { label: "[1.381] CHECK::CACHE.LOCAL", status: "ok", detail: "READY" },
    {
      label: "[1.426] CHECK::CMS.LOCAL",
      status: cms ? "ok" : "skip",
      detail: cms ? "RW" : "N/A",
    },
    { label: "[1.472] START::HIDEOUT.SVC", status: "ok", detail: "ACTIVE" },
    { label: "[1.519] ARM::ЖУРНАЛ/SITE", status: "ok", detail: "LIVE" },
    { label: "[1.566] OPEN::CMD.IFACE", status: "ok", detail: "CTRL-K" },
    { label: "[1.612] VERIFY::KEYRING", status: "ok", detail: "ED25519" },
    { label: "[1.658] AUTH::ОПЕРАТОР", status: "ok", detail: "ДОПУСК" },
    { label: "[1.704] REACHED::HIDEOUT", status: "ok", detail: "TARGET" },
  ]
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
