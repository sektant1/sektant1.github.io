import { describe, expect, it } from "vitest"
import {
  applyGearPenalty,
  calibrationResult,
  cmPer360,
  horizontalFromVertical,
  roundDisplay,
  sensitivityForCm360,
  verticalFromHorizontal,
} from "../src/math/aim.ts"

describe("aim conversion", () => {
  it("matches CS2 regression value", () =>
    expect(cmPer360(800, 1.1, 0.022)).toBeCloseTo(47.2314, 4))
  it("round trips source through target", () => {
    const cm = cmPer360(800, 1.1, 0.022)
    const target = sensitivityForCm360(800, 0.07, cm)
    expect(
      sensitivityForCm360(800, 0.022, cmPer360(800, target, 0.07))
    ).toBeCloseTo(1.1, 12)
  })
  it("round trips FOV", () => {
    const horizontal = horizontalFromVertical(85, 16 / 9)
    expect(verticalFromHorizontal(horizontal, 16 / 9)).toBeCloseTo(85, 12)
  })
  it.each([
    [0, 40],
    [5, 40 / 0.95],
    [10, 40 / 0.9],
  ])("applies %s percent gear penalty", (penalty, expected) =>
    expect(applyGearPenalty(40, penalty).effectiveCm).toBeCloseTo(expected, 12)
  )
  it.each([
    [0, 1],
    [-1, 1],
    [800, 0],
  ])("rejects invalid dpi or sensitivity", (dpi, sensitivity) =>
    expect(() => cmPer360(dpi, sensitivity, 0.022)).toThrow()
  )
  it("handles an extreme valid aspect ratio", () =>
    expect(horizontalFromVertical(60, 32 / 9)).toBeGreaterThan(120))
  it("derives calibration average and yaw", () => {
    const result = calibrationResult(800, 1, [
      { id: "1", distance: 20, unit: "cm", rotation: 180 },
      { id: "2", distance: 15.7480315, unit: "in", rotation: 360 },
    ])
    expect(result.averageCm).toBeCloseTo(40, 6)
    expect(result.inferredYaw).toBeCloseTo(0.028575, 6)
  })
  it("rounds only requested display precision", () =>
    expect(roundDisplay(47.235, 2)).toBe(47.24))
  it("rejects invalid FOV and aspect ratio", () => {
    expect(() => horizontalFromVertical(180, 16 / 9)).toThrow()
    expect(() => horizontalFromVertical(85, 0)).toThrow()
  })
  it("rejects invalid gear penalties", () =>
    expect(() => applyGearPenalty(40, 100)).toThrow())
  it("rejects unknown yaw constants", () =>
    expect(() => sensitivityForCm360(800, Number.NaN, 40)).toThrow())
})
