import type {
  Snapshot,
  SnapshotHideoutStation,
  SnapshotItem,
  SnapshotMap,
  SnapshotMeta,
  SnapshotTask,
  SnapshotTrader,
} from "@/domain/types"

import hideout from "./hideout.json"
import items from "./items.json"
import maps from "./maps.json"
import meta from "./meta.json"
import tasks from "./tasks.json"
import traders from "./traders.json"

/**
 * The one place the generated JSON becomes typed. The files come from
 * `scripts/build-tarkov-snapshot.mjs`, and the assertions here are the
 * contract that script's own validation defends — editing the JSON by hand
 * breaks both ends of it.
 */
export const snapshot: Snapshot = {
  meta: meta as SnapshotMeta,
  tasks: tasks as SnapshotTask[],
  maps: maps as SnapshotMap[],
  traders: traders as SnapshotTrader[],
  hideout: hideout as SnapshotHideoutStation[],
  items: items as Record<string, SnapshotItem>,
}

/** The day the snapshot was built. */
export function snapshotDate() {
  return snapshot.meta.generatedAt.slice(0, 10)
}
