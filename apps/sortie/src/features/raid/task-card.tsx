import type * as React from "react"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { cn } from "@workspace/ui/lib/utils"

import { Counter } from "@/components/counter"
import { GameImage } from "@/components/game-image"
import { KeyButton } from "@/components/key-button"
import { listRowWrapping } from "@/components/layout"
import type {
  SnapshotItem,
  SnapshotTask,
  SnapshotTrader,
  TaskCompletion,
} from "@/domain/types"

function Tag({
  tone = "primary",
  title,
  children,
}: {
  tone?: "primary" | "quiet"
  title?: string
  children: React.ReactNode
}) {
  return (
    <span
      title={title}
      className={cn(
        "px-1.5 py-0.5 font-mono text-[0.6rem] tracking-[0.12em] uppercase",
        tone === "primary"
          ? "border border-primary/40 text-primary"
          : "border border-terminal-rule text-terminal-chrome"
      )}
    >
      {children}
    </span>
  )
}

/**
 * The items an objective names, and whether they have to come out of a raid.
 * "Found in raid" is the difference between buying it off the flea and
 * dying for it, so it is stated rather than left to the description.
 */
function ObjectiveItems({
  ids,
  foundInRaid,
  items,
}: {
  ids: string[]
  foundInRaid: boolean
  items: Record<string, SnapshotItem>
}) {
  if (!ids.length) return null
  const shown = ids.slice(0, 4)

  return (
    <span className="flex shrink-0 items-center gap-1">
      {foundInRaid ? (
        <span
          title="Must be found in raid"
          className="border border-primary/50 px-1 py-0.5 font-mono text-[0.55rem] tracking-[0.1em] text-primary uppercase"
        >
          fir
        </span>
      ) : null}
      {shown.map((id) => (
        <GameImage
          key={id}
          src={items[id]?.iconLink ?? null}
          alt={items[id]?.name ?? id}
          title={items[id]?.name ?? id}
          className="size-7"
        />
      ))}
      {ids.length > shown.length ? (
        <span className="font-mono text-[0.65rem] text-terminal-chrome-dim tabular-nums">
          +{ids.length - shown.length}
        </span>
      ) : null}
    </span>
  )
}

/**
 * One cell per objective, lit as each is settled. Same measure as the pack
 * state above it, at card scale — a card two of three through reads as that
 * at a glance, before any number is parsed.
 */
function ObjectiveTape({ done, total }: { done: number; total: number }) {
  if (total === 0) return null
  return (
    <span aria-hidden="true" className="flex gap-0.5">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1 w-4",
            index < done ? "bg-primary" : "bg-terminal-rule/60"
          )}
        />
      ))}
    </span>
  )
}

export function TaskCard({
  task,
  trader,
  items,
  unlocks,
  objectiveCounts,
  onObjectiveCount,
  onComplete,
}: {
  task: SnapshotTask
  trader: SnapshotTrader | undefined
  items: Record<string, SnapshotItem>
  unlocks: number
  objectiveCounts: Record<string, number>
  onObjectiveCount: (objectiveId: string, count: number) => void
  onComplete: (completion: TaskCompletion) => void
}) {
  const done = task.objectives.filter(
    (objective) => (objectiveCounts[objective.id] ?? 0) >= objective.count
  ).length
  const total = task.objectives.length
  const ready = total > 0 && done === total
  const started = done > 0

  const keys = task.neededKeys.flatMap((entry) => entry.keys)

  return (
    <li
      className={cn(
        "flex flex-col border",
        ready ? "border-primary/60 bg-primary/5" : "border-terminal-rule"
      )}
    >
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
            <h3
              className={cn(
                "min-w-0 flex-1 font-sans text-sm font-bold tracking-[0.06em] uppercase",
                ready ? "text-primary crt-glow" : "text-primary crt-glow-soft"
              )}
            >
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

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.65rem] text-terminal-ink-dim">
            <span className="flex items-center gap-1.5">
              <GameImage
                src={trader?.imageLink ?? null}
                alt=""
                fit="cover"
                className="size-5"
              />
              {trader?.name ?? task.trader}
            </span>
            {task.minPlayerLevel > 0 ? (
              <span className="tabular-nums">level {task.minPlayerLevel}</span>
            ) : null}
            <span className="tabular-nums">
              {task.experience.toLocaleString("en-GB")} XP
            </span>
            {unlocks > 0 ? <span>leads to {unlocks}</span> : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {task.maps.length === 0 ? (
              <Tag
                tone="quiet"
                title="Nothing about this task is tied to a map"
              >
                any map
              </Tag>
            ) : null}
            {task.kappaRequired ? <Tag>kappa</Tag> : null}
            {task.lightkeeperRequired ? <Tag>lightkeeper</Tag> : null}
            {task.storylineGated ? (
              <Tag
                tone="quiet"
                title="The game holds this behind a storyline variable it does not publish"
              >
                storyline
              </Tag>
            ) : null}
            {keys.length ? (
              <span className="flex items-center gap-1 font-mono text-[0.65rem] text-terminal-chrome">
                keys:
                {keys.slice(0, 3).map((id) => (
                  <GameImage
                    key={id}
                    src={items[id]?.iconLink ?? null}
                    alt={items[id]?.name ?? id}
                    className="size-5"
                  />
                ))}
                {keys.length > 3 ? (
                  <span className="tabular-nums">+{keys.length - 3}</span>
                ) : null}
              </span>
            ) : null}
          </div>

          {total > 0 ? (
            <div className="flex items-center gap-2">
              <ObjectiveTape done={done} total={total} />
              <span className="font-mono text-[0.65rem] text-terminal-ink-dim tabular-nums">
                {done} / {total} objectives
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <ul className="flex flex-col px-3">
        {task.objectives.map((objective) => {
          const count = objectiveCounts[objective.id] ?? 0
          const settled = count >= objective.count
          const single = objective.count <= 1

          return (
            <li
              key={objective.id}
              className={cn(
                listRowWrapping,
                settled && "opacity-60"
              )}
            >
              {single ? (
                <div className="flex w-full items-center gap-2">
                  <Checkbox
                    aria-label={objective.description}
                    isSelected={settled}
                    onChange={(next) =>
                      onObjectiveCount(objective.id, next ? 1 : 0)
                    }
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      onObjectiveCount(objective.id, settled ? 0 : 1)
                    }
                    className={cn(
                      "min-w-0 flex-1 cursor-pointer text-left font-mono text-xs",
                      settled
                        ? "text-terminal-chrome-dim line-through"
                        : "text-foreground"
                    )}
                  >
                    {objective.description}
                  </button>
                  <ObjectiveItems
                    ids={objective.items}
                    foundInRaid={objective.foundInRaid}
                    items={items}
                  />
                </div>
              ) : (
                <>
                  <span
                    className={cn(
                      "min-w-0 flex-1 font-mono text-xs",
                      settled
                        ? "text-terminal-chrome-dim line-through"
                        : "text-foreground"
                    )}
                  >
                    {objective.description}
                  </span>
                  <ObjectiveItems
                    ids={objective.items}
                    foundInRaid={objective.foundInRaid}
                    items={items}
                  />
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

      {/* One action, plus an escape hatch. Two equally weighted keys asked
          the reader to choose between finishing and failing every time. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3">
        <KeyButton active={ready} onClick={() => onComplete("complete")}>
          {ready ? "hand in" : "mark complete"}
        </KeyButton>
        {ready ? (
          <span className="font-mono text-[0.65rem] text-primary">
            every objective ticked
          </span>
        ) : started ? (
          <span className="font-mono text-[0.65rem] text-terminal-ink-dim tabular-nums">
            {total - done} to go
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onComplete("failed")}
          className="ml-auto font-mono text-[0.65rem] text-terminal-chrome-dim underline decoration-dotted underline-offset-2 hover:text-destructive"
        >
          mark failed
        </button>
      </div>
    </li>
  )
}
