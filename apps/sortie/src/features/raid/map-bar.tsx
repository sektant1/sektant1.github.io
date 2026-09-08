import { KeyButton } from "@/components/key-button"
import type { SnapshotMap } from "@/domain/types"

/**
 * Every map, each carrying the number of tasks available on it. A map with
 * nothing on it still renders: zero is a real reading, and hiding it would
 * make the bar's contents depend on progress in a way the player cannot see.
 */
export function MapBar({
  maps,
  counts,
  selected,
  globalCount,
  includeGlobal,
  onSelect,
  onToggleGlobal,
}: {
  maps: SnapshotMap[]
  counts: Record<string, number>
  selected: SnapshotMap
  globalCount: number
  includeGlobal: boolean
  onSelect: (map: SnapshotMap) => void
  onToggleGlobal: () => void
}) {
  const ordered = [...maps].sort(
    (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
  )

  return (
    <div className="flex flex-wrap gap-1">
      {ordered.map((map) => (
        <KeyButton
          key={map.id}
          active={map.id === selected.id}
          onClick={() => onSelect(map)}
        >
          {map.name}
          <span className="tabular-nums opacity-70">{counts[map.id] ?? 0}</span>
        </KeyButton>
      ))}
      <KeyButton active={includeGlobal} onClick={onToggleGlobal}>
        Global
        <span className="tabular-nums opacity-70">{globalCount}</span>
      </KeyButton>
    </div>
  )
}
