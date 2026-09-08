import type { Faction, SnapshotTask, TaskCompletion, TaskStatus } from "./types"

export type GraphContext = {
  completions: Record<string, TaskCompletion>
  level: number
  faction: Faction
  /** Trader id to the level the player has with them. Absent means level 1. */
  traderLevels: Record<string, number>
}

/**
 * A requirement is met when the prerequisite's completion is one the
 * requirement names. Some tasks open on a *failed* prerequisite, so this
 * compares against the list rather than testing for completeness.
 */
function requirementMet(
  requirement: { task: string; status: string[] },
  completions: Record<string, TaskCompletion>
) {
  const completion = completions[requirement.task]
  if (!completion) return false
  return requirement.status.includes(completion)
}

export function buildTaskStatuses(
  tasks: SnapshotTask[],
  context: GraphContext
): Record<string, TaskStatus> {
  const statuses: Record<string, TaskStatus> = {}

  for (const task of tasks) {
    const completion = context.completions[task.id]
    if (completion) {
      statuses[task.id] = completion
      continue
    }

    const factionOk =
      task.factionName === "Any" || task.factionName === context.faction
    const levelOk = context.level >= task.minPlayerLevel
    const prerequisitesOk = task.taskRequirements.every((requirement) =>
      requirementMet(requirement, context.completions)
    )
    const tradersOk = task.traderRequirements.every(
      (requirement) =>
        (context.traderLevels[requirement.trader] ?? 1) >= requirement.level
    )

    statuses[task.id] =
      factionOk && levelOk && prerequisitesOk && tradersOk
        ? "available"
        : "locked"
  }

  return statuses
}
