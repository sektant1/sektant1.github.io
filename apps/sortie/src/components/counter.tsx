import { KeyButton } from "./key-button"

/**
 * An `x / y` counter. Used wherever an objective is counted rather than
 * ticked — five kills, three bottles — and the reading between the keys is
 * the value itself, so it carries no border of its own.
 */
export function Counter({
  value,
  total,
  label,
  onChange,
}: {
  value: number
  total: number
  /** What is being counted, for assistive tech. */
  label: string
  onChange: (next: number) => void
}) {
  const clamped = Math.min(Math.max(value, 0), total)

  return (
    <div className="flex shrink-0 items-center gap-1">
      <KeyButton
        className="min-h-9 px-2 md:min-h-0"
        disabled={clamped <= 0}
        aria-label={`one fewer ${label}`}
        onClick={() => onChange(clamped - 1)}
      >
        −
      </KeyButton>
      <span
        className="min-w-14 text-center font-mono text-[0.7rem] text-primary tabular-nums crt-glow-soft"
        aria-label={`${label}: ${clamped} of ${total}`}
      >
        {clamped} / {total}
      </span>
      <KeyButton
        className="min-h-9 px-2 md:min-h-0"
        disabled={clamped >= total}
        aria-label={`one more ${label}`}
        onClick={() => onChange(clamped + 1)}
      >
        +
      </KeyButton>
    </div>
  )
}
