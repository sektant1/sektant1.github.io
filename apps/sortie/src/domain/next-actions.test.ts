import { describe, expect, it } from "vitest"

import { makeTask } from "./fixtures"
import { buildNextActions } from "./next-actions"

const statuses = {
  gate: "available",
  small: "available",
  kappa: "available",
  done: "complete",
  locked: "locked",
} as const

const tasks = [
  makeTask({ id: "gate", name: "Gate" }),
  makeTask({ id: "small", name: "Small" }),
  makeTask({ id: "kappa", name: "Kappa one", kappaRequired: true }),
  makeTask({ id: "done", name: "Done" }),
  makeTask({ id: "locked", name: "Locked" }),
  // Four tasks wait on Gate, one on Kappa one.
  makeTask({
    id: "a",
    taskRequirements: [{ task: "gate", status: ["complete"] }],
  }),
  makeTask({
    id: "b",
    taskRequirements: [{ task: "gate", status: ["complete"] }],
  }),
  makeTask({
    id: "c",
    taskRequirements: [{ task: "gate", status: ["complete"] }],
  }),
  makeTask({
    id: "d",
    taskRequirements: [{ task: "gate", status: ["complete"] }],
  }),
  makeTask({
    id: "e",
    taskRequirements: [{ task: "kappa", status: ["complete"] }],
  }),
]

describe("buildNextActions", () => {
  it("ranks an available task by how much it unlocks", () => {
    const actions = buildNextActions(tasks, statuses, 3)

    expect(actions[0]).toMatchObject({ id: "gate", unlocks: 4 })
  })

  it("breaks a tie towards kappa, which is the longer road", () => {
    const actions = buildNextActions(tasks, statuses, 3)

    expect(actions.map((action) => action.id)).toEqual([
      "gate",
      "kappa",
      "small",
    ])
  })

  it("offers only tasks that can be started now", () => {
    const actions = buildNextActions(tasks, statuses, 10)

    expect(actions.map((action) => action.id)).not.toContain("locked")
    expect(actions.map((action) => action.id)).not.toContain("done")
  })

  it("returns at most the limit asked for", () => {
    expect(buildNextActions(tasks, statuses, 2)).toHaveLength(2)
  })

  it("returns nothing when nothing is available", () => {
    expect(buildNextActions(tasks, { gate: "locked" }, 3)).toEqual([])
  })
})
