import { cn } from "@workspace/ui/lib/utils"

type SignalTraceProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Same seed, same trace. Two panels can differ, or agree, on purpose. */
  seed?: number
  /** Samples across the width. More reads as a faster sweep. */
  samples?: number
  /** 0..1 of the plot height. Higher is a noisier channel. */
  amplitude?: number
  /** Draws the graticule the trace is read against. */
  grid?: boolean
  /**
   * Height in CSS pixels of the plot. Leave it out to let the layout decide,
   * which is what a channel filling the rest of a panel wants.
   */
  height?: number
  /** Sweeps a brightening head across the trace, as a live channel does. */
  live?: boolean
  label?: string
}

/**
 * An oscilloscope channel: a trace over a graticule.
 *
 * Deterministic rather than random — a seed produces one waveform, so the
 * server and the client draw the same line and the panel does not flicker
 * into a different signal on hydration. It reports nothing, and says so: the
 * shape is decorative, and any real measurement belongs in a readout beside
 * it where a number can be read off.
 */
function SignalTrace({
  seed = 7,
  samples = 96,
  amplitude = 0.62,
  grid = true,
  height,
  live = true,
  label,
  className,
  ...props
}: SignalTraceProps) {
  const width = 240
  const points: string[] = []

  // A cheap deterministic oscillator: three incommensurable sines, so the
  // trace never visibly repeats across the panel's width.
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples
    const noise =
      Math.sin((t * 37 + seed) * 2.7) * 0.5 +
      Math.sin((t * 11 + seed) * 1.3) * 0.32 +
      Math.sin((t * 79 + seed) * 0.7) * 0.18
    const y = 50 - noise * amplitude * 44
    points.push(`${(t * width).toFixed(2)},${y.toFixed(2)}`)
  }

  return (
    <div
      data-slot="signal-trace"
      className={cn("relative min-w-0", className)}
      style={height === undefined ? undefined : { height }}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
        className="size-full"
      >
        {grid ? (
          <g stroke="var(--terminal-rule)" strokeWidth="0.4">
            {[20, 40, 60, 80].map((y) => (
              <line key={y} x1="0" y1={y} x2={width} y2={y} />
            ))}
            {[40, 80, 120, 160, 200].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="100" />
            ))}
          </g>
        ) : null}

        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.1"
          vectorEffect="non-scaling-stroke"
          className="[filter:drop-shadow(0_0_2px_var(--primary))]"
        />

        {live ? (
          <rect
            x="0"
            y="0"
            width="28"
            height="100"
            fill="var(--primary)"
            opacity="0.14"
            className="motion-safe:animate-[signal-sweep_3.2s_linear_infinite]"
          />
        ) : null}
      </svg>

      {label ? (
        <span className="absolute start-1 top-0 font-mono text-[0.5rem] tracking-widest text-terminal-chrome-dim uppercase">
          {label}
        </span>
      ) : null}
    </div>
  )
}

export { SignalTrace }
