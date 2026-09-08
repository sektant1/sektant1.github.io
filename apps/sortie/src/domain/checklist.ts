import type { SnapshotItem, SnapshotMap } from "./types"

export type ChecklistEntry = {
  id: string
  /** Lowercase Latin: the operator talking to themselves, not signage. */
  label: string
  detail: string | null
  /** True when the entry comes from this map rather than the fixed set. */
  derived: boolean
}

const FIXED: ChecklistEntry[] = [
  {
    id: "med-kit",
    label: "full med kit",
    detail: "heavy and light bleed, splint, meds, painkiller",
    derived: false,
  },
  { id: "food-water", label: "food and water", detail: null, derived: false },
  {
    id: "ammo-mags",
    label: "refill ammo, mags and grenades",
    detail: null,
    derived: false,
  },
  {
    id: "repair",
    label: "repair weapons and armour",
    detail: null,
    derived: false,
  },
]

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * The fixed entries plus what this map costs to leave. An extract carrying a
 * `transferItem` is a car extract or a paid boat, and forgetting the fare is
 * the mistake the list exists to prevent.
 */
export function buildChecklist(
  map: SnapshotMap,
  items: Record<string, SnapshotItem>
): ChecklistEntry[] {
  const derived = map.extracts
    .filter((extract) => extract.transferItem !== null)
    .map((extract) => {
      const transfer = extract.transferItem!
      const name = items[transfer.item]?.name ?? transfer.item
      return {
        id: `transfer-${slug(extract.name)}`,
        label: `bring ${transfer.count} × ${name}`,
        detail: extract.name,
        derived: true,
      }
    })

  return [...FIXED, ...derived]
}
