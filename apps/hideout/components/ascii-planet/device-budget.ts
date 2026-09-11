import { renderBudgetFor } from "./policy"

/**
 * The render budget for the device this runs on.
 *
 * The rules live in policy, free of the DOM so they can be tested; this is the
 * one place that reads the navigator for them, shared by both renderers.
 */
export function readRenderBudget() {
  const device = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  return renderBudgetFor({
    devicePixelRatio: window.devicePixelRatio,
    hardwareConcurrency: device.hardwareConcurrency,
    deviceMemory: device.deviceMemory,
    saveData: device.connection?.saveData,
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  })
}
