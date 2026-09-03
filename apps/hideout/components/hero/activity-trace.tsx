import { cn } from "@workspace/ui/lib/utils"

import { pad } from "@/lib/format"
import {
  describeActivity,
  monthLabel,
  type ActivityBucket,
} from "@/lib/activity"

/**
 * The archive's rate of change, drawn as a channel.
 *
 * It replaces an oscillator that reported nothing. The shape is now the same
 * fact the counters under it carry, spread over time: how often the station
 * was worked on, month by month, without saying what any entry was.
 *
 * The scale is the busiest month rather than a fixed ceiling, so a quiet year
 * still reads as a line with shape rather than a flat trace along the floor.
 *
 * The axis is a row of its own under the plot rather than a strip laid over
 * it. Printed on top, the three stamps sat in the area fill and on the rule
 * that closes the panel's first block, and the month a reader is looking for
 * was the one thing on the trace they had to read through something else.
 */
export function ActivityTrace({
  buckets,
  className,
}: {
  buckets: ActivityBucket[]
  className?: string
}) {
  const width = 240
  const height = 100
  const ceiling = Math.max(...buckets.map((bucket) => bucket.count), 1)
  const step = buckets.length > 1 ? width / (buckets.length - 1) : width

  const points = buckets.map((bucket, index) => ({
    ...bucket,
    x: index * step,
    // Off the floor by eight, so a run of empty months reads as a trace lying
    // low rather than as a missing line along the bottom rule. The plot has
    // the whole box now that the axis prints below it rather than inside it.
    y: 92 - (bucket.count / ceiling) * 78,
  }))

  const line = points.map(
    (point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`
  )
  const area = [`0,${height}`, ...line, `${width},${height}`].join(" ")
  const last = points.at(-1)

  return (
    <div className={cn("relative flex flex-col", className)}>
      <svg
        role="img"
        aria-label={`Archive activity. ${describeActivity(buckets)}`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        // The plot takes whatever height the panel hands it. In the two-column
        // split the counters beside it are shorter than the index opposite,
        // and a trace that grows into that difference is the block absorbing
        // it — the alternative is a divider drawn down an empty half-panel.
        className="w-full min-h-0 flex-1"
      >
        <g stroke="var(--terminal-rule)" strokeWidth="0.4">
          {[16, 44, 72].map((y) => (
            <line key={y} x1="0" y1={y} x2={width} y2={y} />
          ))}
          {points.map((point) => (
            <line
              key={point.month}
              x1={point.x}
              y1="0"
              x2={point.x}
              y2={height}
            />
          ))}
        </g>

        <polygon points={area} fill="var(--primary)" opacity="0.09" />

        <polyline
          points={line.join(" ")}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.1"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="[filter:drop-shadow(0_0_2px_var(--primary))]"
        />

        {/* Only months that carry something are marked: a dot on every month
            would draw a row of ticks along the floor in a quiet year. */}
        {points
          .filter((point) => point.count > 0)
          .map((point) => (
            <circle
              key={point.month}
              cx={point.x}
              cy={point.y}
              r="1.6"
              fill="var(--primary)"
              vectorEffect="non-scaling-stroke"
            />
          ))}

        {last ? (
          <line
            x1={last.x}
            y1="0"
            x2={last.x}
            y2={height}
            stroke="var(--primary)"
            strokeWidth="0.6"
            strokeDasharray="2 3"
            opacity="0.5"
          />
        ) : null}
      </svg>

      <span
        aria-hidden="true"
        className="absolute top-1 left-1 bg-background/80 px-1 font-mono text-[0.55rem] tracking-widest text-terminal-chrome-dim uppercase"
      >
        changes / month
      </span>

      {/* The axis: where the window starts, and where it ends. Twelve ticks
          would not survive the panel's width. */}
      <div
        aria-hidden="true"
        className="flex shrink-0 items-baseline justify-between gap-2 border-t border-terminal-rule px-1.5 py-0.5 font-mono text-[0.55rem] tracking-[0.12em] text-terminal-chrome-dim uppercase tabular-nums"
      >
        <span>{buckets.length ? monthLabel(buckets[0].month) : "---"}</span>
        <span className="text-terminal-ink-faint">PEAK {pad(ceiling, 2)}</span>
        <span>{last ? monthLabel(last.month) : "---"}</span>
      </div>
    </div>
  )
}
