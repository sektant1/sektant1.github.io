import * as React from "react"

import { snapshot } from "@/data/snapshot"
import { buildTaskStatuses } from "@/domain/task-graph"
import type { Progress } from "./storage"

/**
 * Every task's status for the player's progress. Both screens start from it,
 * so the fields that gate a task are listed once, here.
 */
export function useTaskStatuses(progress: Progress) {
  return React.useMemo(
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
}
