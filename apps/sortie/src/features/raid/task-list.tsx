import * as React from "react"
import { Checkbox } from "@workspace/ui/components/checkbox"

import { Counter } from "@/components/counter"
import { GameImage } from "@/components/game-image"
import { KeyButton } from "@/components/key-button"
import { Panel } from "@/components/panel"
import type {
  SnapshotTask,
  SnapshotTrader,
  TaskCompletion,
} from "@/domain/types"

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-primary/40 px-1.5 py-0.5 font-mono text-[0.6rem] tracking-[0.12em] text-primary uppercase">
      {children}
    </span>
  )
}

function TaskCard({
  task,
  trader,
  unlocks,
  objectiveCounts,
  onObjectiveCount,
  onComplete,
}: {
  task: SnapshotTask
  trader: SnapshotTrader | undefined
  unlocks: number
  objectiveCounts: Record<string, number>
  onObjectiveCount: (objectiveId: string, count: number) => void
  onComplete: (completion: TaskCompletion) => void
}) {
  const done = task.objectives.filter(
    (objective) => (objectiveCounts[objective.id] ?? 0) >= objective.count
  ).length
  const ready = task.objectives.length > 0 && done === task.objectives.length

  return (
    <li className="flex flex-col border border-terminal-rule">
      <div className="flex items-start gap-3 border-b border-terminal-rule/60 p-3">
        {/* Task art is a wide still, not an icon: contained in a square it
            sat in a letterbox two thirds empty. */}
        <GameImage
          src={task.imageLink}
          alt=""
          fit="cover"
          className="hidden aspect-video w-28 sm:grid"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
            <h3 className="min-w-0 flex-1 font-sans text-sm font-bold tracking-[0.06em] text-primary uppercase crt-glow-soft">
              {task.name}
            </h3>
            {task.wikiLink ? (
              <a
                href={task.wikiLink}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 font-mono text-[0.65rem] text-terminal-chrome underline decoration-dotted underline-offset-2 hover:text-primary"
              >
                wiki ↗
              </a>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[0.65rem] text-terminal-ink-dim">
            <span className="flex items-center gap-1.5">
              <GameImage
                src={trader?.imageLink ?? null}
                alt=""
                fit="cover"
                className="size-5"
              />
              {trader?.name ?? task.trader}
            </span>
            <span className="tabular-nums">
              {task.experience.toLocaleString("en-GB")} XP
            </span>
            {unlocks > 0 ? <span>leads to {unlocks}</span> : null}
            {task.objectives.length ? (
              <span className="tabular-nums">
                {done} / {task.objectives.length} done
              </span>
            ) : null}
            {task.kappaRequired ? <Tag>kappa</Tag> : null}
            {task.lightkeeperRequired ? <Tag>lightkeeper</Tag> : null}
          </div>
        </div>
      </div>

      {task.objectives.length ? (
        <ul className="flex flex-col px-3">
          {task.objectives.map((objective) => {
            const count = objectiveCounts[objective.id] ?? 0
            const single = objective.count <= 1
            return (
              <li
                key={objective.id}
                className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-b border-terminal-rule/40 py-2 last:border-b-0"
              >
                {single ? (
                  <div className="flex w-full items-center gap-2">
                    <Checkbox
                      aria-label={objective.description}
                      isSelected={count >= 1}
                      onChange={(next) =>
                        onObjectiveCount(objective.id, next ? 1 : 0)
                      }
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() =>
                        onObjectiveCount(objective.id, count >= 1 ? 0 : 1)
                      }
                      className={
                        count >= 1
                          ? "min-w-0 flex-1 cursor-pointer text-left font-mono text-xs text-terminal-chrome-dim line-through"
                          : "min-w-0 flex-1 cursor-pointer text-left font-mono text-xs text-foreground"
                      }
                    >
                      {objective.description}
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 font-mono text-xs text-foreground">
                      {objective.description}
                    </span>
                    <Counter
                      value={count}
                      total={objective.count}
                      label={objective.description}
                      onChange={(next) => onObjectiveCount(objective.id, next)}
                    />
                  </>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}

      <div className="flex items-center gap-1 p-3">
        <KeyButton active={ready} onClick={() => onComplete("complete")}>
          complete
        </KeyButton>
        <KeyButton onClick={() => onComplete("failed")}>failed</KeyButton>
        {ready ? (
          <span className="ml-1 font-mono text-[0.65rem] text-primary">
            every objective ticked
          </span>
        ) : null}
      </div>
    </li>
  )
}

type Filter = "all" | "kappa" | "lightkeeper"

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "kappa", label: "kappa" },
  { id: "lightkeeper", label: "lightkeeper" },
]

export function TaskList({
  tasks,
  traders,
  unlockCounts,
  objectiveCounts,
  onObjectiveCount,
  onComplete,
}: {
  tasks: SnapshotTask[]
  traders: SnapshotTrader[]
  /** Task id to how many tasks name it as a prerequisite. */
  unlockCounts: Record<string, number>
  objectiveCounts: Record<string, number>
  onObjectiveCount: (objectiveId: string, count: number) => void
  onComplete: (taskId: string, completion: TaskCompletion) => void
}) {
  const [filter, setFilter] = React.useState<Filter>("all")
  const [query, setQuery] = React.useState("")

  const tradersById = new Map(traders.map((trader) => [trader.id, trader]))

  const shown = tasks.filter((task) => {
    if (filter === "kappa" && !task.kappaRequired) return false
    if (filter === "lightkeeper" && !task.lightkeeperRequired) return false
    if (!query) return true
    const needle = query.toLowerCase()
    return (
      task.name.toLowerCase().includes(needle) ||
      (tradersById.get(task.trader)?.name ?? "").toLowerCase().includes(needle)
    )
  })

  return (
    <Panel
      title="ЗАДАЧИ"
      srTitle="Active tasks"
      controls={
        <span className="font-mono text-[0.65rem] text-terminal-chrome-dim tabular-nums">
          {shown.length === tasks.length
            ? tasks.length
            : `${shown.length} / ${tasks.length}`}
        </span>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-1">
        {FILTERS.map((entry) => (
          <KeyButton
            key={entry.id}
            className="min-h-9 md:min-h-0"
            active={filter === entry.id}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
          </KeyButton>
        ))}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="filter by name or trader…"
          className="ml-auto min-h-9 w-full border border-terminal-rule bg-transparent px-2 py-1 font-mono text-[0.7rem] text-foreground placeholder:text-terminal-chrome-dim focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:w-56"
        />
      </div>

      {shown.length ? (
        <ul className="flex flex-col gap-2">
          {shown.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              trader={tradersById.get(task.trader)}
              unlocks={unlockCounts[task.id] ?? 0}
              objectiveCounts={objectiveCounts}
              onObjectiveCount={onObjectiveCount}
              onComplete={(completion) => onComplete(task.id, completion)}
            />
          ))}
        </ul>
      ) : (
        <p className="font-mono text-xs text-terminal-ink-dim">
          {tasks.length
            ? "nothing matches that filter"
            : "nothing available here — raise your level, or finish what gates it"}
        </p>
      )}
    </Panel>
  )
}
