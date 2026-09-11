import type { SnapshotTask, TaskStatus } from "./types"

export type ActiveTasks = {
  byMap: Record<string, SnapshotTask[]>
  /** Available tasks that name no map — doable on any raid. */
  global: SnapshotTask[]
  /**
   * Tasks the app cannot prove are open: everything it can check passes, but
   * the game holds them behind a storyline variable it does not publish.
   * Kept apart so the planner's counts mean "you can do this now".
   */
  gatedByMap: Record<string, SnapshotTask[]>
  gatedGlobal: SnapshotTask[]
}

/**
 * A task naming six or more of the seventeen maps is not a task about those
 * maps: it is "eliminate scavs anywhere" or "survive an extract", written out
 * once per location. Counting those against every map put a dozen chores on
 * every map's list and buried what is actually there.
 */
const ANYWHERE_THRESHOLD = 6

function isAnywhere(task: SnapshotTask) {
  return task.maps.length === 0 || task.maps.length >= ANYWHERE_THRESHOLD
}

export function partitionActiveTasks(
  tasks: SnapshotTask[],
  statuses: Record<string, TaskStatus>
): ActiveTasks {
  const byMap: Record<string, SnapshotTask[]> = {}
  const global: SnapshotTask[] = []
  const gatedByMap: Record<string, SnapshotTask[]> = {}
  const gatedGlobal: SnapshotTask[] = []

  for (const task of tasks) {
    const status = statuses[task.id]
    if (status !== "available" && status !== "gated") continue
    const intoMap = status === "gated" ? gatedByMap : byMap
    const intoGlobal = status === "gated" ? gatedGlobal : global

    if (isAnywhere(task)) {
      intoGlobal.push(task)
      continue
    }
    // A task spanning two maps is active on both: it is one task the player
    // can finish in either raid, not half a task each.
    for (const mapId of task.maps) {
      ;(intoMap[mapId] ??= []).push(task)
    }
  }

  return { byMap, global, gatedByMap, gatedGlobal }
}

export function tasksForMap(
  active: ActiveTasks,
  mapId: string,
  includeGlobal: boolean,
  includeGated = false
): SnapshotTask[] {
  const rows = [...(active.byMap[mapId] ?? [])]
  if (includeGated) rows.push(...(active.gatedByMap[mapId] ?? []))
  if (includeGlobal) {
    rows.push(...active.global)
    if (includeGated) rows.push(...active.gatedGlobal)
  }
  return rows
}

/** How many gated tasks this map is holding, for the control that reveals them. */
export function gatedCountForMap(
  active: ActiveTasks,
  mapId: string,
  includeGlobal: boolean
) {
  return (
    (active.gatedByMap[mapId]?.length ?? 0) +
    (includeGlobal ? active.gatedGlobal.length : 0)
  )
}

export function mapTaskCounts(active: ActiveTasks): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const [mapId, tasks] of Object.entries(active.byMap)) {
    counts[mapId] = tasks.length
  }
  return counts
}

/**
 * The current questline: one task per trader, the one to run next.
 *
 * The dump has lost enough prerequisites that "available" is a wide net —
 * forty-five tasks read as open at level one, where the game gives you about
 * five. Until the upstream data carries the chain again, the honest thing to
 * show first is the front of each trader's queue, ordered by the gates that
 * are still in the data: the level it needs, then the name.
 */
export function frontOfEachLine(tasks: SnapshotTask[]): SnapshotTask[] {
  const byTrader = new Map<string, SnapshotTask>()

  for (const task of tasks) {
    const held = byTrader.get(task.trader)
    if (!held) {
      byTrader.set(task.trader, task)
      continue
    }
    if (task.minPlayerLevel !== held.minPlayerLevel) {
      if (task.minPlayerLevel < held.minPlayerLevel)
        byTrader.set(task.trader, task)
      continue
    }
    if (task.name.localeCompare(held.name) < 0) byTrader.set(task.trader, task)
  }

  return [...byTrader.values()]
}
