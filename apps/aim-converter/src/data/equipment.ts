import snapshotText from "./tarkov-items.json?raw"

export type Equipment = {
  id: string
  name: string
  shortName: string
  kind: string
  imageLink: string
  iconLink: string
  armorClass: number | null
  capacity: number | null
  weight: number | null
  speedPenalty: number | null
  turnPenalty: number | null
  ergoPenalty: number | null
  plateSlots: { name: string; allowedPlates: string[] }[]
}

export const equipment = (
  JSON.parse(snapshotText) as { equipment: Equipment[] }
).equipment

export function selectedCarrier(value: Record<string, string>) {
  return (
    equipment.find(
      (item) => item.kind === "armor" && item.id === value.armor
    ) ??
    equipment.find(
      (item) =>
        item.kind === "rig" &&
        item.id === value.rig &&
        item.plateSlots.length > 0
    )
  )
}

export function compatiblePlates(slot: Equipment["plateSlots"][number]) {
  return equipment.filter(
    (item) => item.kind === "plate" && slot.allowedPlates.includes(item.id)
  )
}

export function changeEquipment(
  value: Record<string, string>,
  key: string,
  id: string
) {
  const next = { ...value, [key]: id }
  const chosen = equipment.find((item) => item.id === id)
  if (key === "rig" && chosen?.armorClass) next.armor = ""
  if (
    key === "armor" &&
    chosen &&
    equipment.find((item) => item.id === next.rig)?.armorClass
  )
    next.rig = ""
  const carrier = selectedCarrier(next)
  for (const storedKey of Object.keys(next)) {
    if (!storedKey.startsWith("plate:")) continue
    const slot = carrier?.plateSlots.find(
      (slot) => storedKey === `plate:${slot.name}`
    )
    if (
      !slot ||
      !compatiblePlates(slot).some((item) => item.id === next[storedKey])
    )
      delete next[storedKey]
  }
  return next
}
