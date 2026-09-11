import type { SnapshotTask, TaskStatus } from "./types"

export type NextAction = {
  id: string
  name: string
  trader: string
  /** How many tasks are waiting on this one. */
  unlocks: number
  kappaRequired: boolean
  lightkeeperRequired: boolean
  /** A map to run it on, when the task names one. */
  maps: string[]
}

/** How many tasks name each task as a prerequisite. */
export function countUnlocks(tasks: SnapshotTask[]): Record<string, number> {
  const unlocks: Record<string, number> = {}
  for (const task of tasks) {
    for (const requirement of task.taskRequirements) {
      unlocks[requirement.task] = (unlocks[requirement.task] ?? 0) + 1
    }
  }
  return unlocks
}

/**
 * What to do next, ranked by leverage: an available task that four others
 * wait on opens more of the game than one that ends where it starts.
 *
 * Kappa breaks a tie because it is the longest road in the game — two tasks
 * that unlock the same amount are not equally urgent if one of them is on
 * that road and the other is not.
 */
export function buildNextActions(
  tasks: SnapshotTask[],
  statuses: Record<string, TaskStatus>,
  limit: number
): NextAction[] {
  const unlocks = countUnlocks(tasks)

  return tasks
    .filter((task) => statuses[task.id] === "available")
    .map((task) => ({
      id: task.id,
      name: task.name,
      trader: task.trader,
      unlocks: unlocks[task.id] ?? 0,
      kappaRequired: task.kappaRequired,
      lightkeeperRequired: task.lightkeeperRequired,
      maps: task.maps,
    }))
    .sort((a, b) => {
      if (b.unlocks !== a.unlocks) return b.unlocks - a.unlocks
      if (a.kappaRequired !== b.kappaRequired) return a.kappaRequired ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    .slice(0, limit)
}
