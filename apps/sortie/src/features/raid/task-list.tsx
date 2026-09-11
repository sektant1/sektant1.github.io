import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

import { GameImage } from "@/components/game-image"
import { Segmented, Toggle } from "@/components/segmented"
import { sectionHeading } from "@/components/layout"
import { Panel } from "@/components/panel"
import type {
  SnapshotItem,
  SnapshotTask,
  SnapshotTrader,
  TaskCompletion,
} from "@/domain/types"
import { TaskCard } from "./task-card"

type Filter = "all" | "kappa" | "lightkeeper"

export function TaskList({
  tasks,
  anywhereTasks,
  openCount,
  showAll,
  onToggleAll,
  traders,
  items,
  gatedCount,
  includeGated,
  onToggleGated,
  unlockCounts,
  objectiveCounts,
  onObjectiveCount,
  onComplete,
}: {
  /** Tasks tied to the selected map. */
  tasks: SnapshotTask[]
  /** Tasks that name no map, or name most of them. Listed separately. */
  anywhereTasks: SnapshotTask[]
  /** Everything the app believes is open here, before the questline cut. */
  openCount: number
  showAll: boolean
  onToggleAll: () => void
  traders: SnapshotTrader[]
  items: Record<string, SnapshotItem>
  /** How many tasks this map is holding behind a storyline gate. */
  gatedCount: number
  includeGated: boolean
  onToggleGated: () => void
  /** Task id to how many tasks name it as a prerequisite. */
  unlockCounts: Record<string, number>
  objectiveCounts: Record<string, number>
  onObjectiveCount: (objectiveId: string, count: number) => void
  onComplete: (taskId: string, completion: TaskCompletion) => void
}) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const [trader, setTrader] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")

  const tradersById = new Map(traders.map((entry) => [entry.id, entry]))

  const traderCounts = new Map<string, number>()
  for (const task of [...tasks, ...anywhereTasks]) {
    traderCounts.set(task.trader, (traderCounts.get(task.trader) ?? 0) + 1)
  }

  // Only the traders who actually have something here. A row of sixteen
  // portraits, half of them greyed out, is a worse control than five.
  const onOffer = [...traderCounts.keys()]
    .map((id) => tradersById.get(id))
    .filter((entry): entry is SnapshotTrader => Boolean(entry))
    .sort((a, b) => a.name.localeCompare(b.name))

  const matches = (task: SnapshotTask) => {
    if (filter === "kappa" && !task.kappaRequired) return false
    if (filter === "lightkeeper" && !task.lightkeeperRequired) return false
    if (trader && task.trader !== trader) return false
    if (!query) return true
    const needle = query.toLowerCase()
    return (
      task.name.toLowerCase().includes(needle) ||
      (tradersById.get(task.trader)?.name ?? "").toLowerCase().includes(needle)
    )
  }

  const shown = tasks.filter(matches)

  // Two groups, because they answer different questions: what this map has,
  // and what you could finish on any raid. Mixed together, a BTR Driver task
  // that names no map looked like it had been filed under every map by
  // mistake.
  const groups = [
    { title: "on this map", tasks: shown },
    { title: "anywhere", tasks: anywhereTasks.filter(matches) },
  ].filter((group) => group.tasks.length)

  return (
    <Panel
      title="Active tasks"
      controls={
        <span
          className="font-mono text-[0.65rem] text-terminal-chrome-dim tabular-nums"
          title="shown of everything open on this map"
        >
          {shown.length} / {openCount}
        </span>
      }
    >
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="How much of each trader's line to show"
            size="compact"
            value={showAll ? "all" : "questline"}
            onChange={(next) => {
              if ((next === "all") !== showAll) onToggleAll()
            }}
            options={[
              {
                value: "questline",
                label: "questline",
                title:
                  "The front of each trader's queue — what the game would have you do next",
              },
              { value: "all", label: "everything", trailing: openCount },
            ]}
          />

          <Segmented
            label="Which kind of task"
            size="compact"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "any" },
              { value: "kappa", label: "kappa" },
              { value: "lightkeeper", label: "lightkeeper" },
            ]}
          />

          {gatedCount ? (
            <Toggle
              active={includeGated}
              onClick={onToggleGated}
              className="min-h-9 md:min-h-8"
              title="Tasks the game holds behind a storyline variable whose value it does not publish"
            >
              storyline
              <span className="tabular-nums opacity-70">{gatedCount}</span>
            </Toggle>
          ) : null}

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="filter by name…"
            aria-label="Filter tasks by name"
            className="ml-auto min-h-9 w-full border border-terminal-rule bg-transparent px-2 font-mono text-[0.7rem] text-foreground placeholder:text-terminal-chrome-dim focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:min-h-8 md:w-48"
          />
        </div>

        {onOffer.length > 1 ? (
          <div
            role="radiogroup"
            aria-label="Trader"
            className="flex flex-wrap items-center gap-1"
          >
            {/* Portraits, not names: nine traders spelled out was a second
                wall of boxes, and the face is how anyone who plays this game
                already recognises them. */}
            <button
              type="button"
              role="radio"
              aria-checked={trader === null}
              onClick={() => setTrader(null)}
              className={cn(
                "min-h-11 border px-2 font-mono text-[0.65rem] tracking-[0.12em] uppercase md:min-h-9",
                trader === null
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-terminal-rule text-terminal-chrome hover:text-primary"
              )}
            >
              all traders
            </button>
            {onOffer.map((entry) => {
              const count = traderCounts.get(entry.id) ?? 0
              const active = trader === entry.id
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  title={`${entry.name} — ${count} task${count === 1 ? "" : "s"}`}
                  onClick={() => setTrader(active ? null : entry.id)}
                  className={cn(
                    "flex min-h-11 items-center gap-1.5 border px-1.5 transition-colors md:min-h-9",
                    "focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                    active
                      ? "border-primary/60 bg-primary/15"
                      : "border-terminal-rule opacity-70 hover:opacity-100"
                  )}
                >
                  <GameImage
                    src={entry.imageLink}
                    alt={entry.name}
                    fit="cover"
                    className="size-9"
                  />
                  <span
                    className={cn(
                      "font-mono text-[0.7rem] tabular-nums",
                      active ? "text-primary" : "text-terminal-chrome"
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {groups.length ? (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <section key={group.title} className="flex flex-col gap-2">
              <h3 className={sectionHeading}>
                {group.title}
                <span className="ml-2 text-terminal-chrome-dim tabular-nums">
                  {group.tasks.length}
                </span>
              </h3>
              <ul className="flex flex-col gap-2">
                {group.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    trader={tradersById.get(task.trader)}
                    items={items}
                    unlocks={unlockCounts[task.id] ?? 0}
                    objectiveCounts={objectiveCounts}
                    onObjectiveCount={onObjectiveCount}
                    onComplete={(completion) => onComplete(task.id, completion)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="font-mono text-xs text-terminal-ink-dim">
          {tasks.length + anywhereTasks.length
            ? "nothing matches that filter"
            : "nothing available here — raise your level, or finish what gates it"}
        </p>
      )}
    </Panel>
  )
}
