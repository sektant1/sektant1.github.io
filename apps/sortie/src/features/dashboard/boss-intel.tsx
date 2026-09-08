import { GameImage } from "@/components/game-image"
import { Panel } from "@/components/panel"
import type { SnapshotMap } from "@/domain/types"

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
        best.set(boss.name, Math.max(best.get(boss.name) ?? 0, boss.spawnChance))
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

  return (
    <Panel title="РАЗВЕДКА" srTitle="Boss intel">
      <ul className="flex flex-col gap-3">
        {rows.map(({ map, bosses }) => (
          <li key={map.id} className="flex flex-col gap-1.5">
            <h3 className="font-mono text-[0.65rem] tracking-[0.16em] text-terminal-chrome uppercase">
              {map.name}
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {bosses.map((boss) => (
                <li
                  key={`${map.id}-${boss.name}`}
                  className="flex items-center gap-2 border border-terminal-rule py-1 pr-2 pl-1"
                >
                  <GameImage src={boss.portrait} alt="" className="size-8" />
                  <span className="font-mono text-[0.7rem] text-foreground">
                    {boss.name}
                  </span>
                  <span className="font-mono text-[0.7rem] text-primary tabular-nums">
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
