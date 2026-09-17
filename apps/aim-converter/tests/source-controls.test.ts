import { describe, expect, it } from "vitest"
import { resolveSourceControls } from "../src/data/source-controls.ts"
import type { GameId } from "../src/types.ts"

const settings = {
  sourceId: "tarkov" as GameId,
  trainerScale: "cs2" as GameId,
  customYaw: 0.03,
  fov: 85,
  profileFovConvention: "vertical" as const,
  penalty: 10,
  mode: "ads" as const,
  sensitivity: 1.1,
  adsSensitivity: 0.246,
}

describe("source-specific inputs", () => {
  it("ignores hidden Tarkov ADS and gear for CS2", () => {
    const result = resolveSourceControls({ ...settings, sourceId: "cs2" })
    expect(result.sensitivity).toBe(1.1)
    expect(result.penalty).toBe(0)
    expect(result.fov).toBe(90)
    expect(result.mode).toBe("hipfire")
  })
  it("uses fixed Valorant FOV despite stale editable FOV", () => {
    expect(
      resolveSourceControls({ ...settings, sourceId: "valorant" }).fov
    ).toBe(103)
  })
  it("retains Tarkov ADS and gear", () => {
    const result = resolveSourceControls(settings)
    expect(result.sensitivity).toBe(0.246)
    expect(result.penalty).toBe(10)
  })
  it("uses selected trainer scale and explicit projection", () => {
    const result = resolveSourceControls({ ...settings, sourceId: "kovaaks" })
    expect(result.yaw).toBe(0.022)
    expect(result.fovConvention).toBe("vertical")
  })
  it("allows a measured custom trainer yaw without assigning Arena a constant", () => {
    expect(
      resolveSourceControls({
        ...settings,
        sourceId: "aimlab",
        trainerScale: "custom",
      }).yaw
    ).toBe(0.03)
    expect(
      resolveSourceControls({ ...settings, sourceId: "arena" }).yaw
    ).toBeNull()
  })
})
