import { isRecord, migrateProgress, type Progress } from "../storage"
import { isTarkovDevProfile, readTarkovDevProfile } from "./tarkovdev"
import { isTarkovTrackerBackup, readTarkovTrackerBackup } from "./tarkovtracker"

export type ImportPreview =
  | {
      source: "sortie" | "tarkovtracker" | "tarkov.dev"
      progress: Progress
      summary: string[]
    }
  | { source: null; error: string }

/**
 * Nothing is applied here. The caller shows the preview and the player
 * decides, because an import replaces everything they have.
 */
export function readImport(raw: unknown): ImportPreview {
  if (!isRecord(raw)) {
    return { source: null, error: "the file does not contain an object" }
  }

  if (raw._format === "sortie-progress") {
    const progress = migrateProgress(raw.progress)
    return {
      source: "sortie",
      progress,
      summary: [
        `level ${progress.level}, ${progress.faction}`,
        `${Object.keys(progress.taskCompletions).length} tasks recorded`,
      ],
    }
  }

  if (isTarkovTrackerBackup(raw)) {
    return { source: "tarkovtracker", ...readTarkovTrackerBackup(raw) }
  }

  if (isTarkovDevProfile(raw)) {
    return { source: "tarkov.dev", ...readTarkovDevProfile(raw) }
  }

  return {
    source: null,
    error:
      "the file is not a sortie export, a TarkovTracker backup or a tarkov.dev profile",
  }
}

/** The shape this app writes, read back by the first branch above. */
export function buildExport(progress: Progress) {
  return {
    _format: "sortie-progress",
    exportedAt: new Date().toISOString(),
    progress,
  }
}
