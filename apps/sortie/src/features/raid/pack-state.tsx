import { Panel } from "@/components/panel"
import { SegmentTape, type Segment } from "@/components/segment-tape"
import type { ChecklistEntry } from "@/domain/checklist"
import type { RaidKit } from "@/domain/raid-kit"
import type { SnapshotMap, SnapshotTask } from "@/domain/types"

/**
 * The one reading the planner exists to give: is this bag packed for this
 * map, and if not, what is missing. Everything below it is the detail behind
 * one of these five rows.
 */
export function PackState({
  map,
  entries,
  ticked,
  kit,
  tasks,
  anywhereTasks,
  objectiveCounts,
}: {
  map: SnapshotMap
  entries: ChecklistEntry[]
  ticked: string[]
  kit: RaidKit
  tasks: SnapshotTask[]
  anywhereTasks: SnapshotTask[]
  objectiveCounts: Record<string, number>
}) {
  const counted = (rows: { objectiveId: string; count: number }[]) =>
    rows.filter((row) => (objectiveCounts[row.objectiveId] ?? 0) >= row.count)
      .length

  const segments: Segment[] = [
    {
      id: "checklist",
      label: "checklist",
      done: entries.filter((entry) => ticked.includes(entry.id)).length,
      total: entries.length,
    },
    {
      id: "keys",
      label: "keys to carry",
      done: 0,
      total: kit.keys.length,
      mode: "count",
    },
    {
      id: "find",
      label: "find in raid",
      done: counted(kit.findInRaid),
      total: kit.findInRaid.length,
    },
    {
      id: "plant",
      label: "bring to plant",
      done: counted(kit.bringAndPlant),
      total: kit.bringAndPlant.length,
    },
  ]

  const checklist = segments[0]
  const packed = checklist.total > 0 && checklist.done >= checklist.total

  return (
    <Panel
      title={`Sortie · ${map.name}`}
      tone="lead"
      controls={
        <span
          className={
            packed
              ? "font-mono text-[0.7rem] tracking-[0.16em] text-primary uppercase crt-glow-soft"
              : "font-mono text-[0.7rem] tracking-[0.16em] text-terminal-chrome uppercase"
          }
        >
          {packed ? "packed" : "packing"}
        </span>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <p className="flex shrink-0 items-baseline gap-2">
          <span className="font-sans text-4xl leading-none font-bold text-primary tabular-nums crt-glow">
            {tasks.length}
          </span>
          <span className="font-mono text-[0.65rem] tracking-[0.14em] text-terminal-ink-dim uppercase">
            on this map
            {anywhereTasks.length ? (
              <>
                <br />
                <span className="tabular-nums">
                  +{anywhereTasks.length}
                </span>{" "}
                anywhere
              </>
            ) : null}
          </span>
        </p>
        <SegmentTape segments={segments} className="min-w-0 flex-1" />
      </div>
    </Panel>
  )
}
