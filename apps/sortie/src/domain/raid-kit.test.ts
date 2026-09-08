import { describe, expect, it } from "vitest"

import { makeObjective, makeTask } from "./fixtures"
import { buildRaidKit } from "./raid-kit"

describe("buildRaidKit", () => {
  it("collects the keys the map's tasks need", () => {
    const tasks = [
      makeTask({
        id: "one",
        neededKeys: [{ map: "customs", keys: ["dorm-203"] }],
      }),
      makeTask({
        id: "two",
        neededKeys: [{ map: "customs", keys: ["dorm-203", "dorm-214"] }],
      }),
    ]

    const kit = buildRaidKit(tasks, "customs")

    expect(kit.keys).toEqual([
      { itemId: "dorm-203", taskIds: ["one", "two"] },
      { itemId: "dorm-214", taskIds: ["two"] },
    ])
  })

  it("leaves out keys needed on another map", () => {
    const tasks = [
      makeTask({ neededKeys: [{ map: "woods", keys: ["woods-key"] }] }),
    ]

    expect(buildRaidKit(tasks, "customs").keys).toEqual([])
  })

  it("keeps a key whose entry names no map", () => {
    const tasks = [makeTask({ neededKeys: [{ map: null, keys: ["any-key"] }] })]

    expect(buildRaidKit(tasks, "customs").keys).toEqual([
      { itemId: "any-key", taskIds: ["task-1"] },
    ])
  })

  it("lists items that have to be found in raid", () => {
    const tasks = [
      makeTask({
        id: "one",
        name: "Task One",
        objectives: [
          makeObjective({
            id: "objective-a",
            type: "giveItem",
            count: 3,
            items: ["bottle"],
            foundInRaid: true,
          }),
        ],
      }),
    ]

    expect(buildRaidKit(tasks, "customs").findInRaid).toEqual([
      {
        itemId: "bottle",
        count: 3,
        taskId: "one",
        taskName: "Task One",
        objectiveId: "objective-a",
      },
    ])
  })

  it("does not list a hand-over that need not be found in raid", () => {
    const tasks = [
      makeTask({
        objectives: [
          makeObjective({
            type: "giveItem",
            items: ["cash"],
            foundInRaid: false,
          }),
        ],
      }),
    ]

    expect(buildRaidKit(tasks, "customs").findInRaid).toEqual([])
  })

  it("lists items to bring and plant", () => {
    const tasks = [
      makeTask({
        id: "one",
        name: "Task One",
        objectives: [
          makeObjective({
            id: "objective-b",
            type: "plantItem",
            count: 2,
            items: ["camera"],
          }),
        ],
      }),
    ]

    expect(buildRaidKit(tasks, "customs").bringAndPlant).toEqual([
      {
        itemId: "camera",
        count: 2,
        taskId: "one",
        taskName: "Task One",
        objectiveId: "objective-b",
      },
    ])
  })

  it("skips an objective that names no item", () => {
    const tasks = [
      makeTask({
        objectives: [makeObjective({ type: "plantItem", items: [] })],
      }),
    ]

    expect(buildRaidKit(tasks, "customs").bringAndPlant).toEqual([])
  })
})
