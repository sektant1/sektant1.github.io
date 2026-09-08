import type { SnapshotObjective, SnapshotTask } from "./types"

export function makeObjective(
  overrides: Partial<SnapshotObjective> = {}
): SnapshotObjective {
  return {
    id: "objective-1",
    type: "giveItem",
    description: "hand something over",
    count: 1,
    optional: false,
    maps: [],
    items: [],
    foundInRaid: false,
    ...overrides,
  }
}

export function makeTask(overrides: Partial<SnapshotTask> = {}): SnapshotTask {
  return {
    id: "task-1",
    name: "Task One",
    normalizedName: "task-one",
    trader: "trader-1",
    maps: [],
    factionName: "Any",
    minPlayerLevel: 0,
    kappaRequired: false,
    lightkeeperRequired: false,
    experience: 1000,
    wikiLink: null,
    imageLink: null,
    taskRequirements: [],
    traderRequirements: [],
    neededKeys: [],
    objectives: [],
    ...overrides,
  }
}
