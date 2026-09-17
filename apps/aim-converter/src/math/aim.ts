import type { CalibrationTrial, MatchMethod } from "../types.ts"

const assertPositive = (value: number, name: string) => {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${name} must be greater than zero`)
}

export function countsPer360(sensitivity: number, yaw: number) {
  assertPositive(sensitivity, "Sensitivity")
  assertPositive(yaw, "Yaw")
  return 360 / (sensitivity * yaw)
}

export function cmPer360(dpi: number, sensitivity: number, yaw: number) {
  assertPositive(dpi, "DPI")
  return (countsPer360(sensitivity, yaw) * 2.54) / dpi
}

export function sensitivityForCm360(
  dpi: number,
  yaw: number,
  desiredCm: number
) {
  assertPositive(dpi, "DPI")
  assertPositive(yaw, "Yaw")
  assertPositive(desiredCm, "Desired cm/360")
  return (360 * 2.54) / (dpi * yaw * desiredCm)
}

export function applyGearPenalty(baseCm: number, penaltyPercent: number) {
  assertPositive(baseCm, "Base cm/360")
  if (
    !Number.isFinite(penaltyPercent) ||
    penaltyPercent < 0 ||
    penaltyPercent >= 100
  ) {
    throw new RangeError(
      "Gear penalty must be from 0 up to, but not including, 100"
    )
  }
  const multiplier = 1 - penaltyPercent / 100
  return { multiplier, effectiveCm: baseCm / multiplier }
}

const radians = (degrees: number) => (degrees * Math.PI) / 180
const degrees = (value: number) => (value * 180) / Math.PI

export function horizontalFromVertical(vertical: number, aspect: number) {
  if (vertical <= 0 || vertical >= 180)
    throw new RangeError("Vertical FOV must be between 0 and 180")
  assertPositive(aspect, "Aspect ratio")
  return degrees(2 * Math.atan(Math.tan(radians(vertical) / 2) * aspect))
}

export function verticalFromHorizontal(horizontal: number, aspect: number) {
  if (horizontal <= 0 || horizontal >= 180)
    throw new RangeError("Horizontal FOV must be between 0 and 180")
  assertPositive(aspect, "Aspect ratio")
  return degrees(2 * Math.atan(Math.tan(radians(horizontal) / 2) / aspect))
}

function monitorRatio(
  sourceFov: number,
  targetFov: number,
  coefficient: number
) {
  if (coefficient === 0)
    return Math.tan(radians(targetFov) / 2) / Math.tan(radians(sourceFov) / 2)
  return (
    Math.atan(coefficient * Math.tan(radians(targetFov) / 2)) /
    Math.atan(coefficient * Math.tan(radians(sourceFov) / 2))
  )
}

export function matchingCm360(
  sourceCm: number,
  method: MatchMethod,
  sourceHorizontalFov: number,
  targetHorizontalFov: number,
  sourceVerticalFov: number,
  targetVerticalFov: number,
  customCoefficient: number
) {
  if (method === "physical" || method === "manual") return sourceCm
  const ratio =
    method === "mdv100"
      ? monitorRatio(sourceVerticalFov, targetVerticalFov, 1)
      : monitorRatio(
          sourceHorizontalFov,
          targetHorizontalFov,
          method === "md0" ? 0 : method === "custom" ? customCoefficient : 1
        )
  return sourceCm / ratio
}

export function calibrationResult(
  dpi: number,
  sensitivity: number,
  trials: CalibrationTrial[]
) {
  assertPositive(dpi, "DPI")
  assertPositive(sensitivity, "Sensitivity")
  if (trials.length === 0)
    throw new RangeError("At least one calibration trial is required")
  const cmValues = trials.map((trial) => {
    assertPositive(trial.distance, "Measured distance")
    assertPositive(trial.rotation, "Observed rotation")
    return (
      trial.distance * (trial.unit === "in" ? 2.54 : 1) * (360 / trial.rotation)
    )
  })
  const averageCm =
    cmValues.reduce((sum, value) => sum + value, 0) / cmValues.length
  return {
    averageCm,
    inferredYaw: (360 * 2.54) / (dpi * sensitivity * averageCm),
    cmValues,
  }
}

export function roundDisplay(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}
