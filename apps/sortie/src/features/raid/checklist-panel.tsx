import { Checkbox } from "@workspace/ui/components/checkbox"

import { GameImage } from "@/components/game-image"
import { KeyButton } from "@/components/key-button"
import { listRow, readoutDim, sectionHeading, stack } from "@/components/layout"
import { Panel } from "@/components/panel"
import type { ChecklistEntry } from "@/domain/checklist"
import type { SnapshotMap } from "@/domain/types"

function Row({
  entry,
  isTicked,
  onToggle,
}: {
  entry: ChecklistEntry
  isTicked: boolean
  onToggle: () => void
}) {
  return (
    <li className={listRow}>
      <Checkbox
        aria-label={entry.label}
        isSelected={isTicked}
        onChange={onToggle}
      />
      {entry.icon ? (
        <GameImage src={entry.icon} alt="" className="size-8" />
      ) : null}
      <button
        type="button"
        onClick={onToggle}
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
}

/**
 * Two groups, because they are two different kinds of thing: what you do
 * before every raid, and what this map in particular costs. Mixed together,
 * the map-specific entries — the ones actually easy to forget — read as more
 * of the same routine.
 */
export function ChecklistPanel({
  map,
  entries,
  ticked,
  note,
  onToggle,
  onSetAll,
  onNoteChange,
}: {
  map: SnapshotMap
  entries: ChecklistEntry[]
  ticked: string[]
  note: string
  onToggle: (entryId: string) => void
  onSetAll: (entryIds: string[], ticked: boolean) => void
  onNoteChange: (note: string) => void
}) {
  const always = entries.filter((entry) => !entry.derived)
  const thisMap = entries.filter((entry) => entry.derived)
  const done = entries.filter((entry) => ticked.includes(entry.id)).length
  const allTicked = entries.length > 0 && done === entries.length

  return (
    <div className={stack}>
      <Panel
        title="Pre-raid checklist"
        controls={
          <>
            <span className={`${readoutDim} self-center pr-1`}>
              {done} / {entries.length}
            </span>
            <KeyButton
              className="min-h-8 md:min-h-0"
              onClick={() =>
                onSetAll(
                  entries.map((entry) => entry.id),
                  !allTicked
                )
              }
            >
              {allTicked ? "clear" : "tick all"}
            </KeyButton>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <h3 className={sectionHeading}>every raid</h3>
            <ul className="flex flex-col">
              {always.map((entry) => (
                <Row
                  key={entry.id}
                  entry={entry}
                  isTicked={ticked.includes(entry.id)}
                  onToggle={() => onToggle(entry.id)}
                />
              ))}
            </ul>
          </div>

          {thisMap.length ? (
            <div>
              <h3 className={sectionHeading}>{map.name} only</h3>
              <ul className="flex flex-col">
                {thisMap.map((entry) => (
                  <Row
                    key={entry.id}
                    entry={entry}
                    isTicked={ticked.includes(entry.id)}
                    onToggle={() => onToggle(entry.id)}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel title="Notes" tone="quiet">
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder={`what to remember on ${map.name}…`}
          rows={4}
          className="w-full resize-y bg-transparent font-mono text-xs text-foreground placeholder:text-terminal-chrome-dim focus-visible:outline-none"
        />
      </Panel>
    </div>
  )
}
