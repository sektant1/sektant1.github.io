import type {
  SnapshotHideoutStation,
  SnapshotTask,
  SnapshotTrader,
  TaskStatus,
} from "./types"

export type StatCard = {
  id: string
  /** Latin caps: this is an instrument readout. */
  label: string
  done: number
  total: number
}

export type StatsInput = {
  tasks: SnapshotTask[]
  hideout: SnapshotHideoutStation[]
  statuses: Record<string, TaskStatus>
  objectiveCounts: Record<string, number>
  hideoutLevels: Record<string, number>
}

function isComplete(statuses: Record<string, TaskStatus>, taskId: string) {
  return statuses[taskId] === "complete"
}

export function buildStatCards(input: StatsInput): StatCard[] {
  const { tasks, hideout, statuses, objectiveCounts, hideoutLevels } = input

  let objectivesDone = 0
  let objectivesTotal = 0
  for (const task of tasks) {
    for (const objective of task.objectives) {
      objectivesTotal += 1
      if ((objectiveCounts[objective.id] ?? 0) >= objective.count) {
        objectivesDone += 1
      }
    }
  }

  const kappa = tasks.filter((task) => task.kappaRequired)
  const lightkeeper = tasks.filter((task) => task.lightkeeperRequired)

  const hideoutTotal = hideout.reduce(
    (sum, station) => sum + station.levels.length,
    0
  )
  const hideoutDone = hideout.reduce(
    (sum, station) =>
      sum + Math.min(hideoutLevels[station.id] ?? 0, station.levels.length),
    0
  )

  const cards: StatCard[] = [
    {
      id: "tasks",
      label: "TASKS",
      done: tasks.filter((task) => isComplete(statuses, task.id)).length,
      total: tasks.length,
    },
    {
      id: "objectives",
      label: "OBJECTIVES",
      done: objectivesDone,
      total: objectivesTotal,
    },
    {
      id: "kappa",
      label: "KAPPA",
      done: kappa.filter((task) => isComplete(statuses, task.id)).length,
      total: kappa.length,
    },
    {
      id: "lightkeeper",
      label: "LIGHTKEEPER",
      done: lightkeeper.filter((task) => isComplete(statuses, task.id)).length,
      total: lightkeeper.length,
    },
    { id: "hideout", label: "HIDEOUT", done: hideoutDone, total: hideoutTotal },
  ]

  // A card with nothing behind it is decoration, and readouts are real.
  return cards.filter((card) => card.total > 0)
}

export type TraderStat = {
  id: string
  name: string
  imageLink: string | null
  level: number
  done: number
  total: number
}

export function buildTraderStats(
  traders: SnapshotTrader[],
  tasks: SnapshotTask[],
  statuses: Record<string, TaskStatus>,
  traderLevels: Record<string, number>
): TraderStat[] {
  return traders.map((trader) => {
    const theirs = tasks.filter((task) => task.trader === trader.id)
    return {
      id: trader.id,
      name: trader.name,
      imageLink: trader.imageLink,
      level: traderLevels[trader.id] ?? 1,
      done: theirs.filter((task) => isComplete(statuses, task.id)).length,
      total: theirs.length,
    }
  })
}
