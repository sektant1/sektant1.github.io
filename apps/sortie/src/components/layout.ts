/**
 * The layout vocabulary both screens are built from.
 *
 * Every panel had grown its own row height, gap and separator, so a list on
 * the dashboard and a list in the planner agreed on nothing. These are the
 * agreed values; a panel that needs something else says so with a class of
 * its own on top rather than by redefining the row.
 */

/** One row of a list: touch height below md, hairline rule, even gap. */
export const listRow =
  "flex min-h-11 items-center gap-3 border-b border-terminal-rule/40 py-2 last:border-b-0"

/** A row that can wrap its controls onto a second line on a narrow screen. */
export const listRowWrapping = `${listRow} flex-wrap gap-y-1`

/** A bordered pill carrying an icon and a name — a key, a boss, an item. */
export const chip =
  "flex items-center gap-2 border border-terminal-rule py-1 pr-2 pl-1"

/** Two panels side by side above lg, stacked below, aligned at the top. */
export const splitGrid = "grid items-start gap-3 lg:grid-cols-2"

/** The gap every screen stacks its panels with. */
export const stack = "flex flex-col gap-3"

/** A section heading inside a panel. */
export const sectionHeading =
  "font-mono text-[0.65rem] tracking-[0.16em] text-terminal-chrome uppercase"

/** Context beside a value the build or the player's progress knows. */
export const readoutDim =
  "font-mono text-[0.65rem] text-terminal-ink-dim tabular-nums"
