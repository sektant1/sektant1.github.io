import { Checkbox } from "@workspace/ui/components/checkbox"

import { GameImage } from "@/components/game-image"
import { Panel } from "@/components/panel"
import { buildChecklist } from "@/domain/checklist"
import type { SnapshotItem, SnapshotMap } from "@/domain/types"
import { listRow, readoutDim, stack } from "@/components/layout"

export function ChecklistPanel({
  map,
  items,
  ticked,
  note,
  onToggle,
  onNoteChange,
}: {
  map: SnapshotMap
  items: Record<string, SnapshotItem>
  ticked: string[]
  note: string
  onToggle: (entryId: string) => void
  onNoteChange: (note: string) => void
}) {
  const entries = buildChecklist(map, items)
  const done = entries.filter((entry) => ticked.includes(entry.id)).length

  return (
    <div className={stack}>
      <Panel
        title="СБОРЫ"
        srTitle="Pre-raid checklist"
        controls={
          <span className={readoutDim}>
            {done} / {entries.length}
          </span>
        }
      >
        <ul className="flex flex-col">
          {entries.map((entry) => {
            const isTicked = ticked.includes(entry.id)
            return (
              <li key={entry.id} className={listRow}>
                <Checkbox
                  aria-label={entry.label}
                  isSelected={isTicked}
                  onChange={() => onToggle(entry.id)}
                />
                {entry.icon ? (
                  <GameImage src={entry.icon} alt="" className="size-8" />
                ) : null}
                <button
                  type="button"
                  onClick={() => onToggle(entry.id)}
                  className="min-w-0 flex-1 cursor-pointer text-left"
                  tabIndex={-1}
                >
                  <span
                    className={
                      isTicked
                        ? "font-mono text-xs text-terminal-chrome-dim line-through"
                        : "font-mono text-xs text-foreground"
                    }
                  >
                    {entry.label}
                  </span>
                  {entry.detail ? (
                    <span className="block font-mono text-[0.65rem] text-terminal-ink-dim">
                      {entry.detail}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </Panel>

      <Panel title="ЗАМЕТКИ" srTitle="Notes">
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder={`notes for ${map.name}…`}
          rows={5}
          className="w-full resize-y bg-transparent font-mono text-xs text-foreground placeholder:text-terminal-chrome-dim focus-visible:outline-none"
        />
      </Panel>
    </div>
  )
}
