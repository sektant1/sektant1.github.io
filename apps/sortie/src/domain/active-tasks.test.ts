import { describe, expect, it } from "vitest"

import {
  frontOfEachLine,
  mapTaskCounts,
  partitionActiveTasks,
  tasksForMap,
} from "./active-tasks"
import { makeTask } from "./fixtures"

const tasks = [
  makeTask({ id: "customs-one", maps: ["customs"] }),
  makeTask({ id: "customs-two", maps: ["customs"] }),
  makeTask({ id: "woods-one", maps: ["woods"] }),
  makeTask({ id: "both", maps: ["customs", "woods"] }),
  makeTask({ id: "anywhere", maps: [] }),
  makeTask({ id: "done", maps: ["customs"] }),
]

const statuses = {
  "customs-one": "available",
  "customs-two": "available",
  "woods-one": "available",
  both: "available",
  anywhere: "available",
  done: "complete",
} as const

describe("partitionActiveTasks", () => {
  it("groups available tasks by every map they touch", () => {
    const active = partitionActiveTasks(tasks, statuses)

    expect(active.byMap.customs.map((task) => task.id)).toEqual([
      "customs-one",
      "customs-two",
      "both",
    ])
    expect(active.byMap.woods.map((task) => task.id)).toEqual([
      "woods-one",
      "both",
    ])
  })

  it("keeps a task with no map in the global list", () => {
    const active = partitionActiveTasks(tasks, statuses)

    expect(active.global.map((task) => task.id)).toEqual(["anywhere"])
  })

  it("leaves out tasks that are not available", () => {
    const active = partitionActiveTasks(tasks, statuses)

    expect(active.byMap.customs.map((task) => task.id)).not.toContain("done")
  })
})

describe("tasksForMap", () => {
  it("appends the global tasks when asked to", () => {
    const active = partitionActiveTasks(tasks, statuses)

    expect(tasksForMap(active, "customs", true).map((task) => task.id)).toEqual(
      ["customs-one", "customs-two", "both", "anywhere"]
    )
  })

  it("leaves the global tasks out when not", () => {
    const active = partitionActiveTasks(tasks, statuses)

    expect(tasksForMap(active, "customs", false)).toHaveLength(3)
  })

  it("returns an empty list for a map with nothing on it", () => {
    const active = partitionActiveTasks(tasks, statuses)

    expect(tasksForMap(active, "labyrinth", false)).toEqual([])
  })
})

describe("gated tasks", () => {
  it("keeps gated tasks out of the available lists", () => {
    const pool = [
      makeTask({ id: "open", maps: ["customs"] }),
      makeTask({ id: "held", maps: ["customs"], storylineGated: true }),
    ]

    const active = partitionActiveTasks(pool, {
      open: "available",
      held: "gated",
    })

    expect(active.byMap.customs.map((task) => task.id)).toEqual(["open"])
    expect(active.gatedByMap.customs.map((task) => task.id)).toEqual(["held"])
  })

  it("adds them back when the caller asks for them", () => {
    const pool = [
      makeTask({ id: "open", maps: ["customs"] }),
      makeTask({ id: "held", maps: ["customs"], storylineGated: true }),
    ]
    const active = partitionActiveTasks(pool, {
      open: "available",
      held: "gated",
    })

    expect(
      tasksForMap(active, "customs", false, true).map((task) => task.id)
    ).toEqual(["open", "held"])
  })
})

describe("mapTaskCounts", () => {
  it("counts the available tasks on each map", () => {
    expect(mapTaskCounts(partitionActiveTasks(tasks, statuses))).toEqual({
      customs: 3,
      woods: 2,
    })
  })
})

describe("tasks that name most of the map list", () => {
  it("treats a task spanning six maps as doable anywhere", () => {
    const pool = [
      makeTask({
        id: "roam",
        maps: ["a", "b", "c", "d", "e", "f"],
      }),
    ]

    const active = partitionActiveTasks(pool, { roam: "available" })

    expect(active.global.map((task) => task.id)).toEqual(["roam"])
    expect(active.byMap.a).toBeUndefined()
  })

  it("still ties a task on five maps to each of them", () => {
    const pool = [makeTask({ id: "five", maps: ["a", "b", "c", "d", "e"] })]

    const active = partitionActiveTasks(pool, { five: "available" })

    expect(active.global).toEqual([])
    expect(active.byMap.a.map((task) => task.id)).toEqual(["five"])
  })
})

describe("frontOfEachLine", () => {
  it("keeps the lowest-level task per trader", () => {
    const pool = [
      makeTask({ id: "late", trader: "prapor", minPlayerLevel: 15 }),
      makeTask({ id: "first", trader: "prapor", minPlayerLevel: 1 }),
      makeTask({ id: "therapist", trader: "therapist", minPlayerLevel: 8 }),
    ]

    expect(
      frontOfEachLine(pool)
        .map((task) => task.id)
        .sort()
    ).toEqual(["first", "therapist"])
  })

  it("breaks a level tie by name, so the order never wobbles", () => {
    const pool = [
      makeTask({ id: "b", name: "Beta", trader: "prapor" }),
      makeTask({ id: "a", name: "Alpha", trader: "prapor" }),
    ]

    expect(frontOfEachLine(pool)).toHaveLength(1)
    expect(frontOfEachLine(pool)[0].id).toBe("a")
  })
})
