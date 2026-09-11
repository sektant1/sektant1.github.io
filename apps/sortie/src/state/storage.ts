import type { Faction, GameMode, TaskCompletion } from "@/domain/types"

export const STORAGE_KEY = "skt:sortie:progress"
const VERSION = 1

export type Progress = {
  version: number
  level: number
  faction: Faction
  gameMode: GameMode
  gameEdition: number
  prestige: number
  fenceRep: number
  taskCompletions: Record<string, TaskCompletion>
  objectiveCounts: Record<string, number>
  traderLevels: Record<string, number>
  traderRep: Record<string, number>
  hideoutLevels: Record<string, number>
  /** Map id to the checklist entry ids ticked for it. */
  checklistTicks: Record<string, string[]>
  notes: Record<string, string>
}

export function emptyProgress(): Progress {
  return {
    version: VERSION,
    level: 1,
    faction: "USEC",
    gameMode: "regular",
    gameEdition: 1,
    prestige: 0,
    fenceRep: 0,
    taskCompletions: {},
    objectiveCounts: {},
    traderLevels: {},
    traderRep: {},
    hideoutLevels: {},
    checklistTicks: {},
    notes: {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function readMap<T>(value: unknown, guard: (entry: unknown) => entry is T) {
  const result: Record<string, T> = {}
  if (!isRecord(value)) return result
  for (const [key, entry] of Object.entries(value)) {
    if (guard(entry)) result[key] = entry
  }
  return result
}

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)
const isString = (value: unknown): value is string => typeof value === "string"
const isCompletion = (value: unknown): value is TaskCompletion =>
  value === "complete" || value === "failed"
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString)

/**
 * Every field is validated on the way in. A shape written by an older build —
 * or edited by hand — must not be able to crash a screen, so anything that
 * does not read as its own type is dropped rather than carried.
 */
export function migrateProgress(raw: unknown): Progress {
  const empty = emptyProgress()
  if (!isRecord(raw)) return empty

  return {
    version: VERSION,
    level: readNumber(raw.level, empty.level),
    faction: raw.faction === "BEAR" ? "BEAR" : "USEC",
    gameMode: raw.gameMode === "pve" ? "pve" : "regular",
    gameEdition: readNumber(raw.gameEdition, empty.gameEdition),
    prestige: readNumber(raw.prestige, empty.prestige),
    fenceRep: readNumber(raw.fenceRep, empty.fenceRep),
    taskCompletions: readMap(raw.taskCompletions, isCompletion),
    objectiveCounts: readMap(raw.objectiveCounts, isNumber),
    traderLevels: readMap(raw.traderLevels, isNumber),
    traderRep: readMap(raw.traderRep, isNumber),
    hideoutLevels: readMap(raw.hideoutLevels, isNumber),
    checklistTicks: readMap(raw.checklistTicks, isStringArray),
    notes: readMap(raw.notes, isString),
  }
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return emptyProgress()
    return migrateProgress(JSON.parse(raw))
  } catch {
    // A private window throws on access, not only on write.
    return emptyProgress()
  }
}

export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Session-only. The shell says so; see storageAvailable below.
  }
}

/** Whether this browser will keep anything. The shell reads it once. */
export function storageAvailable() {
  try {
    localStorage.getItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
