import type * as React from "react"

import { Counter } from "@/components/counter"
import { GameImage } from "@/components/game-image"
import { Panel } from "@/components/panel"
import type { KitItem, RaidKit } from "@/domain/raid-kit"
import type { SnapshotItem } from "@/domain/types"
import { chip, listRowWrapping, sectionHeading } from "@/components/layout"
import { cn } from "@workspace/ui/lib/utils"

/**
 * An id that is not in the snapshot is shown as itself rather than dropped:
 * a stale snapshot should be visible, not silent.
 */
function itemName(items: Record<string, SnapshotItem>, id: string) {
  return items[id]?.name ?? id
}

/**
 * Collapsible because a busy map asks for fifty-odd found-in-raid items, and
 * a list that long between the checklist and the tasks is a wall. `details`
 * rather than state: it opens without JavaScript and the browser handles the
 * keyboard.
 */
function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <details open={count > 0} className="group flex flex-col gap-1.5">
      <summary
        className={cn(
          sectionHeading,
          "flex cursor-pointer list-none items-baseline gap-2 marker:content-none hover:text-primary"
        )}
      >
        <span aria-hidden="true" className="text-terminal-chrome-dim">
          <span className="group-open:hidden">[+]</span>
          <span className="hidden group-open:inline">[-]</span>
        </span>
        {title}
        <span className="text-terminal-chrome-dim tabular-nums">{count}</span>
      </summary>
      <div className="mt-1.5 max-h-96 overflow-y-auto pr-1">
        {count ? (
          children
        ) : (
          <p className="font-mono text-xs text-terminal-ink-dim">nothing</p>
        )}
      </div>
    </details>
  )
}

function ItemRow({
  row,
  items,
  count,
  onCount,
}: {
  row: KitItem
  items: Record<string, SnapshotItem>
  count: number
  onCount: (next: number) => void
}) {
  const name = itemName(items, row.itemId)
  const done = count >= row.count

  return (
    <li className={listRowWrapping}>
      <GameImage
        src={items[row.itemId]?.iconLink ?? null}
        alt=""
        className="size-9"
      />
      <span className="min-w-0 flex-1">
        <span
          className={
            done
              ? "font-mono text-xs text-terminal-chrome-dim line-through"
              : "font-mono text-xs text-foreground"
          }
        >
          {name}
        </span>
        <span className="block font-mono text-[0.65rem] text-terminal-ink-dim">
          {row.taskName}
        </span>
      </span>
      <Counter
        value={count}
        total={row.count}
        label={name}
        onChange={onCount}
      />
    </li>
  )
}

export function KitPanel({
  kit,
  items,
  objectiveCounts,
  onObjectiveCount,
}: {
  kit: RaidKit
  items: Record<string, SnapshotItem>
  objectiveCounts: Record<string, number>
  onObjectiveCount: (objectiveId: string, count: number) => void
}) {
  return (
    <Panel title="Raid kit">
      <div className="flex flex-col gap-4">
        <Section title="Keys to bring" count={kit.keys.length}>
          <ul className="flex flex-wrap gap-1.5">
            {kit.keys.map((key) => (
              <li
                key={key.itemId}
                className={chip}
                title={`needed by ${key.taskIds.length} task${
                  key.taskIds.length === 1 ? "" : "s"
                }`}
              >
                <GameImage
                  src={items[key.itemId]?.iconLink ?? null}
                  alt=""
                  className="size-8"
                />
                <span className="font-mono text-[0.7rem] text-foreground">
                  {itemName(items, key.itemId)}
                </span>
                {key.taskIds.length > 1 ? (
                  <span className="font-mono text-[0.7rem] text-terminal-chrome-dim tabular-nums">
                    ×{key.taskIds.length}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Find in raid" count={kit.findInRaid.length}>
          <ul className="flex flex-col">
            {kit.findInRaid.map((row) => (
              <ItemRow
                key={row.objectiveId}
                row={row}
                items={items}
                count={objectiveCounts[row.objectiveId] ?? 0}
                onCount={(next) => onObjectiveCount(row.objectiveId, next)}
              />
            ))}
          </ul>
        </Section>

        <Section title="Bring and plant" count={kit.bringAndPlant.length}>
          <ul className="flex flex-col">
            {kit.bringAndPlant.map((row) => (
              <ItemRow
                key={row.objectiveId}
                row={row}
                items={items}
                count={objectiveCounts[row.objectiveId] ?? 0}
                onCount={(next) => onObjectiveCount(row.objectiveId, next)}
              />
            ))}
          </ul>
        </Section>
      </div>
    </Panel>
  )
}
