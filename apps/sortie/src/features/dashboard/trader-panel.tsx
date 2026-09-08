import { Link } from "react-router"
import { AsciiMeter } from "@workspace/ui/components/ascii-meter"

import { GameImage } from "@/components/game-image"
import { KeyButton } from "@/components/key-button"
import { Panel } from "@/components/panel"
import type { TraderStat } from "@/domain/stats"
import type { SnapshotTrader } from "@/domain/types"

function nextLevel(trader: SnapshotTrader, level: number) {
  return trader.levels.find((entry) => entry.level === level + 1) ?? null
}

export function TraderPanel({
  traders,
  stats,
  traderRep,
  onLevel,
  onRep,
}: {
  traders: SnapshotTrader[]
  stats: TraderStat[]
  traderRep: Record<string, number>
  onLevel: (traderId: string, level: number) => void
  onRep: (traderId: string, rep: number) => void
}) {
  const byId = new Map(traders.map((trader) => [trader.id, trader]))
  // Sixteen "traders" ship in the dump, half of them fixtures like the BTR
  // driver. The ones with tasks are the ones this panel is about.
  const shown = stats.filter((stat) => stat.total > 0)

  return (
    <Panel title="ТОРГОВЦЫ" srTitle="Traders">
      <ul className="grid gap-3 sm:grid-cols-2">
        {shown.map((stat) => {
          const trader = byId.get(stat.id)
          const next = trader ? nextLevel(trader, stat.level) : null
          const rep = traderRep[stat.id] ?? 0

          return (
            <li
              key={stat.id}
              className="flex flex-col gap-2 border border-terminal-rule p-2"
            >
              <div className="flex items-center gap-2">
                <GameImage
                  src={stat.imageLink}
                  alt=""
                  fit="cover"
                  className="size-10"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    to="/raid"
                    className="truncate font-sans text-xs font-bold tracking-[0.08em] text-primary uppercase hover:crt-glow"
                  >
                    {stat.name}
                  </Link>
                  <span className="font-mono text-[0.65rem] text-terminal-ink-dim tabular-nums">
                    LL{stat.level} · {stat.done} / {stat.total}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <KeyButton
                    className="min-h-8 px-2 md:min-h-0"
                    aria-label={`lower ${stat.name} loyalty level`}
                    disabled={stat.level <= 1}
                    onClick={() => onLevel(stat.id, stat.level - 1)}
                  >
                    −
                  </KeyButton>
                  <KeyButton
                    className="min-h-8 px-2 md:min-h-0"
                    aria-label={`raise ${stat.name} loyalty level`}
                    disabled={!next}
                    onClick={() => onLevel(stat.id, stat.level + 1)}
                  >
                    +
                  </KeyButton>
                </div>
              </div>

              <AsciiMeter
                label={stat.name}
                value={stat.total ? stat.done / stat.total : 0}
                cells={16}
                display={`${stat.done}/${stat.total}`}
              />

              <label className="flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.12em] text-terminal-ink-dim uppercase">
                REP
                <input
                  type="number"
                  step={0.01}
                  value={rep}
                  onChange={(event) =>
                    onRep(stat.id, Number(event.target.value) || 0)
                  }
                  className="w-20 border border-terminal-rule bg-transparent px-1.5 py-0.5 text-right font-mono text-[0.65rem] text-primary tabular-nums focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                />
                {next ? (
                  <span className="text-terminal-chrome-dim">
                    LL{next.level} at {next.requiredReputation} rep, level{" "}
                    {next.requiredPlayerLevel}
                  </span>
                ) : (
                  <span className="text-terminal-chrome-dim">max</span>
                )}
              </label>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
