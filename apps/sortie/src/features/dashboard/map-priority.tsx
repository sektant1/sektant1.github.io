import * as React from "react"
import { Link } from "react-router"

import { KeyButton } from "@/components/key-button"
import { Panel } from "@/components/panel"
import { mapTaskCounts, partitionActiveTasks } from "@/domain/active-tasks"
import type { SnapshotMap, SnapshotTask, TaskStatus } from "@/domain/types"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Which map to run next, ranked by what is actually available there. The
 * kappa filter recounts rather than dimming rows: a map with four kappa tasks
 * and forty others is not the same choice as one with four of each.
 */
export function MapPriority({
  maps,
  tasks,
  statuses,
}: {
  maps: SnapshotMap[]
  tasks: SnapshotTask[]
  statuses: Record<string, TaskStatus>
}) {
  const [kappaOnly, setKappaOnly] = React.useState(false)

  const counts = React.useMemo(() => {
    const pool = kappaOnly ? tasks.filter((task) => task.kappaRequired) : tasks
    return mapTaskCounts(partitionActiveTasks(pool, statuses))
  }, [tasks, statuses, kappaOnly])

  const ranked = [...maps]
    .map((map) => ({ map, count: counts[map.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)

  const highest = ranked[0]?.count ?? 0

  return (
    <Panel
      title="Map priority"
      controls={
        <KeyButton
          className="min-h-8 md:min-h-0"
          active={kappaOnly}
          onClick={() => setKappaOnly(!kappaOnly)}
        >
          kappa only
        </KeyButton>
      }
    >
      <ul className="flex flex-col">
        {ranked.map(({ map, count }) => (
          <li key={map.id}>
            <Link
              to={`/raid?map=${map.normalizedName}`}
              className={cn(
                "grid min-h-11 grid-cols-[9rem_minmax(0,1fr)_2.5rem] items-center gap-x-3 border-b border-terminal-rule/40 py-1.5 hover:text-primary"
              )}
            >
              <span className="truncate font-mono text-xs text-foreground">
                {map.name}
              </span>
              {/* One rule per row, filled against the busiest map: the
                  comparison between maps is the whole point of the panel. */}
              <span
                aria-hidden="true"
                className="flex h-2 border border-terminal-rule/60"
              >
                <span
                  className="bg-primary/70"
                  style={{ width: `${highest ? (count / highest) * 100 : 0}%` }}
                />
              </span>
              <span className="text-right font-mono text-[0.7rem] text-primary tabular-nums">
                {count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
