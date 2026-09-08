import type { SnapshotTask } from "./types"

export type KitItem = {
  itemId: string
  count: number
  taskId: string
  taskName: string
  objectiveId: string
}

export type RaidKit = {
  /** One row per key, carrying every task that wants it. */
  keys: { itemId: string; taskIds: string[] }[]
  findInRaid: KitItem[]
  bringAndPlant: KitItem[]
}

/**
 * An objective can name several interchangeable items — "any of these
 * rifles". The first is enough to name the row: this is a reminder, not an
 * inventory.
 */
function firstItem(items: string[]): string | null {
  return items[0] ?? null
}

export function buildRaidKit(tasks: SnapshotTask[], mapId: string): RaidKit {
  const keys = new Map<string, string[]>()
  const findInRaid: KitItem[] = []
  const bringAndPlant: KitItem[] = []

  for (const task of tasks) {
    for (const entry of task.neededKeys) {
      // A null map means the key is not tied to a location.
      if (entry.map !== null && entry.map !== mapId) continue
      for (const itemId of entry.keys) {
        const taskIds = keys.get(itemId) ?? []
        if (!taskIds.includes(task.id)) taskIds.push(task.id)
        keys.set(itemId, taskIds)
      }
    }

    for (const objective of task.objectives) {
      const itemId = firstItem(objective.items)
      if (!itemId) continue
      const row = {
        itemId,
        count: objective.count,
        taskId: task.id,
        taskName: task.name,
        objectiveId: objective.id,
      }
      if (objective.type === "plantItem") bringAndPlant.push(row)
      else if (objective.foundInRaid) findInRaid.push(row)
    }
  }

  return {
    keys: [...keys.entries()].map(([itemId, taskIds]) => ({ itemId, taskIds })),
    findInRaid,
    bringAndPlant,
  }
}
