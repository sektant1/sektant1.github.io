import * as React from "react"
import { useSearchParams } from "react-router"

import { snapshot } from "@/data/snapshot"
import {
  frontOfEachLine,
  gatedCountForMap,
  mapTaskCounts,
  partitionActiveTasks,
  tasksForMap,
} from "@/domain/active-tasks"
import { buildChecklist } from "@/domain/checklist"
import { buildRaidKit } from "@/domain/raid-kit"
import { buildTaskStatuses } from "@/domain/task-graph"
import type { SnapshotMap, SnapshotTask } from "@/domain/types"
import { useProgress } from "@/state/progress"

export type TaskKind = "any" | "kappa" | "lightkeeper"

/**
 * Every derivation the planner screen needs, and the URL that holds its
 * state.
 *
 * The view lives in the query string rather than in component state so that a
 * link carries it: "here is Customs, Prapor's line only, storyline shown" is
 * a thing worth sending someone, and a reload should not throw it away.
 */
export function useRaidView() {
  const progress = useProgress()
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

  const requested = params.get("map")
  const busiest = React.useMemo(
    () =>
      [...snapshot.maps].sort(
        (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
      )[0],
    [counts]
  )
  const map =
    snapshot.maps.find((entry) => entry.normalizedName === requested) ?? busiest

  const includeGlobal = params.get("global") !== "0"
  const includeGated = params.get("gated") === "1"
  const showAll = params.get("all") === "1"
  const trader = params.get("trader")
  const query = params.get("q") ?? ""
  const kindParam = params.get("kind")
  const kind: TaskKind =
    kindParam === "kappa" || kindParam === "lightkeeper" ? kindParam : "any"

  const mapTasks = React.useMemo(
    () => tasksForMap(active, map.id, false, includeGated),
    [active, map.id, includeGated]
  )
  const anywhereTasks = React.useMemo(() => {
    if (!includeGlobal) return []
    return [...active.global, ...(includeGated ? active.gatedGlobal : [])]
  }, [active, includeGlobal, includeGated])

  const cut = React.useCallback(
    (tasks: SnapshotTask[]) => (showAll ? tasks : frontOfEachLine(tasks)),
    [showAll]
  )

  const shownMapTasks = React.useMemo(() => cut(mapTasks), [cut, mapTasks])
  const shownAnywhere = React.useMemo(
    () => cut(anywhereTasks),
    [cut, anywhereTasks]
  )

  const kit = React.useMemo(
    () => buildRaidKit([...mapTasks, ...anywhereTasks], map.id),
    [mapTasks, anywhereTasks, map.id]
  )
  const entries = React.useMemo(
    () => buildChecklist(map, snapshot.items),
    [map]
  )

  const setView = React.useCallback(
    (next: {
      map?: SnapshotMap
      global?: boolean
      gated?: boolean
      all?: boolean
      trader?: string | null
      kind?: TaskKind
      query?: string
    }) => {
      const merged = new URLSearchParams(params)
      const write = (key: string, value: string, isDefault: boolean) => {
        if (isDefault) merged.delete(key)
        else merged.set(key, value)
      }

      if (next.map) merged.set("map", next.map.normalizedName)
      if (next.global !== undefined) write("global", "0", next.global)
      if (next.gated !== undefined) write("gated", "1", !next.gated)
      if (next.all !== undefined) write("all", "1", !next.all)
      if (next.trader !== undefined) {
        write("trader", next.trader ?? "", next.trader === null)
      }
      if (next.kind !== undefined) write("kind", next.kind, next.kind === "any")
      if (next.query !== undefined) write("q", next.query, next.query === "")

      setParams(merged, { replace: true })
    },
    [params, setParams]
  )

  return {
    progress,
    map,
    counts,
    statuses,
    anywhereCount: active.global.length,
    gatedCount: gatedCountForMap(active, map.id, includeGlobal),
    openCount: mapTasks.length + anywhereTasks.length,
    mapTasks: shownMapTasks,
    anywhereTasks: shownAnywhere,
    kit,
    entries,
    view: { includeGlobal, includeGated, showAll, trader, kind, query },
    setView,
  }
}

/** How many tasks name each task as a prerequisite. Fixed by the snapshot. */
export const unlockCounts: Record<string, number> = {}
for (const task of snapshot.tasks) {
  for (const requirement of task.taskRequirements) {
    unlockCounts[requirement.task] = (unlockCounts[requirement.task] ?? 0) + 1
  }
}
