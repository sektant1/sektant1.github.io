import { describe, expect, it } from "vitest"

import { readImport } from "./index"

const UNRECOGNISED =
  "the file is not a sortie export, a TarkovTracker backup or a tarkov.dev profile"

describe("readImport", () => {
  it("rejects something that is not an object", () => {
    expect(readImport("nope")).toEqual({
      source: null,
      error: "the file does not contain an object",
    })
  })

  it("rejects an object it does not recognise", () => {
    expect(readImport({ hello: true })).toEqual({
      source: null,
      error: UNRECOGNISED,
    })
  })

  it("reads this app's own export", () => {
    const preview = readImport({
      _format: "sortie-progress",
      progress: { version: 1, level: 42 },
    })

    expect(preview.source).toBe("sortie")
    if (preview.source === null) throw new Error("expected a progress preview")
    expect(preview.progress.level).toBe(42)
  })

  it("reads a TarkovTracker backup's active game mode", () => {
    const preview = readImport({
      _format: "tarkovtracker-backup",
      _version: 2,
      currentGameMode: "pvp",
      gameEdition: 3,
      pvp: {
        level: 27,
        pmcFaction: "BEAR",
        taskCompletions: {
          "task-a": { complete: true },
          "task-b": { complete: false, failed: true },
          "task-c": { complete: false },
        },
        taskObjectives: { "objective-a": { complete: true, count: 4 } },
        traderLevels: { "trader-1": 3 },
      },
      pve: { level: 1 },
    })

    expect(preview.source).toBe("tarkovtracker")
    if (preview.source === null) throw new Error("expected a progress preview")
    expect(preview.progress.level).toBe(27)
    expect(preview.progress.faction).toBe("BEAR")
    expect(preview.progress.gameEdition).toBe(3)
    expect(preview.progress.taskCompletions).toEqual({
      "task-a": "complete",
      "task-b": "failed",
    })
    expect(preview.progress.objectiveCounts).toEqual({ "objective-a": 4 })
    expect(preview.progress.traderLevels).toEqual({ "trader-1": 3 })
    expect(preview.summary).toContain("1 task complete, 1 failed")
  })

  it("reads the pve side when the backup says so", () => {
    const preview = readImport({
      _format: "tarkovtracker-backup",
      _version: 2,
      currentGameMode: "pve",
      pvp: { level: 5 },
      pve: { level: 9, pmcFaction: "USEC" },
    })

    if (preview.source === null) throw new Error("expected a progress preview")
    expect(preview.progress.level).toBe(9)
    expect(preview.progress.gameMode).toBe("pve")
  })

  it("reads a tarkov.dev profile without inventing task state", () => {
    const preview = readImport({
      aid: 12345,
      info: {
        nickname: "operator",
        side: "Bear",
        experience: 0,
        memberCategory: 1024,
      },
      skills: { Common: [] },
    })

    expect(preview.source).toBe("tarkov.dev")
    if (preview.source === null) throw new Error("expected a progress preview")
    expect(preview.progress.faction).toBe("BEAR")
    expect(preview.progress.gameEdition).toBe(5)
    expect(preview.progress.taskCompletions).toEqual({})
    expect(preview.summary).toContain(
      "no task progress — a tarkov.dev profile carries none"
    )
  })

  it("rejects a profile missing the fields that identify it", () => {
    expect(readImport({ aid: 1, info: {} })).toEqual({
      source: null,
      error: UNRECOGNISED,
    })
  })
})
