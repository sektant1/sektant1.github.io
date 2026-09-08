import { describe, expect, it } from "vitest"

import {
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

    expect(tasksForMap(active, "customs", true).map((task) => task.id)).toEqual([
      "customs-one",
      "customs-two",
      "both",
      "anywhere",
    ])
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

describe("mapTaskCounts", () => {
  it("counts the available tasks on each map", () => {
    expect(mapTaskCounts(partitionActiveTasks(tasks, statuses))).toEqual({
      customs: 3,
      woods: 2,
    })
  })
})
