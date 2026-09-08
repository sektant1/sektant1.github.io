import * as React from "react"
import { useSearchParams } from "react-router"

import { AppShell } from "@/components/app-shell"
import { snapshot } from "@/data/snapshot"
import {
  mapTaskCounts,
  partitionActiveTasks,
  tasksForMap,
} from "@/domain/active-tasks"
import { buildRaidKit } from "@/domain/raid-kit"
import { buildTaskStatuses } from "@/domain/task-graph"
import { useProgress, useProgressActions } from "@/state/progress"
import { ChecklistPanel } from "./checklist-panel"
import { KitPanel } from "./kit-panel"
import { MapBar } from "./map-bar"
import { TaskList } from "./task-list"

/** How many tasks name each task as a prerequisite. Fixed by the snapshot. */
const unlockCounts: Record<string, number> = {}
for (const task of snapshot.tasks) {
  for (const requirement of task.taskRequirements) {
    unlockCounts[requirement.task] = (unlockCounts[requirement.task] ?? 0) + 1
  }
}

export function RaidScreen() {
  const progress = useProgress()
  const {
    setObjectiveCount,
    setTaskCompletion,
    toggleChecklistEntry,
    setNote,
  } = useProgressActions()
  const [params, setParams] = useSearchParams()

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

  const active = React.useMemo(
    () => partitionActiveTasks(snapshot.tasks, statuses),
    [statuses]
  )
  const counts = React.useMemo(() => mapTaskCounts(active), [active])

  // The map lives in the URL so a dashboard row can land on it, which means
  // the default has to be computed rather than stored.
  const requested = params.get("map")
  const busiest = [...snapshot.maps].sort(
    (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
  )[0]
  const map =
    snapshot.maps.find((entry) => entry.normalizedName === requested) ?? busiest

  const includeGlobal = params.get("global") !== "0"

  const tasks = React.useMemo(
    () => tasksForMap(active, map.id, includeGlobal),
    [active, map.id, includeGlobal]
  )
  const kit = React.useMemo(() => buildRaidKit(tasks, map.id), [tasks, map.id])

  function update(next: { map?: string; global?: boolean }) {
    const merged = new URLSearchParams(params)
    if (next.map !== undefined) merged.set("map", next.map)
    if (next.global !== undefined) {
      if (next.global) merged.delete("global")
      else merged.set("global", "0")
    }
    setParams(merged, { replace: true })
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-3">
        {/* The task list runs long, and the map you are packing for is the one
            thing you must be able to see while scrolling it. */}
        <div className="sticky top-0 z-10 -mx-3 bg-background/95 px-3 py-2 backdrop-blur md:-mx-4 md:px-4">
          <MapBar
            maps={snapshot.maps}
            counts={counts}
            selected={map}
            globalCount={active.global.length}
            includeGlobal={includeGlobal}
            onSelect={(next) => update({ map: next.normalizedName })}
            onToggleGlobal={() => update({ global: !includeGlobal })}
          />
        </div>

        {/* What you pack on the left, what you are packing for on the right.
            The kit sat above the tasks at first, and its fifty-odd rows put
            the task list a screen and a half down. */}
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            <ChecklistPanel
              map={map}
              items={snapshot.items}
              ticked={progress.checklistTicks[map.id] ?? []}
              note={progress.notes[map.id] ?? ""}
              onToggle={(entryId) => toggleChecklistEntry(map.id, entryId)}
              onNoteChange={(note) => setNote(map.id, note)}
            />
            <KitPanel
              kit={kit}
              items={snapshot.items}
              objectiveCounts={progress.objectiveCounts}
              onObjectiveCount={setObjectiveCount}
            />
          </div>

          <TaskList
            tasks={tasks}
            traders={snapshot.traders}
            unlockCounts={unlockCounts}
            objectiveCounts={progress.objectiveCounts}
            onObjectiveCount={setObjectiveCount}
            onComplete={setTaskCompletion}
          />
        </div>
      </div>
    </AppShell>
  )
}
