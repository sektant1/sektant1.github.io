import { emptyProgress, type Progress } from "../storage"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isTarkovDevProfile(raw: unknown) {
  if (!isRecord(raw) || typeof raw.aid !== "number") return false
  const info = raw.info
  return (
    isRecord(info) &&
    typeof info.nickname === "string" &&
    typeof info.side === "string"
  )
}

/**
 * `memberCategory` is a bit field, so Unheard has to be tested before the
 * plain editions or an Unheard account reads as Standard.
 */
function editionFromMemberCategory(value: unknown): number {
  if (typeof value !== "number") return 1
  const category = Math.trunc(value)
  if ((category & 1024) === 1024) return 5
  if ((category & 2) === 2) return 4
  if (category === 4) return 2
  if (category === 8) return 3
  return 1
}

/**
 * A tarkov.dev profile carries the account, not the questing: nickname, side,
 * experience, prestige and edition. There is no task state in it at all, so
 * this fills what it has and says so.
 */
export function readTarkovDevProfile(raw: Record<string, unknown>): {
  progress: Progress
  summary: string[]
} {
  const info = raw.info as Record<string, unknown>
  const progress = emptyProgress()

  progress.faction =
    String(info.side).toUpperCase() === "BEAR" ? "BEAR" : "USEC"
  progress.gameEdition = editionFromMemberCategory(info.memberCategory)
  if (typeof info.prestigeLevel === "number") {
    progress.prestige = info.prestigeLevel
  }

  return {
    progress,
    summary: [
      `${String(info.nickname)}, ${progress.faction}`,
      "no task progress — a tarkov.dev profile carries none",
      "set your level by hand after importing",
    ],
  }
}
