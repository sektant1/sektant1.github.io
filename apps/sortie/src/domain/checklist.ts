import type { SnapshotItem, SnapshotMap } from "./types"

export type ChecklistEntry = {
  id: string
  /** Lowercase Latin: the operator talking to themselves, not signage. */
  label: string
  detail: string | null
  /** The item's icon, when the entry names one. */
  icon: string | null
  /** True when the entry comes from this map rather than the fixed set. */
  derived: boolean
}

/**
 * The fixed entries stand for a kind of thing, not for one item, so each
 * borrows the icon of the item that reads as that kind. The ids are stable
 * game ids; an id the snapshot has dropped simply leaves the entry without a
 * picture, which is why the lookup is a fallback and not an assertion.
 */
const FIXED: {
  id: string
  label: string
  detail: string | null
  item: string
}[] = [
  {
    id: "med-kit",
    label: "full med kit",
    detail: "heavy and light bleed, splint, meds, painkiller",
    item: "544fb45d4bdc2dee738b4568", // Salewa first aid kit
  },
  {
    id: "food-water",
    label: "food and water",
    detail: null,
    item: "5448fee04bdc2dbc018b4567", // Bottle of water (0.6L)
  },
  {
    id: "ammo-mags",
    label: "refill ammo, mags and grenades",
    detail: null,
    item: "56dfef82d2720bbd668b4567", // 5.45x39mm BP gs
  },
  {
    id: "repair",
    label: "repair weapons and armour",
    detail: null,
    item: "5910968f86f77425cf569c32", // Weapon repair kit
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
      const item = items[transfer.item]
      return {
        id: `transfer-${slug(extract.name)}`,
        label: `bring ${transfer.count} × ${item?.name ?? transfer.item}`,
        detail: extract.name,
        icon: item?.iconLink ?? null,
        derived: true,
      }
    })

  const fixed = FIXED.map((entry) => ({
    id: entry.id,
    label: entry.label,
    detail: entry.detail,
    icon: items[entry.item]?.iconLink ?? null,
    derived: false,
  }))

  return [...fixed, ...derived]
}
