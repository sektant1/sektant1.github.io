import { createPersistedPreference } from "@workspace/ui/lib/persisted-preference"

export const COLD_BOOT_STORAGE_KEY = "cold-boot-seen"

/**
 * How long one viewing counts for.
 *
 * The sequence used to be shown once and then never again, which made it a
 * thing you saw on your first visit and forgot the site had. An hour is the
 * span where a return reads as coming back rather than as still being here:
 * long enough that clicking through five posts never replays it, short enough
 * that tomorrow's visit gets the machine switching on again.
 */
export const COLD_BOOT_TTL_MS = 60 * 60 * 1000

/**
 * Storage is blocked, so nothing written now will be readable later.
 *
 * A private window would otherwise replay the whole sequence on every page
 * view — a greeting turned into a toll — so it reads as just watched instead.
 */
const UNAVAILABLE = -1

/**
 * When this terminal last watched the boot sequence, as epoch milliseconds.
 *
 * The key held "1"/"0" before it held a stamp. An old "1" parses as a
 * timestamp from 1970, which is due by any measure: the reader gets the
 * sequence once more and the next write puts a real stamp in its place.
 */
export const coldBootLastSeen = createPersistedPreference<number>({
  key: COLD_BOOT_STORAGE_KEY,
  fallback: 0,
  whenUnavailable: UNAVAILABLE,
  parse: (raw) => {
    const stamp = Number(raw)
    return Number.isFinite(stamp) && stamp > 0 ? stamp : null
  },
  serialize: (value) => String(value),
})

/**
 * Whether the sequence should run again.
 *
 * The comparison is on distance, in either direction, and the reason is the
 * one that broke this: `now` is read once when the document opens, and the
 * stamp is written later, when the reader dismisses the curtain. So the site's
 * own stamp is routinely *ahead* of the reading it is compared against, and a
 * rule that treated any future stamp as a moved clock ran the whole sequence
 * again on the next page the reader opened.
 *
 * A stamp from the near future is this session. A stamp from further ahead
 * than the window itself is a clock that genuinely moved — a machine waking
 * from sleep, a timezone edit, a fresh VM — and is not worth waiting out.
 */
export function bootIsDue(lastSeen: number, now: number): boolean {
  if (lastSeen === UNAVAILABLE) return false
  if (!Number.isFinite(lastSeen) || lastSeen <= 0) return true
  return Math.abs(now - lastSeen) >= COLD_BOOT_TTL_MS
}

/**
 * When this document was opened.
 *
 * The window is measured from one reading taken on the first call, not from
 * the clock at render time: a tab left open for an hour should not have the
 * curtain reappear under the reader on the next re-render, and a component
 * that reads the clock while rendering is not a pure component.
 */
let openedAt = 0

export function bootDueOnThisLoad(lastSeen: number): boolean {
  if (!openedAt) openedAt = Date.now()
  return bootIsDue(lastSeen, openedAt)
}
