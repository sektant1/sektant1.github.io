import type { SnapshotTask, TaskStatus } from "./types"

export type ActiveTasks = {
  byMap: Record<string, SnapshotTask[]>
  /** Available tasks that name no map — doable on any raid. */
  global: SnapshotTask[]
}

export function partitionActiveTasks(
  tasks: SnapshotTask[],
  statuses: Record<string, TaskStatus>
): ActiveTasks {
  const byMap: Record<string, SnapshotTask[]> = {}
  const global: SnapshotTask[] = []

  for (const task of tasks) {
    if (statuses[task.id] !== "available") continue
    if (task.maps.length === 0) {
      global.push(task)
      continue
    }
    // A task spanning two maps is active on both: it is one task the player
    // can finish in either raid, not half a task each.
    for (const mapId of task.maps) {
      ;(byMap[mapId] ??= []).push(task)
    }
  }

  return { byMap, global }
}

export function tasksForMap(
  active: ActiveTasks,
  mapId: string,
  includeGlobal: boolean
): SnapshotTask[] {
  const onMap = active.byMap[mapId] ?? []
  return includeGlobal ? [...onMap, ...active.global] : onMap
}

export function mapTaskCounts(active: ActiveTasks): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const [mapId, tasks] of Object.entries(active.byMap)) {
    counts[mapId] = tasks.length
  }
  return counts
}
