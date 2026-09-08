export type Faction = "USEC" | "BEAR"
export type GameMode = "regular" | "pve"
export type TaskStatus = "locked" | "available" | "complete" | "failed"
export type TaskCompletion = "complete" | "failed"

/** An objective, reduced to what the two screens read. */
export type SnapshotObjective = {
  id: string
  type: string
  description: string
  count: number
  optional: boolean
  /** Map ids this objective happens on. Empty means anywhere. */
  maps: string[]
  /** Item ids the objective involves. */
  items: string[]
  foundInRaid: boolean
}

export type SnapshotTask = {
  id: string
  name: string
  normalizedName: string
  /** Trader id. */
  trader: string
  /** Union of every map any part of this task points at. Empty means global. */
  maps: string[]
  factionName: "Any" | Faction
  minPlayerLevel: number
  kappaRequired: boolean
  lightkeeperRequired: boolean
  experience: number
  wikiLink: string | null
  taskRequirements: { task: string; status: string[] }[]
  traderRequirements: { trader: string; level: number }[]
  /** Keys the task needs, grouped by the map they are used on. */
  neededKeys: { map: string | null; keys: string[] }[]
  objectives: SnapshotObjective[]
}

export type SnapshotExtract = {
  name: string
  faction: string
  /** An extract that costs an item to use — a car extract, say. */
  transferItem: { item: string; count: number } | null
}

export type SnapshotMap = {
  id: string
  name: string
  normalizedName: string
  extracts: SnapshotExtract[]
  bosses: { name: string; spawnChance: number }[]
}

export type SnapshotTrader = {
  id: string
  name: string
  normalizedName: string
  imageLink: string | null
  resetTime: string | null
  levels: {
    level: number
    requiredPlayerLevel: number
    requiredReputation: number
  }[]
}

export type SnapshotHideoutStation = {
  id: string
  name: string
  normalizedName: string
  levels: {
    level: number
    itemRequirements: { item: string; count: number }[]
  }[]
}

export type SnapshotItem = {
  id: string
  name: string
  shortName: string
  iconLink: string | null
}

export type SnapshotMeta = {
  generatedAt: string
  gameMode: GameMode
  source: string
  counts: Record<string, number>
}

export type Snapshot = {
  meta: SnapshotMeta
  tasks: SnapshotTask[]
  maps: SnapshotMap[]
  traders: SnapshotTrader[]
  hideout: SnapshotHideoutStation[]
  /** Keyed by item id — every list resolves names through this. */
  items: Record<string, SnapshotItem>
}
