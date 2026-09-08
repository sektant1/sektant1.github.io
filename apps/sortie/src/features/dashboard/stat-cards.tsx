import { Link } from "react-router"
import { AsciiMeter } from "@workspace/ui/components/ascii-meter"

import type { StatCard } from "@/domain/stats"
import { cardGrid, readoutDim } from "@/components/layout"

/**
 * The six readings that answer "where am I". Each one links into the planner
 * rather than being a dead number.
 */
export function StatCards({ cards }: { cards: StatCard[] }) {
  return (
    <ul className={cardGrid}>
      {cards.map((card) => (
        <li key={card.id}>
          <Link
            to="/raid"
            className="flex flex-col gap-1.5 border border-terminal-rule p-3 hover:border-primary/60 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          >
            {/* The meter prints the label itself, so the card adds only the
                percentage the fraction does not carry. */}
            <AsciiMeter
              label={card.label}
              value={card.total === 0 ? 0 : card.done / card.total}
              cells={20}
              display={`${card.done} / ${card.total}`}
            />
            <span className={readoutDim}>
              {card.total === 0
                ? "0%"
                : `${Math.round((card.done / card.total) * 100)}%`}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
