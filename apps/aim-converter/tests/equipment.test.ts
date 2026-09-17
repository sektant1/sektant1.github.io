import { describe, expect, it } from "vitest"
import {
  changeEquipment,
  compatiblePlates,
  equipment,
} from "../src/data/equipment.ts"

const carrier = equipment.find(
  (item) => item.kind === "rig" && item.plateSlots.length >= 2
)!
const slot = carrier.plateSlots[0]
const plate = compatiblePlates(slot)[0]

describe("carrier plates", () => {
  it("offers only allowed class 4+ plates for each carrier slot", () => {
    for (const item of equipment)
      for (const slot of item.plateSlots) {
        for (const plate of compatiblePlates(slot)) {
          expect(slot.allowedPlates).toContain(plate.id)
          expect(plate.kind).toBe("plate")
          expect(plate.armorClass).toBeGreaterThanOrEqual(4)
        }
      }
  })
  it("keeps fitted plates when changing an unrelated unarmored rig", () => {
    const armor = equipment.find(
      (item) =>
        item.kind === "armor" &&
        item.plateSlots.some((slot) => compatiblePlates(slot).length)
    )!
    const armorSlot = armor.plateSlots.find(
      (slot) => compatiblePlates(slot).length
    )!
    const fitted = compatiblePlates(armorSlot)[0].id
    const rig = equipment.find(
      (item) => item.kind === "rig" && item.armorClass === null
    )!
    const result = changeEquipment(
      { armor: armor.id, [`plate:${armorSlot.name}`]: fitted },
      "rig",
      rig.id
    )
    expect(result[`plate:${armorSlot.name}`]).toBe(fitted)
  })
  it("clears plates when their carrier is removed", () => {
    const result = changeEquipment(
      { rig: carrier.id, [`plate:${slot.name}`]: plate.id },
      "rig",
      ""
    )
    expect(result[`plate:${slot.name}`]).toBeUndefined()
  })
  it("rejects incompatible plate IDs and nonexistent slots", () => {
    const result = changeEquipment(
      { rig: carrier.id, "plate:nonexistent": plate.id },
      `plate:${slot.name}`,
      carrier.id
    )
    expect(result[`plate:${slot.name}`]).toBeUndefined()
    expect(result["plate:nonexistent"]).toBeUndefined()
  })
  it("preserves independently chosen plates in different slots", () => {
    const otherSlot = carrier.plateSlots[1]
    const otherPlate = compatiblePlates(otherSlot)[0]
    const result = changeEquipment(
      { rig: carrier.id, [`plate:${slot.name}`]: plate.id },
      `plate:${otherSlot.name}`,
      otherPlate.id
    )
    expect(result[`plate:${slot.name}`]).toBe(plate.id)
    expect(result[`plate:${otherSlot.name}`]).toBe(otherPlate.id)
  })
})
