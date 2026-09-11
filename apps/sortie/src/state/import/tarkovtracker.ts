import { emptyProgress, isRecord, type Progress } from "../storage"

export function isTarkovTrackerBackup(raw: unknown) {
  return isRecord(raw) && raw._format === "tarkovtracker-backup"
}

/**
 * A backup holds both game modes. Only the one it was saved in is read —
 * merging them would invent a progression the player never had.
 */
export function readTarkovTrackerBackup(raw: Record<string, unknown>): {
  progress: Progress
  summary: string[]
} {
  const pve = raw.currentGameMode === "pve"
  const side = pve ? raw.pve : raw.pvp
  const progress = emptyProgress()
  progress.gameMode = pve ? "pve" : "regular"

  if (typeof raw.gameEdition === "number") {
    progress.gameEdition = raw.gameEdition
  }

  if (isRecord(side)) {
    if (typeof side.level === "number") progress.level = side.level
    if (side.pmcFaction === "BEAR" || side.pmcFaction === "USEC") {
      progress.faction = side.pmcFaction
    }

    if (isRecord(side.taskCompletions)) {
      for (const [taskId, value] of Object.entries(side.taskCompletions)) {
        if (!isRecord(value)) continue
        if (value.failed === true) progress.taskCompletions[taskId] = "failed"
        else if (value.complete === true) {
          progress.taskCompletions[taskId] = "complete"
        }
      }
    }

    if (isRecord(side.taskObjectives)) {
      for (const [objectiveId, value] of Object.entries(side.taskObjectives)) {
        if (!isRecord(value)) continue
        if (typeof value.count === "number") {
          progress.objectiveCounts[objectiveId] = value.count
        } else if (value.complete === true) {
          progress.objectiveCounts[objectiveId] = 1
        }
      }
    }

    if (isRecord(side.traderLevels)) {
      for (const [traderId, level] of Object.entries(side.traderLevels)) {
        if (typeof level === "number") progress.traderLevels[traderId] = level
      }
    }

    if (isRecord(side.hideoutModules)) {
      for (const [stationId, level] of Object.entries(side.hideoutModules)) {
        if (typeof level === "number") {
          progress.hideoutLevels[stationId] = level
        }
      }
    }
  }

  const completions = Object.values(progress.taskCompletions)
  const complete = completions.filter((value) => value === "complete").length
  const failed = completions.filter((value) => value === "failed").length

  return {
    progress,
    summary: [
      `level ${progress.level}, ${progress.faction}`,
      `${complete} task complete, ${failed} failed`,
      `${Object.keys(progress.objectiveCounts).length} objectives carried over`,
    ],
  }
}
