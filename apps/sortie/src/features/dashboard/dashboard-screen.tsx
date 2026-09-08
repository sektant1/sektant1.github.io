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
      <div className="flex flex-col gap-3">
        <StatCards cards={cards} />

        <div className="grid items-start gap-3 lg:grid-cols-2">
          <MapPriority
            maps={snapshot.maps}
            tasks={snapshot.tasks}
            statuses={statuses}
          />
          <div className="flex min-w-0 flex-col gap-3">
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
