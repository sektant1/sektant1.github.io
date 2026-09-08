import { describe, expect, it } from "vitest"

import { makeTask } from "./fixtures"
import { buildTaskStatuses } from "./task-graph"

const context = {
  completions: {},
  level: 10,
  faction: "USEC" as const,
  traderLevels: {},
}

describe("buildTaskStatuses", () => {
  it("makes a task with no requirements available", () => {
    const statuses = buildTaskStatuses([makeTask()], context)

    expect(statuses["task-1"]).toBe("available")
  })

  it("reports what the player has already done", () => {
    const statuses = buildTaskStatuses([makeTask()], {
      ...context,
      completions: { "task-1": "complete" },
    })

    expect(statuses["task-1"]).toBe("complete")
  })

  it("locks a task whose prerequisite is not complete", () => {
    const tasks = [
      makeTask({ id: "first" }),
      makeTask({
        id: "second",
        taskRequirements: [{ task: "first", status: ["complete"] }],
      }),
    ]

    const statuses = buildTaskStatuses(tasks, context)

    expect(statuses.second).toBe("locked")
  })

  it("unlocks a task once its prerequisite is complete", () => {
    const tasks = [
      makeTask({ id: "first" }),
      makeTask({
        id: "second",
        taskRequirements: [{ task: "first", status: ["complete"] }],
      }),
    ]

    const statuses = buildTaskStatuses(tasks, {
      ...context,
      completions: { first: "complete" },
    })

    expect(statuses.second).toBe("available")
  })

  it("locks a task above the player's level", () => {
    const statuses = buildTaskStatuses(
      [makeTask({ minPlayerLevel: 20 })],
      context
    )

    expect(statuses["task-1"]).toBe("locked")
  })

  it("locks a task belonging to the other faction", () => {
    const statuses = buildTaskStatuses(
      [makeTask({ factionName: "BEAR" })],
      context
    )

    expect(statuses["task-1"]).toBe("locked")
  })

  it("locks a task behind a trader level the player has not reached", () => {
    const task = makeTask({
      traderRequirements: [{ trader: "trader-1", level: 3 }],
    })

    const statuses = buildTaskStatuses([task], {
      ...context,
      traderLevels: { "trader-1": 2 },
    })

    expect(statuses["task-1"]).toBe("locked")
  })

  it("treats a missing trader level as level one", () => {
    const task = makeTask({
      traderRequirements: [{ trader: "trader-1", level: 1 }],
    })

    const statuses = buildTaskStatuses([task], context)

    expect(statuses["task-1"]).toBe("available")
  })

  it("carries a failed task through as failed", () => {
    const statuses = buildTaskStatuses([makeTask()], {
      ...context,
      completions: { "task-1": "failed" },
    })

    expect(statuses["task-1"]).toBe("failed")
  })

  it("satisfies a requirement that asks for a failed prerequisite", () => {
    const tasks = [
      makeTask({ id: "first" }),
      makeTask({
        id: "second",
        taskRequirements: [{ task: "first", status: ["failed"] }],
      }),
    ]

    const statuses = buildTaskStatuses(tasks, {
      ...context,
      completions: { first: "failed" },
    })

    expect(statuses.second).toBe("available")
  })

  it("ignores a requirement pointing at a task the snapshot does not carry", () => {
    const task = makeTask({
      taskRequirements: [{ task: "missing", status: ["complete"] }],
    })

    const statuses = buildTaskStatuses([task], context)

    expect(statuses["task-1"]).toBe("locked")
  })
})
