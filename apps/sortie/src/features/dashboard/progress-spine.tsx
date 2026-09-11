import { cn } from "@workspace/ui/lib/utils"

import type { StatCard } from "@/domain/stats"

/**
 * The whole run on one rule, with the two endgames marked where they
 * actually sit rather than as separate cards.
 *
 * Kappa and lightkeeper are not milestones on the task road — they are their
 * own roads, of very different lengths, which is exactly what a card reading
 * "0 / 13" beside one reading "0 / 515" hides. Here they are drawn as their
 * own bars against the same width, so the comparison is the point.
 */
export function ProgressSpine({ cards }: { cards: StatCard[] }) {
  const order = ["tasks", "objectives", "kappa", "lightkeeper", "hideout"]
  const rows = [...cards].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
  )

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((card) => {
        const fraction = card.total === 0 ? 0 : card.done / card.total
        const lead = card.id === "tasks"
        return (
          <li
            key={card.id}
            className="grid grid-cols-[6.5rem_minmax(0,1fr)_4.5rem] items-center gap-x-3"
          >
            <span
              className={cn(
                "truncate font-mono tracking-[0.14em] uppercase",
                lead
                  ? "text-[0.7rem] text-primary"
                  : "text-[0.65rem] text-terminal-chrome"
              )}
            >
              {card.label}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "flex border border-terminal-rule",
                lead ? "h-3" : "h-2"
              )}
            >
              <span
                className={lead ? "bg-primary crt-glow-soft" : "bg-primary/60"}
                style={{ width: `${fraction * 100}%` }}
              />
            </span>
            <span className="text-right font-mono text-[0.65rem] text-terminal-ink-dim tabular-nums">
              {card.done} / {card.total}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
