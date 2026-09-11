import * as React from "react"
import { useSearchParams } from "react-router"

import { AppShell } from "@/components/app-shell"
import { snapshot } from "@/data/snapshot"
import {
  frontOfEachLine,
  gatedCountForMap,
  mapTaskCounts,
  partitionActiveTasks,
  tasksForMap,
} from "@/domain/active-tasks"
import { buildChecklist } from "@/domain/checklist"
import { countUnlocks } from "@/domain/next-actions"
import { buildRaidKit } from "@/domain/raid-kit"
import { useProgress, useProgressActions } from "@/state/progress"
import { useTaskStatuses } from "@/state/task-statuses"
import { ChecklistPanel } from "./checklist-panel"
import { KitPanel } from "./kit-panel"
import { MapBar } from "./map-bar"
import { PackState } from "./pack-state"
import { TaskList } from "./task-list"
import { stack } from "@/components/layout"
import { cn } from "@workspace/ui/lib/utils"

/** Fixed by the snapshot, so counted once. */
const unlockCounts = countUnlocks(snapshot.tasks)

export function RaidScreen() {
  const progress = useProgress()
  const {
    setObjectiveCount,
    setTaskCompletion,
    toggleChecklistEntry,
    setChecklistEntries,
    setNote,
  } = useProgressActions()
  const [params, setParams] = useSearchParams()

  const statuses = useTaskStatuses(progress)

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
  // Off by default: these are the ones the app cannot prove are open.
  const includeGated = params.get("gated") === "1"

  // The map's own tasks and the anywhere ones are kept apart all the way to
  // the list, which shows them as two groups.
  const tasks = React.useMemo(
    () => tasksForMap(active, map.id, false, includeGated),
    [active, map.id, includeGated]
  )
  const anywhere = React.useMemo(() => {
    if (!includeGlobal) return []
    return [...active.global, ...(includeGated ? active.gatedGlobal : [])]
  }, [active, includeGlobal, includeGated])
  const gatedCount = gatedCountForMap(active, map.id, includeGlobal)

  // The questline view is the default: one task per trader. Everything the
  // app believes is open sits behind the control in the task list.
  const showAll = params.get("all") === "1"
  const shown = React.useMemo(
    () => (showAll ? tasks : frontOfEachLine(tasks)),
    [tasks, showAll]
  )
  const shownAnywhere = React.useMemo(
    () => (showAll ? anywhere : frontOfEachLine(anywhere)),
    [anywhere, showAll]
  )
  const kit = React.useMemo(
    () => buildRaidKit([...tasks, ...anywhere], map.id),
    [tasks, anywhere, map.id]
  )
  const entries = React.useMemo(
    () => buildChecklist(map, snapshot.items),
    [map]
  )

  function update(next: {
    map?: string
    global?: boolean
    gated?: boolean
    all?: boolean
  }) {
    const merged = new URLSearchParams(params)
    if (next.map !== undefined) merged.set("map", next.map)
    if (next.global !== undefined) {
      if (next.global) merged.delete("global")
      else merged.set("global", "0")
    }
    if (next.gated !== undefined) {
      if (next.gated) merged.set("gated", "1")
      else merged.delete("gated")
    }
    if (next.all !== undefined) {
      if (next.all) merged.set("all", "1")
      else merged.delete("all")
    }
    setParams(merged, { replace: true })
  }

  return (
    <AppShell>
      <div className={stack}>
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

        <PackState
          map={map}
          entries={entries}
          ticked={progress.checklistTicks[map.id] ?? []}
          kit={kit}
          tasks={tasks}
          anywhereTasks={anywhere}
          objectiveCounts={progress.objectiveCounts}
        />

        {/* What you pack on the left, what you are packing for on the right.
            The kit sat above the tasks at first, and its fifty-odd rows put
            the task list a screen and a half down. */}
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className={cn(stack, "min-w-0")}>
            <ChecklistPanel
              map={map}
              entries={entries}
              ticked={progress.checklistTicks[map.id] ?? []}
              note={progress.notes[map.id] ?? ""}
              onToggle={(entryId) => toggleChecklistEntry(map.id, entryId)}
              onSetAll={(entryIds, ticked) =>
                setChecklistEntries(map.id, entryIds, ticked)
              }
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
            tasks={shown}
            anywhereTasks={shownAnywhere}
            openCount={tasks.length + anywhere.length}
            showAll={showAll}
            onToggleAll={() => update({ all: !showAll })}
            traders={snapshot.traders}
            items={snapshot.items}
            gatedCount={gatedCount}
            includeGated={includeGated}
            onToggleGated={() => update({ gated: !includeGated })}
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
