// Fetches the tarkov.dev JSON dumps, keeps what the two sortie screens read,
// and writes the result into the app. The output is committed: a build must
// not depend on a third party being up, and the GraphQL API this replaces
// sends no Access-Control-Allow-Origin header, so the browser cannot call it
// at all.
//
//   node scripts/build-tarkov-snapshot.mjs           regenerate
//   node scripts/build-tarkov-snapshot.mjs --check   fail if out of date

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const BASE_URL = "https://json.tarkov.dev"
const GAME_MODE = "regular"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const outDir = path.join(root, "apps/sortie/src/data/snapshot")
const checkOnly = process.argv.includes("--check")

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "sortie-snapshot (+https://sektant.dev)" },
  })
  if (!response.ok) throw new Error(`${url} responded ${response.status}`)
  return response.json()
}

/** The dumps hand back either an array or an object keyed by id. */
function toArray(value) {
  if (Array.isArray(value)) return value
  if (value && typeof value === "object") return Object.values(value)
  return []
}

// Names arrive as opaque translation keys — "54cb50c76803fa8b248b4571
// Nickname" — resolved against {endpoint}_en, one flat { key: string } map.
// Only the fields this script extracts are translated: the dictionary also
// holds generic keys like MOD_PISTOL_GRIP, so walking the whole tree would
// rewrite unrelated strings.
async function fetchEndpoint(endpoint) {
  const [payload, dictionary] = await Promise.all([
    fetchJson(`${BASE_URL}/${GAME_MODE}/${endpoint}`),
    fetchJson(`${BASE_URL}/${GAME_MODE}/${endpoint}_en`),
  ])
  if (!payload || payload.data == null) {
    throw new Error(`${endpoint}: response has no data`)
  }
  const dict = dictionary?.data ?? {}
  const translate = (value) =>
    typeof value === "string" ? (dict[value] ?? value) : value
  return { data: payload.data, translate }
}

function readId(value) {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && typeof value.id === "string") {
    return value.id
  }
  return null
}

const { data: rawTasks, translate: tTasks } = await fetchEndpoint("tasks")
const { data: rawMaps, translate: tMaps } = await fetchEndpoint("maps")
const { data: rawTraders, translate: tTraders } = await fetchEndpoint("traders")
const { data: rawHideout, translate: tHideout } = await fetchEndpoint("hideout")

/** Every item id the kept data points at. The items dump is filtered to it. */
const referencedItems = new Set()

// Quest items — the briefcase, the letter, the marked key — are their own
// collection, not part of the items dump, and objectives point at them
// through `questItem` rather than `items`. They are folded into the same map
// the app resolves every icon through.
const questItems = {}
for (const item of toArray(rawTasks.questItems)) {
  questItems[item.id] = {
    id: item.id,
    name: tTasks(item.name),
    shortName: tTasks(item.shortName),
    iconLink: item.iconLink ?? null,
  }
}

const tasks = toArray(rawTasks.tasks).map((task) => {
  const objectives = toArray(task.objectives).map((objective) => {
    const items = toArray(objective.items).filter(
      (id) => typeof id === "string"
    )
    for (const id of items) referencedItems.add(id)
    // A quest item counts as this objective's item: the reader wants to see
    // the thing they are looking for, whichever collection it lives in.
    if (typeof objective.questItem === "string") {
      items.push(objective.questItem)
    }

    return {
      id: objective.id,
      type: objective.type,
      description: tTasks(objective.description) ?? "",
      count: typeof objective.count === "number" ? objective.count : 1,
      optional: objective.optional === true,
      maps: toArray(objective.maps).filter((id) => typeof id === "string"),
      items,
      // A quest item is by definition found in the raid it spawns in.
      foundInRaid:
        objective.foundInRaid === true ||
        objective.type === "findQuestItem",
    }
  })

  const neededKeys = toArray(task.neededKeys).map((entry) => {
    const keys = toArray(entry.keys).filter((id) => typeof id === "string")
    for (const id of keys) referencedItems.add(id)
    return { map: typeof entry.map === "string" ? entry.map : null, keys }
  })

  // The dump names the task's own map when it has one — this is the game's
  // answer, and it wins outright. Without it, a task belongs to a map when
  // something about it actually happens there.
  // "Eliminate Scavs on any of eleven maps" is not a task about Icebreaker,
  // and counting it as one put a dozen chores on every map's list; an
  // objective naming more than two maps is a chore you can do anywhere, so it
  // ties the task to none of them. Zones and keys are locations by
  // definition and always tie.
  const LOCALISING_LIMIT = 2
  const maps = new Set()
  const ownMap = readId(task.map)
  if (ownMap) {
    maps.add(ownMap)
  } else {
    for (const objective of toArray(task.objectives)) {
      const named = toArray(objective.maps).filter(
        (id) => typeof id === "string"
      )
      if (named.length <= LOCALISING_LIMIT) for (const id of named) maps.add(id)
      for (const zone of toArray(objective.zones)) {
        if (typeof zone?.map === "string") maps.add(zone.map)
      }
    }
    for (const entry of neededKeys) if (entry.map) maps.add(entry.map)
  }

  return {
    id: task.id,
    name: tTasks(task.name),
    normalizedName: task.normalizedName,
    trader: readId(task.trader),
    maps: [...maps],
    factionName: task.factionName ?? "Any",
    minPlayerLevel: task.minPlayerLevel ?? 0,
    kappaRequired: task.kappaRequired === true,
    lightkeeperRequired: task.lightkeeperRequired === true,
    experience: task.experience ?? 0,
    wikiLink: task.wikiLink ?? null,
    imageLink: task.taskImageLink ?? null,
    // The game moved many prerequisites out of taskRequirements and into
    // global variables whose value it does not publish; 164 tasks carry one.
    // The gate is real and knowable, only its state is not, so the app shows
    // these apart rather than pretending they are open.
    storylineGated: toArray(task.otherRequirements).some(
      (requirement) => requirement?.type === "globalVariable"
    ),
    taskRequirements: toArray(task.taskRequirements)
      .map((requirement) => ({
        task: readId(requirement.task),
        status: toArray(requirement.status).filter(
          (status) => typeof status === "string"
        ),
      }))
      .filter((requirement) => requirement.task !== null),
    traderRequirements: toArray(task.traderRequirements)
      .filter((requirement) => requirement.requirementType === "level")
      .map((requirement) => ({
        trader: readId(requirement.trader),
        level: requirement.value ?? 1,
      }))
      .filter((requirement) => requirement.trader !== null),
    neededKeys,
    objectives,
  }
})

// The dump has lost many prerequisites — "The Punisher - Part 1" and
// "Search Mission" arrive with none at all, and the GraphQL API that still
// carries them is unreachable from a browser and was down while this was
// written. What survives in every case is the name: a task called "X - Part
// 4" plainly follows "X - Part 3". That inference is recorded separately
// from the game's own taskRequirements so it is never mistaken for them.
const SERIES = /^(.*?)\s*[-–]\s*Part\s+(\d+)$/i
const byName = new Map(tasks.map((task) => [task.name, task]))
for (const task of tasks) {
  const match = SERIES.exec(task.name)
  task.seriesPredecessor = null
  if (!match) continue
  const [, stem, part] = match
  const previous = Number(part) - 1
  if (previous < 1) continue
  const earlier =
    byName.get(`${stem} - Part ${previous}`) ??
    byName.get(`${stem} – Part ${previous}`)
  if (earlier && earlier.id !== task.id) task.seriesPredecessor = earlier.id
}

// A map names its bosses by mob id; the names and portraits live in a
// sibling collection.
const mobs = new Map(
  toArray(rawMaps.mobs).map((mob) => [
    mob.id,
    { name: tMaps(mob.name), portrait: mob.imagePortraitLink ?? null },
  ])
)

const maps = toArray(rawMaps.maps).map((map) => ({
  id: map.id,
  name: tMaps(map.name),
  normalizedName: map.normalizedName,
  extracts: toArray(map.extracts).map((extract) => {
    if (extract.transferItem?.item) {
      referencedItems.add(extract.transferItem.item)
    }
    return {
      name: tMaps(extract.name),
      faction: extract.faction ?? "pmc",
      transferItem: extract.transferItem
        ? {
            item: extract.transferItem.item,
            count: extract.transferItem.count ?? 1,
          }
        : null,
    }
  }),
  bosses: toArray(map.bosses).map((boss) => ({
    name: mobs.get(boss.mob)?.name ?? boss.mob,
    portrait: mobs.get(boss.mob)?.portrait ?? null,
    spawnChance: boss.spawnChance ?? 0,
  })),
}))

const traders = toArray(rawTraders).map((trader) => ({
  id: trader.id,
  name: tTraders(trader.name),
  normalizedName: trader.normalizedName,
  imageLink: trader.imageLink ?? null,
  resetTime: trader.resetTime ?? null,
  levels: toArray(trader.levels).map((level) => ({
    level: level.level,
    requiredPlayerLevel: level.requiredPlayerLevel ?? 0,
    requiredReputation: level.requiredReputation ?? 0,
  })),
}))

const hideout = toArray(rawHideout).map((station) => ({
  id: station.id,
  name: tHideout(station.name),
  normalizedName: station.normalizedName,
  levels: toArray(station.levels).map((level) => ({
    level: level.level,
    itemRequirements: toArray(level.itemRequirements)
      .map((requirement) => {
        const item = readId(requirement.item)
        if (item) referencedItems.add(item)
        return { item, count: requirement.count ?? 1 }
      })
      .filter((requirement) => requirement.item !== null),
  })),
}))

// Last, because it is filtered by what everything above referenced. The full
// dump is ~16 MB; shipping it would be most of the app's weight.
const { data: rawItems, translate: tItems } = await fetchEndpoint("items")
const items = { ...questItems }
for (const item of toArray(rawItems.items)) {
  if (!referencedItems.has(item.id)) continue
  items[item.id] = {
    id: item.id,
    name: tItems(item.name),
    shortName: tItems(item.shortName),
    iconLink: item.iconLink ?? null,
  }
}

const meta = {
  generatedAt: new Date().toISOString(),
  gameMode: GAME_MODE,
  source: BASE_URL,
  counts: {
    tasks: tasks.length,
    maps: maps.length,
    traders: traders.length,
    hideout: hideout.length,
    items: Object.keys(items).length,
  },
}

// Floors, not exact counts: the game gains tasks. A number under one of these
// means the upstream shape moved, which must fail loudly rather than ship an
// empty screen.
const FLOORS = { tasks: 400, maps: 8, traders: 6, hideout: 20, items: 500 }
for (const [key, floor] of Object.entries(FLOORS)) {
  if (meta.counts[key] < floor) {
    throw new Error(
      `snapshot: ${key} came back with ${meta.counts[key]}, expected at least ${floor}`
    )
  }
}
if (tasks.some((task) => !task.name || task.name.includes(task.id))) {
  throw new Error(
    "snapshot: task names did not resolve — the translation dictionary moved"
  )
}
if (tasks.some((task) => task.trader === null)) {
  throw new Error("snapshot: a task came back without a trader")
}

const files = { tasks, maps, traders, hideout, items, meta }

if (checkOnly) {
  // meta is skipped: generatedAt changes on every run.
  for (const [name, value] of Object.entries(files)) {
    if (name === "meta") continue
    const file = path.join(outDir, `${name}.json`)
    const current = JSON.parse(await fs.readFile(file, "utf8"))
    if (JSON.stringify(current) !== JSON.stringify(value)) {
      console.error(`snapshot: ${name}.json is out of date — run \`make snapshot\``)
      process.exit(1)
    }
  }
  console.log("snapshot: up to date")
} else {
  await fs.mkdir(outDir, { recursive: true })
  for (const [name, value] of Object.entries(files)) {
    await fs.writeFile(
      path.join(outDir, `${name}.json`),
      JSON.stringify(value) + "\n"
    )
  }
  console.log("snapshot:", JSON.stringify(meta.counts))
}
