/**
 * The archive's activity over time, from the dates the content carries.
 *
 * One bucket per month, counting everything dated into it — posts, projects,
 * games together. What each entry was is deliberately not part of the series:
 * the panel reports that the station was worked on, at what rate, the way a
 * contribution graph does.
 *
 * Git would be the richer source and is not a usable one: the deploy checks
 * out at depth 1, so a published build can see one commit. The dates in the
 * content are the same facts, and they survive a shallow clone.
 */

export interface ActivityBucket {
  /** First day of the month, ISO, for the tooltip and the label. */
  month: string
  count: number
}

const MONTH_LABEL = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
})

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`
}

/**
 * Buckets ISO dates into the last `months` calendar months, oldest first.
 * Dates that do not parse, and anything older than the window, are dropped —
 * the series is a window, not a total.
 */
export function buildActivity(
  dates: string[],
  months = 12,
  now = new Date()
): ActivityBucket[] {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const buckets = new Map<string, number>()

  for (let back = months - 1; back >= 0; back -= 1) {
    const month = new Date(end)
    month.setUTCMonth(month.getUTCMonth() - back)
    buckets.set(monthKey(month), 0)
  }

  for (const value of dates) {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) continue
    const key = monthKey(parsed)
    const current = buckets.get(key)
    if (current === undefined) continue
    buckets.set(key, current + 1)
  }

  return [...buckets].map(([month, count]) => ({ month, count }))
}

/** `AUG 26` — the axis tick under a bucket. */
export function monthLabel(month: string): string {
  return MONTH_LABEL.format(new Date(month)).replace(/\s/g, " ").toUpperCase()
}

/** A sentence for the reader who hears the panel rather than sees it. */
export function describeActivity(buckets: ActivityBucket[]): string {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0)
  if (!total) return "No archive activity in the last year."
  const busiest = buckets.reduce((top, bucket) =>
    bucket.count > top.count ? bucket : top
  )
  return `${total} entries over ${buckets.length} months, busiest ${monthLabel(busiest.month)} with ${busiest.count}.`
}
