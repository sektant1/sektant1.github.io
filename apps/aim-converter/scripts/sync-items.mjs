import { writeFile } from "node:fs/promises"

const source = "https://json.tarkov.dev/regular/items"
const translations = `${source}_en`
const responses = await Promise.all(
  [source, translations].map(async (url) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url}: ${response.status}`)
    return response.json()
  })
)
const [payload, dictionary] = responses
const translate = (value) => dictionary.data[value] ?? value
const equipment = Object.values(payload.data.items)
  .flatMap((item) => {
    const p = item.properties ?? {}
    const types = item.types ?? []
    let kind
    if (types.includes("armorPlate") && p.class >= 4) kind = "plate"
    else if (p.propertiesType === "ItemPropertiesHelmet" && p.class >= 4)
      kind = "helmet"
    else if (p.propertiesType === "ItemPropertiesArmor" && p.class >= 4)
      kind = "armor"
    else if (
      p.propertiesType === "ItemPropertiesChestRig" &&
      (p.class >= 4 || (!p.class && p.capacity >= 16))
    )
      kind = "rig"
    else if (p.propertiesType === "ItemPropertiesBackpack" && p.capacity >= 20)
      kind = "backpack"
    else if (
      p.propertiesType === "ItemPropertiesArmorAttachment" &&
      !types.includes("armorPlate") &&
      p.class >= 4
    )
      kind = "attachment"
    if (!kind) return []
    return [
      {
        id: item.id,
        name: translate(item.name),
        shortName: translate(item.shortName),
        kind,
        imageLink: item.image512pxLink ?? item.iconLink,
        iconLink: item.iconLink,
        armorClass: p.class ?? null,
        capacity: p.capacity ?? null,
        weight: item.weight ?? null,
        speedPenalty: p.speedPenalty ?? null,
        turnPenalty: p.turnPenalty ?? null,
        ergoPenalty: p.ergoPenalty ?? null,
        plateSlots: (p.armorSlots ?? [])
          .filter((slot) => slot.allowedPlates?.length)
          .map((slot) => ({
            name: slot.nameId,
            allowedPlates: slot.allowedPlates,
          })),
      },
    ]
  })
  .sort((a, b) => a.name.localeCompare(b.name))
const items = Object.values(payload.data.items)
  .filter((item) =>
    ["ItemPropertiesWeapon", "ItemPropertiesScope"].includes(
      item.properties?.propertiesType
    )
  )
  .map((item) => ({
    id: item.id,
    name: translate(item.name),
    shortName: translate(item.shortName),
    kind:
      item.properties.propertiesType === "ItemPropertiesWeapon"
        ? "weapon"
        : "optic",
    iconLink: item.iconLink,
    imageLink: item.image512pxLink ?? item.iconLink,
    zoomLevels: [...new Set((item.properties.zoomLevels ?? []).flat())].sort(
      (a, b) => a - b
    ),
    link: item.link,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))
if (!items.some((item) => item.id === "618ba27d9008e4636a67f61d")) {
  throw new Error("Razor HD Gen.2 missing from snapshot")
}
await writeFile(
  new URL("../src/data/tarkov-items.json", import.meta.url),
  JSON.stringify(
    {
      source,
      translations,
      retrieved: new Date().toISOString().slice(0, 10),
      items,
      equipment,
    },
    null,
    2
  ) + "\n"
)
console.log(
  `Saved ${items.length} weapons/optics and ${equipment.length} equipment items from ${source}`
)
