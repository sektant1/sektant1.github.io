import * as React from "react"

import { AppShell } from "@/components/app-shell"
import { snapshot } from "@/data/snapshot"
import { buildStatCards, buildTraderStats } from "@/domain/stats"
import { buildTaskStatuses } from "@/domain/task-graph"
import { useProgress, useProgressActions } from "@/state/progress"
import { BossIntel } from "./boss-intel"
import { DataPanel } from "./data-panel"
import { MapPriority } from "./map-priority"
import { OpsCenter } from "./ops-center"
import { StatCards } from "./stat-cards"
import { TraderPanel } from "./trader-panel"
import { splitGrid, stack } from "@/components/layout"
import { cn } from "@workspace/ui/lib/utils"

export function DashboardScreen() {
  const progress = useProgress()
  const { setTraderLevel, setTraderRep, replaceAll } = useProgressActions()

  const statuses = React.useMemo(
    () =>
      buildTaskStatuses(snapshot.tasks, {
        completions: progress.taskCompletions,
        level: progress.level,
        faction: progress.faction,
        traderLevels: progress.traderLevels,
      }),
    [
      progress.taskCompletions,
      progress.level,
      progress.faction,
      progress.traderLevels,
    ]
  )

  const cards = React.useMemo(
    () =>
      buildStatCards({
        tasks: snapshot.tasks,
        hideout: snapshot.hideout,
        statuses,
        objectiveCounts: progress.objectiveCounts,
        hideoutLevels: progress.hideoutLevels,
      }),
    [statuses, progress.objectiveCounts, progress.hideoutLevels]
  )

  const traderStats = React.useMemo(
    () =>
      buildTraderStats(
        snapshot.traders,
        snapshot.tasks,
        statuses,
        progress.traderLevels
      ),
    [statuses, progress.traderLevels]
  )

  return (
    <AppShell>
      <div className={stack}>
        <StatCards cards={cards} />

        <div className={splitGrid}>
          <MapPriority
            maps={snapshot.maps}
            tasks={snapshot.tasks}
            statuses={statuses}
          />
          <div className={cn(stack, "min-w-0")}>
            <OpsCenter />
            <DataPanel progress={progress} onApply={replaceAll} />
          </div>
        </div>

        <TraderPanel
          traders={snapshot.traders}
          stats={traderStats}
          traderRep={progress.traderRep}
          onLevel={setTraderLevel}
          onRep={setTraderRep}
        />

        <BossIntel maps={snapshot.maps} />
      </div>
    </AppShell>
  )
}
