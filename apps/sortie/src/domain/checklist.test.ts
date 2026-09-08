import { describe, expect, it } from "vitest"

import { buildChecklist } from "./checklist"
import type { SnapshotItem, SnapshotMap } from "./types"

const items: Record<string, SnapshotItem> = {
  roubles: {
    id: "roubles",
    name: "Roubles",
    shortName: "RUB",
    iconLink: "https://assets.tarkov.dev/roubles-icon.webp",
  },
}

const customs: SnapshotMap = {
  id: "customs",
  name: "Customs",
  normalizedName: "customs",
  extracts: [
    { name: "ZB-1011", faction: "pmc", transferItem: null },
    {
      name: "Dorms V-Ex",
      faction: "pmc",
      transferItem: { item: "roubles", count: 20000 },
    },
  ],
  bosses: [],
}

describe("buildChecklist", () => {
  it("always opens with the fixed entries", () => {
    const entries = buildChecklist(customs, items)

    expect(entries.slice(0, 4).map((entry) => entry.id)).toEqual([
      "med-kit",
      "food-water",
      "ammo-mags",
      "repair",
    ])
    expect(entries[0].detail).toBe(
      "heavy and light bleed, splint, meds, painkiller"
    )
  })

  it("derives an entry from an extract that costs an item", () => {
    const entries = buildChecklist(customs, items)
    const derived = entries.find((entry) => entry.id === "transfer-dorms-v-ex")

    expect(derived).toEqual({
      id: "transfer-dorms-v-ex",
      label: "bring 20000 × Roubles",
      detail: "Dorms V-Ex",
      icon: "https://assets.tarkov.dev/roubles-icon.webp",
      derived: true,
    })
  })

  it("carries no icon for a fixed entry", () => {
    expect(buildChecklist(customs, items)[0].icon).toBeNull()
  })

  it("derives nothing from a free extract", () => {
    const entries = buildChecklist(customs, items)

    expect(entries.some((entry) => entry.detail === "ZB-1011")).toBe(false)
  })

  it("falls back to the item id when the snapshot lacks the item", () => {
    const map: SnapshotMap = {
      ...customs,
      extracts: [
        {
          name: "Boat",
          faction: "pmc",
          transferItem: { item: "unknown-item", count: 1 },
        },
      ],
    }

    const entry = buildChecklist(map, items).find((entry) => entry.derived)

    expect(entry?.label).toBe("bring 1 × unknown-item")
  })
})
