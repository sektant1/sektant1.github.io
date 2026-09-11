import * as React from "react"

import type { Faction, TaskCompletion } from "@/domain/types"
import { loadProgress, saveProgress, type Progress } from "./storage"

/**
 * A store rather than a context: the domain functions take the whole progress
 * object, and `useSyncExternalStore` hands every screen the same one without
 * a provider or a state library.
 */
function createProgressStore() {
  let current = loadProgress()
  const listeners = new Set<() => void>()

  function update(recipe: (progress: Progress) => Progress) {
    current = recipe(current)
    saveProgress(current)
    for (const listener of listeners) listener()
  }

  return {
    getSnapshot: () => current,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    update,
    replace: (progress: Progress) => update(() => progress),
  }
}

export const progressStore = createProgressStore()

export function useProgress(): Progress {
  return React.useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot
  )
}

function withEntry<T>(
  map: Record<string, T>,
  key: string,
  value: T | undefined
) {
  const next = { ...map }
  if (value === undefined) delete next[key]
  else next[key] = value
  return next
}

export function useProgressActions() {
  return React.useMemo(
    () => ({
      setLevel: (level: number) =>
        progressStore.update((progress) => ({ ...progress, level })),
      setFaction: (faction: Faction) =>
        progressStore.update((progress) => ({ ...progress, faction })),
      setFenceRep: (fenceRep: number) =>
        progressStore.update((progress) => ({ ...progress, fenceRep })),
      setTaskCompletion: (
        taskId: string,
        completion: TaskCompletion | undefined
      ) =>
        progressStore.update((progress) => ({
          ...progress,
          taskCompletions: withEntry(
            progress.taskCompletions,
            taskId,
            completion
          ),
        })),
      setObjectiveCount: (objectiveId: string, count: number) =>
        progressStore.update((progress) => ({
          ...progress,
          objectiveCounts: withEntry(
            progress.objectiveCounts,
            objectiveId,
            count <= 0 ? undefined : count
          ),
        })),
      setTraderLevel: (traderId: string, level: number) =>
        progressStore.update((progress) => ({
          ...progress,
          traderLevels: withEntry(progress.traderLevels, traderId, level),
        })),
      setTraderRep: (traderId: string, rep: number) =>
        progressStore.update((progress) => ({
          ...progress,
          traderRep: withEntry(progress.traderRep, traderId, rep),
        })),
      toggleChecklistEntry: (mapId: string, entryId: string) =>
        progressStore.update((progress) => {
          const ticked = progress.checklistTicks[mapId] ?? []
          const next = ticked.includes(entryId)
            ? ticked.filter((id) => id !== entryId)
            : [...ticked, entryId]
          return {
            ...progress,
            checklistTicks: withEntry(progress.checklistTicks, mapId, next),
          }
        }),
      setChecklistEntries: (
        mapId: string,
        entryIds: string[],
        ticked: boolean
      ) =>
        progressStore.update((progress) => {
          const current = progress.checklistTicks[mapId] ?? []
          const next = ticked
            ? [...new Set([...current, ...entryIds])]
            : current.filter((id) => !entryIds.includes(id))
          return {
            ...progress,
            checklistTicks: withEntry(
              progress.checklistTicks,
              mapId,
              next.length ? next : undefined
            ),
          }
        }),
      setNote: (mapId: string, note: string) =>
        progressStore.update((progress) => ({
          ...progress,
          notes: withEntry(
            progress.notes,
            mapId,
            note === "" ? undefined : note
          ),
        })),
      replaceAll: (progress: Progress) => progressStore.replace(progress),
    }),
    []
  )
}
