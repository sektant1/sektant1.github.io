import { GameImage } from "@/components/game-image"
import { Panel } from "@/components/panel"
import type { SnapshotMap } from "@/domain/types"
import { sectionHeading } from "@/components/layout"

/**
 * Who spawns where, and how often. Straight from the snapshot: these are the
 * game's own spawn chances, not an estimate.
 */
export function BossIntel({ maps }: { maps: SnapshotMap[] }) {
  // A map can list one boss several times, once per spawn point. The reading
  // that matters is the best chance of meeting them at all.
  const rows = maps
    .filter((map) => map.bosses.length > 0)
    .map((map) => {
      const best = new Map<string, number>()
      for (const boss of map.bosses) {
        best.set(
          boss.name,
          Math.max(best.get(boss.name) ?? 0, boss.spawnChance)
        )
      }
      const portraits = new Map(
        map.bosses.map((boss) => [boss.name, boss.portrait])
      )
      return {
        map,
        bosses: [...best.entries()]
          .map(([name, spawnChance]) => ({
            name,
            spawnChance,
            portrait: portraits.get(name) ?? null,
          }))
          .sort((a, b) => b.spawnChance - a.spawnChance),
      }
    })
    .sort((a, b) => b.bosses.length - a.bosses.length)

  return (
    <Panel title="Boss intel" tone="quiet">
      {/* One column per map, one row per boss, so the percentages line up
          down the panel and can be read against each other — which is the
          only reason to put them on one screen. */}
      <ul className="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ map, bosses }) => (
          <li key={map.id} className="flex min-w-0 flex-col gap-1">
            <h3
              className={`${sectionHeading} border-b border-terminal-rule/40 pb-1`}
            >
              {map.name}
            </h3>
            <ul className="flex flex-col">
              {bosses.map((boss) => (
                <li
                  key={`${map.id}-${boss.name}`}
                  className="grid min-h-9 grid-cols-[1.75rem_minmax(0,1fr)_3rem] items-center gap-x-2"
                >
                  <GameImage
                    src={boss.portrait}
                    alt=""
                    fit="cover"
                    className="size-7"
                  />
                  <span className="truncate font-mono text-[0.7rem] text-foreground">
                    {boss.name}
                  </span>
                  <span className="text-right font-mono text-[0.7rem] text-primary tabular-nums">
                    {Math.round(boss.spawnChance * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
