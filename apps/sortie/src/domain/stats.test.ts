import { describe, expect, it } from "vitest"

import { makeObjective, makeTask } from "./fixtures"
import { buildStatCards, buildTraderStats } from "./stats"
import type { SnapshotHideoutStation, SnapshotTrader, TaskStatus } from "./types"

const tasks = [
  makeTask({
    id: "one",
    kappaRequired: true,
    objectives: [
      makeObjective({ id: "one-a", count: 2 }),
      makeObjective({ id: "one-b", count: 1 }),
    ],
  }),
  makeTask({ id: "two", lightkeeperRequired: true }),
  makeTask({ id: "three", trader: "trader-2" }),
]

const hideout: SnapshotHideoutStation[] = [
  {
    id: "station-1",
    name: "Workbench",
    normalizedName: "workbench",
    levels: [
      { level: 1, itemRequirements: [] },
      { level: 2, itemRequirements: [] },
      { level: 3, itemRequirements: [] },
    ],
  },
]

const statuses: Record<string, TaskStatus> = {
  one: "complete",
  two: "available",
  three: "available",
}

describe("buildStatCards", () => {
  it("counts completed tasks against the total", () => {
    const cards = buildStatCards({
      tasks,
      hideout,
      statuses,
      objectiveCounts: {},
      hideoutLevels: {},
    })

    expect(cards.find((card) => card.id === "tasks")).toEqual({
      id: "tasks",
      label: "TASKS",
      done: 1,
      total: 3,
    })
  })

  it("counts an objective done only once its count is reached", () => {
    const cards = buildStatCards({
      tasks,
      hideout,
      statuses,
      objectiveCounts: { "one-a": 1, "one-b": 1 },
      hideoutLevels: {},
    })

    expect(cards.find((card) => card.id === "objectives")).toEqual({
      id: "objectives",
      label: "OBJECTIVES",
      done: 1,
      total: 2,
    })
  })

  it("counts kappa and lightkeeper tasks separately", () => {
    const cards = buildStatCards({
      tasks,
      hideout,
      statuses,
      objectiveCounts: {},
      hideoutLevels: {},
    })

    expect(cards.find((card) => card.id === "kappa")).toEqual({
      id: "kappa",
      label: "KAPPA",
      done: 1,
      total: 1,
    })
    expect(cards.find((card) => card.id === "lightkeeper")).toEqual({
      id: "lightkeeper",
      label: "LIGHTKEEPER",
      done: 0,
      total: 1,
    })
  })

  it("counts built hideout levels against every level there is", () => {
    const cards = buildStatCards({
      tasks,
      hideout,
      statuses,
      objectiveCounts: {},
      hideoutLevels: { "station-1": 2 },
    })

    expect(cards.find((card) => card.id === "hideout")).toEqual({
      id: "hideout",
      label: "HIDEOUT",
      done: 2,
      total: 3,
    })
  })

  it("drops a card whose total is zero", () => {
    const cards = buildStatCards({
      tasks: [makeTask()],
      hideout: [],
      statuses: { "task-1": "available" },
      objectiveCounts: {},
      hideoutLevels: {},
    })

    expect(cards.map((card) => card.id)).toEqual(["tasks"])
  })
})

describe("buildTraderStats", () => {
  const traders: SnapshotTrader[] = [
    {
      id: "trader-1",
      name: "Prapor",
      normalizedName: "prapor",
      imageLink: null,
      resetTime: null,
      levels: [
        { level: 1, requiredPlayerLevel: 0, requiredReputation: 0 },
        { level: 2, requiredPlayerLevel: 6, requiredReputation: 0.7 },
      ],
    },
  ]

  it("reports task progress for the trader who gives them", () => {
    expect(
      buildTraderStats(traders, tasks, statuses, { "trader-1": 2 })
    ).toEqual([
      {
        id: "trader-1",
        name: "Prapor",
        imageLink: null,
        level: 2,
        done: 1,
        total: 2,
      },
    ])
  })

  it("defaults a trader with no recorded level to level one", () => {
    expect(buildTraderStats(traders, tasks, statuses, {})[0].level).toBe(1)
  })
})
