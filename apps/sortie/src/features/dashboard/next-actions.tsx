import { Link } from "react-router"

import { GameImage } from "@/components/game-image"
import { listRow } from "@/components/layout"
import { Panel } from "@/components/panel"
import type { NextAction } from "@/domain/next-actions"
import type { StatCard } from "@/domain/stats"
import type { SnapshotMap, SnapshotTrader } from "@/domain/types"
import { ProgressSpine } from "./progress-spine"

/**
 * The screen opens on the only question worth opening on: what to do next.
 *
 * "Leads to N" is the ranking and it is also the reason — a task four others
 * wait on is worth running before one that ends where it starts, and saying
 * the number lets the reader disagree with the order.
 */
export function NextActions({
  actions,
  cards,
  traders,
  maps,
}: {
  actions: NextAction[]
  cards: StatCard[]
  traders: SnapshotTrader[]
  maps: SnapshotMap[]
}) {
  const traderNames = new Map(traders.map((trader) => [trader.id, trader]))
  const mapNames = new Map(maps.map((map) => [map.id, map]))

  return (
    <Panel title="Do this next" tone="lead">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <ul className="flex flex-col">
          {actions.length ? (
            actions.map((action) => {
              const trader = traderNames.get(action.trader)
              const where = action.maps
                .map((id) => mapNames.get(id)?.name)
                .filter(Boolean)
              const first = action.maps
                .map((id) => mapNames.get(id)?.normalizedName)
                .find(Boolean)

              return (
                <li key={action.id} className={listRow}>
                  <GameImage
                    src={trader?.imageLink ?? null}
                    alt=""
                    fit="cover"
                    className="size-9"
                  />
                  <span className="min-w-0 flex-1">
                    <Link
                      to={first ? `/raid?map=${first}` : "/raid"}
                      className="font-sans text-sm font-bold tracking-[0.06em] text-primary uppercase hover:crt-glow"
                    >
                      {action.name}
                    </Link>
                    <span className="block font-mono text-[0.65rem] text-terminal-ink-dim">
                      {trader?.name ?? action.trader}
                      {where.length ? ` · ${where.slice(0, 2).join(", ")}` : ""}
                      {action.kappaRequired ? " · kappa" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right font-mono text-[0.65rem] text-terminal-chrome tabular-nums">
                    {action.unlocks
                      ? `leads to ${action.unlocks}`
                      : "ends here"}
                  </span>
                </li>
              )
            })
          ) : (
            <li className="font-mono text-xs text-terminal-ink-dim">
              nothing is available — raise your level, or import your progress
              below
            </li>
          )}
        </ul>

        <ProgressSpine cards={cards} />
      </div>
    </Panel>
  )
}
