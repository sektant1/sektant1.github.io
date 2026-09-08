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

  it("merges the find and the hand-over halves of one requirement", () => {
    // The dump splits "find 3 Salewa and hand them in" into a findItem and a
    // giveItem objective, both found-in-raid. One row, not two.
    const tasks = [
      makeTask({
        id: "shortage",
        name: "Shortage",
        objectives: [
          makeObjective({
            id: "find",
            type: "findItem",
            count: 3,
            items: ["salewa"],
            foundInRaid: true,
          }),
          makeObjective({
            id: "give",
            type: "giveItem",
            count: 3,
            items: ["salewa"],
            foundInRaid: true,
          }),
        ],
      }),
    ]

    const rows = buildRaidKit(tasks, "customs").findInRaid

    expect(rows).toHaveLength(1)
    // The hand-over is the objective worth counting: it is the one that
    // completes.
    expect(rows[0].objectiveId).toBe("give")
  })

  it("keeps two rows when one task wants the same item twice over", () => {
    const tasks = [
      makeTask({
        objectives: [
          makeObjective({
            id: "first",
            type: "giveItem",
            count: 2,
            items: ["bolt"],
            foundInRaid: true,
          }),
          makeObjective({
            id: "second",
            type: "giveItem",
            count: 5,
            items: ["bolt"],
            foundInRaid: true,
          }),
        ],
      }),
    ]

    expect(buildRaidKit(tasks, "customs").findInRaid).toHaveLength(2)
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
