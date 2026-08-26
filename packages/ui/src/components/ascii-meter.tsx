import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const meterVariants = cva("font-mono whitespace-pre tabular-nums", {
  variants: {
    tone: {
      default: "text-primary text-glow-soft",
      muted: "text-muted-foreground",
      warning: "text-destructive",
    },
    size: {
      sm: "text-[10px]",
      default: "text-xs",
    },
  },
  defaultVariants: { tone: "default", size: "default" },
})

type AsciiMeterProps = Omit<React.ComponentProps<"div">, "children"> &
  VariantProps<typeof meterVariants> & {
    label: string
    /** 0..1. Values outside the range are clamped. */
    value: number
    /** Cells in the bar. */
    cells?: number
    /** Appended after the percentage, e.g. "MB" or "OPS". */
    unit?: string
  }

/**
 * An ASCII gauge. Uses '#' and '.' rather than block-drawing characters,
 * which the theme's mono face lacks — they would fall back to another font at
 * a different width and misalign the bar.
 *
 * Styled after a hardware status readout. Exposed to assistive tech as a
 * real progressbar rather than as decorative glyphs.
 */
function AsciiMeter({
  label,
  value,
  cells = 16,
  unit,
  tone,
  size,
  className,
  ...props
}: AsciiMeterProps) {
  const clamped = value < 0 ? 0 : value > 1 ? 1 : value
  const filled = Math.round(clamped * cells)
  const percent = Math.round(clamped * 100)

  return (
    <div
      data-slot="ascii-meter"
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "flex items-center gap-2",
        meterVariants({ tone, size }),
        className
      )}
      {...props}
    >
      <span className="shrink-0 tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <span aria-hidden="true" className="shrink-0">
        [{"#".repeat(filled)}
        <span className="text-muted-foreground/40">
          {".".repeat(cells - filled)}
        </span>
        ]
      </span>
      <span className="shrink-0">
        {String(percent).padStart(3, " ")}%{unit ? ` ${unit}` : ""}
      </span>
    </div>
  )
}

export { AsciiMeter, meterVariants }
