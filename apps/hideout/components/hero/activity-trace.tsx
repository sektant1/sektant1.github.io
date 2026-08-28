"use client"

import { Tooltip, TooltipTrigger } from "@workspace/ui/components/tooltip"
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
    // Off the floor by four, so a run of empty months reads as a trace lying
    // low rather than as a missing line along the bottom rule.
    y: 84 - (bucket.count / ceiling) * 70,
  }))

  const line = points.map(
    (point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`
  )
  const area = [`0,${height}`, ...line, `${width},${height}`].join(" ")
  const last = points.at(-1)

  return (
    <div className={cn("relative", className)}>
      <svg
        role="img"
        aria-label={`Archive activity. ${describeActivity(buckets)}`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="size-full"
      >
        <g stroke="var(--terminal-rule)" strokeWidth="0.4">
          {[14, 38, 62].map((y) => (
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

      {/* One hit target per month, over the plot rather than in it: an SVG
          circle is not focusable, and a column is a bigger target than a dot
          on a phone. Each lights its own guide line while it is held. */}
      <div className="absolute inset-x-0 top-0 bottom-4">
        {points.map((point) => (
          <TooltipTrigger key={point.month} delay={120}>
            <button
              type="button"
              style={{ left: `${(point.x / width) * 100}%` }}
              className="group absolute inset-y-0 -translate-x-1/2 px-2 focus-visible:outline-none"
              aria-label={`${monthLabel(point.month)}: ${point.count} entries`}
            >
              <span
                aria-hidden="true"
                className="block h-full w-px bg-transparent group-hover:bg-primary/40 group-focus-visible:bg-primary/70"
              />
            </button>
            <Tooltip className="font-mono tracking-widest uppercase">
              {`${monthLabel(point.month)} // ${pad(point.count, 2)}`}
            </Tooltip>
          </TooltipTrigger>
        ))}
      </div>

      {/* The axis: where the window starts, and where it ends. Twelve ticks
          would not survive the panel's width. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 flex items-baseline justify-between px-1 font-mono text-[0.5rem] tracking-widest text-terminal-chrome-dim uppercase"
      >
        <span>{buckets.length ? monthLabel(buckets[0].month) : "---"}</span>
        <span className="text-terminal-ink-faint">PEAK {pad(ceiling, 2)}</span>
        <span>{last ? monthLabel(last.month) : "---"}</span>
      </div>
    </div>
  )
}
