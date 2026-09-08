/**
 * TaskSorter - Utility for sorting tasks by various criteria
 *
 * Extracts sorting logic from useTaskFiltering.ts for better testability
 * and reusability across the application.
 */
import { buildTaskImpactScores } from '@/utils/taskImpact';
import type { Task } from '@/types/tarkov';
import type { TaskSortDirection, TaskSortMode } from '@/types/taskSort';
/**
 * Impact score calculation data.
 * Used to calculate how many incomplete successor tasks each task has.
 */
export interface ImpactScoreData {
  /** Task completion status keyed by taskId -> teamId -> boolean */
  tasksCompletions: Record<string, Record<string, boolean>>;
  /** Task failure status keyed by taskId -> teamId -> boolean */
  tasksFailed: Record<string, Record<string, boolean>>;
  /**
   * Map keyed by team ID used only for membership/visibility checks.
   * Keys present mean the team member is visible. Values are intentionally typed
   * as unknown/opaque since only keys are inspected for determining team membership.
   * Expected key format: string team IDs (e.g., 'user123', 'team-abc').
   */
  visibleTeamStores?: Record<string, unknown>;
}
/**
 * Teammate availability data.
 * Used to calculate how many team members have a task available (unlocked but not complete/failed).
 */
export interface TeammateAvailabilityData {
  /** Task unlock status keyed by taskId -> teamId -> boolean. Required. */
  unlockedTasks: Record<string, Record<string, boolean>>;
  /** Task completion status keyed by taskId -> teamId -> boolean. Required. */
  tasksCompletions: Record<string, Record<string, boolean>>;
  /** Task failure status keyed by taskId -> teamId -> boolean. Required. */
  tasksFailed: Record<string, Record<string, boolean>>;
  /**
   * Map keyed by team ID used only for membership/visibility checks.
   * Keys present mean the team member is visible. Values are intentionally typed
   * as unknown/opaque since only keys are inspected for determining team membership.
   * Expected key format: string team IDs (e.g., 'user123', 'team-abc').
   * Optional - defaults to empty object if not provided.
   */
  visibleTeamStores?: Record<string, unknown>;
}
/**
 * Extract team IDs from visibleTeamStores.
 * Centralizes the derivation of team IDs used for impact/availability calculations.
 * @param data - Object containing visibleTeamStores property
 * @returns Array of team ID strings
 */
function getTeamIds(data: { visibleTeamStores?: Record<string, unknown> }): string[] {
  return Object.keys(data.visibleTeamStores || {});
}
/**
 * Build impact scores for tasks based on incomplete successor count.
 * Derives teamIds from data.visibleTeamStores for consistency with buildTeammateAvailableCounts.
 */
export function buildImpactScores(tasks: Task[], data: ImpactScoreData): Map<string, number> {
  const teamIds = getTeamIds(data);
  return buildTaskImpactScores(tasks, teamIds, data);
}
/**
 * Build teammate availability counts for tasks
 */
export function buildTeammateAvailableCounts(
  tasks: Task[],
  data: TeammateAvailabilityData
): Map<string, number> {
  const teamIds = getTeamIds(data);
  const counts = new Map<string, number>();
  if (!teamIds.length) {
    tasks.forEach((task) => counts.set(task.id, 0));
    return counts;
  }
  const { unlockedTasks, tasksCompletions, tasksFailed } = data;
  tasks.forEach((task) => {
    const availableCount = teamIds.filter((teamId) => {
      const isUnlocked = unlockedTasks?.[task.id]?.[teamId] === true;
      const isCompleted = tasksCompletions?.[task.id]?.[teamId] === true;
      const isFailed = tasksFailed?.[task.id]?.[teamId] === true;
      return isUnlocked && !isCompleted && !isFailed;
    }).length;
    counts.set(task.id, availableCount);
  });
  return counts;
}
/**
 * Build trader order map for sorting
 */
export function buildTraderOrderMap(
  traders: Array<{ id: string; normalizedName?: string; name: string }>,
  traderOrder: readonly string[]
): Map<string, number> {
  const orderMap = new Map<string, number>();
  traders.forEach((trader) => {
    const normalized = trader.normalizedName?.toLowerCase() ?? trader.name.toLowerCase();
    const index = traderOrder.indexOf(normalized as (typeof traderOrder)[number]);
    orderMap.set(trader.id, index === -1 ? traderOrder.length : index);
  });
  return orderMap;
}
/**
 * Get direction factor for sorting (-1 for desc, 1 for asc)
 */
function getDirectionFactor(direction: TaskSortDirection): number {
  return direction === 'desc' ? -1 : 1;
}
/**
 * Compare two strings for sorting
 */
function compareStrings(a: string, b: string, factor: number): number {
  return a.localeCompare(b) * factor;
}
/**
 * Compare two numbers for sorting
 */
function compareNumbers(a: number, b: number, factor: number): number {
  return (a - b) * factor;
}
/**
 * Sort tasks by impact score (number of incomplete successors)
 */
export function sortTasksByImpact(
  tasks: Task[],
  data: ImpactScoreData,
  direction: TaskSortDirection
): Task[] {
  const factor = getDirectionFactor(direction);
  const impactScores = buildImpactScores(tasks, data);
  return [...tasks].sort((a, b) => {
    const impactA = impactScores.get(a.id) ?? 0;
    const impactB = impactScores.get(b.id) ?? 0;
    if (impactA !== impactB) {
      return compareNumbers(impactA, impactB, factor);
    }
    const nameA = a.name?.toLowerCase() ?? '';
    const nameB = b.name?.toLowerCase() ?? '';
    return compareStrings(nameA, nameB, factor);
  });
}
/**
 * Sort tasks alphabetically by name
 */
export function sortTasksByName(tasks: Task[], direction: TaskSortDirection): Task[] {
  const factor = getDirectionFactor(direction);
  return [...tasks].sort((a, b) => {
    const nameA = a.name?.toLowerCase() ?? '';
    const nameB = b.name?.toLowerCase() ?? '';
    if (nameA !== nameB) {
      return compareStrings(nameA, nameB, factor);
    }
    return compareStrings(a.id, b.id, factor);
  });
}
/**
 * Sort tasks by minimum player level requirement
 */
export function sortTasksByLevel(tasks: Task[], direction: TaskSortDirection): Task[] {
  const factor = getDirectionFactor(direction);
  return [...tasks].sort((a, b) => {
    const levelA = a.minPlayerLevel ?? 0;
    const levelB = b.minPlayerLevel ?? 0;
    if (levelA !== levelB) {
      return compareNumbers(levelA, levelB, factor);
    }
    const nameA = a.name?.toLowerCase() ?? '';
    const nameB = b.name?.toLowerCase() ?? '';
    return compareStrings(nameA, nameB, factor);
  });
}
/**
 * Sort tasks by trader (using trader order), then level, then name
 */
export function sortTasksByTrader(
  tasks: Task[],
  traderOrderMap: Map<string, number>,
  defaultOrder: number,
  direction: TaskSortDirection
): Task[] {
  const factor = getDirectionFactor(direction);
  return [...tasks].sort((a, b) => {
    const traderA = a.trader?.id ? (traderOrderMap.get(a.trader.id) ?? defaultOrder) : defaultOrder;
    const traderB = b.trader?.id ? (traderOrderMap.get(b.trader.id) ?? defaultOrder) : defaultOrder;
    if (traderA !== traderB) {
      return compareNumbers(traderA, traderB, factor);
    }
    const levelA = a.minPlayerLevel ?? 0;
    const levelB = b.minPlayerLevel ?? 0;
    if (levelA !== levelB) {
      return compareNumbers(levelA, levelB, factor);
    }
    const nameA = a.name?.toLowerCase() ?? '';
    const nameB = b.name?.toLowerCase() ?? '';
    return compareStrings(nameA, nameB, factor);
  });
}
/**
 * Sort tasks by number of teammates who have the task available
 */
export function sortTasksByTeammatesAvailable(
  tasks: Task[],
  data: TeammateAvailabilityData,
  direction: TaskSortDirection
): Task[] {
  const factor = getDirectionFactor(direction);
  const counts = buildTeammateAvailableCounts(tasks, data);
  return [...tasks].sort((a, b) => {
    const countA = counts.get(a.id) ?? 0;
    const countB = counts.get(b.id) ?? 0;
    if (countA !== countB) {
      return compareNumbers(countA, countB, factor);
    }
    const nameA = a.name?.toLowerCase() ?? '';
    const nameB = b.name?.toLowerCase() ?? '';
    return compareStrings(nameA, nameB, factor);
  });
}
/**
 * Sort tasks by XP reward
 */
export function sortTasksByXp(tasks: Task[], direction: TaskSortDirection): Task[] {
  const factor = getDirectionFactor(direction);
  return [...tasks].sort((a, b) => {
    const xpA = a.experience ?? 0;
    const xpB = b.experience ?? 0;
    if (xpA !== xpB) {
      return compareNumbers(xpA, xpB, factor);
    }
    const nameA = a.name?.toLowerCase() ?? '';
    const nameB = b.name?.toLowerCase() ?? '';
    return compareStrings(nameA, nameB, factor);
  });
}
/**
 * Configuration for the sortTasks function
 */
export interface SortTasksConfig {
  progressData: ImpactScoreData & TeammateAvailabilityData;
  traderOrderMap: Map<string, number>;
  defaultTraderOrder: number;
}
/**
 * Sort tasks by the specified mode and direction.
 * Main entry point for task sorting.
 *
 * The 'none' mode preserves the original input order (optionally reversed based on direction).
 * Use 'none' when you want to maintain the natural order of tasks without any sorting logic.
 */
export function sortTasks(
  tasks: Task[],
  mode: TaskSortMode,
  direction: TaskSortDirection,
  config: SortTasksConfig
): Task[] {
  switch (mode) {
    case 'alphabetical':
      return sortTasksByName(tasks, direction);
    case 'level':
      return sortTasksByLevel(tasks, direction);
    case 'impact':
      return sortTasksByImpact(tasks, config.progressData, direction);
    case 'trader':
      return sortTasksByTrader(tasks, config.traderOrderMap, config.defaultTraderOrder, direction);
    case 'teammates':
      return sortTasksByTeammatesAvailable(tasks, config.progressData, direction);
    case 'xp':
      return sortTasksByXp(tasks, direction);
    case 'none':
    default:
      return direction === 'desc' ? [...tasks].reverse() : [...tasks];
  }
}
