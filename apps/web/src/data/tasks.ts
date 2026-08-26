import type { Area } from "@/data/topics"

export type TaskState = "todo" | "doing" | "done"

export type Task = {
  id: string
  title: string
  state: TaskState
  area: Area
  /** ISO date. Absent means no deadline, which the board must render cleanly. */
  due?: string
  linkedTopic?: string
}

export const TASK_STATES: TaskState[] = ["todo", "doing", "done"]

export const STATE_LABEL: Record<TaskState, string> = {
  todo: "Queued",
  doing: "Active",
  done: "Complete",
}

export const seedTasks: Task[] = [
  {
    id: "t-01",
    title: "Finish the G-buffer packing exercise",
    state: "doing",
    area: "Rendering",
    due: "2026-08-20",
    linkedTopic: "deferred-shading",
  },
  {
    id: "t-02",
    title: "Re-read the rendering equation section on energy conservation",
    state: "todo",
    area: "Rendering",
    linkedTopic: "rendering-equation",
  },
  {
    id: "t-03",
    title:
      "Write the frame-rate independence test before touching the integrator",
    state: "done",
    area: "Physics",
    due: "2026-08-14",
    linkedTopic: "fixed-timestep",
  },
  {
    id: "t-04",
    title: "Port the 2D GJK to 3D",
    state: "todo",
    area: "Physics",
    due: "2026-09-02",
    linkedTopic: "gjk-collision",
  },
  {
    id: "t-05",
    title: "Benchmark sparse set against archetype for the tag-heavy case",
    state: "doing",
    area: "ECS",
    due: "2026-08-29",
    linkedTopic: "ecs-storage",
  },
  {
    id: "t-06",
    title: "Fix the sparse index repair bug in swap_remove",
    state: "todo",
    area: "ECS",
    due: "2026-08-18",
  },
  {
    id: "t-07",
    title:
      "Implement the command buffer so despawn stops invalidating iterators",
    state: "todo",
    area: "ECS",
  },
  {
    id: "t-08",
    title: "Get soft shadows working from a single extra march",
    state: "doing",
    area: "Shaders",
    linkedTopic: "signed-distance-fields",
  },
  {
    id: "t-09",
    title: "Verify the GGX term conserves energy numerically",
    state: "todo",
    area: "Shaders",
    due: "2026-09-10",
  },
  {
    id: "t-10",
    title: "Work out why smooth-min breaks the distance property",
    state: "done",
    area: "Shaders",
    linkedTopic: "signed-distance-fields",
  },
  {
    id: "t-11",
    title: "Build the lossy transport so packet loss is reproducible",
    state: "todo",
    area: "Netcode",
    due: "2026-08-25",
  },
  {
    id: "t-12",
    title:
      "Make the step function deterministic before attempting reconciliation",
    state: "doing",
    area: "Netcode",
    linkedTopic: "client-prediction",
  },
  {
    id: "t-13",
    title: "Smooth the reconciliation offset instead of snapping",
    state: "todo",
    area: "Netcode",
    linkedTopic: "client-prediction",
  },
  {
    id: "t-14",
    title: "Debounce the asset watcher — it rebuilds four times per save",
    state: "done",
    area: "Tooling",
    due: "2026-08-11",
    linkedTopic: "hot-reload-assets",
  },
  {
    id: "t-15",
    title: "Defer GPU resource destruction by frames in flight",
    state: "todo",
    area: "Tooling",
    due: "2026-08-22",
    linkedTopic: "hot-reload-assets",
  },
  {
    id: "t-16",
    title: "Add GPU timestamps around each render pass",
    state: "todo",
    area: "Tooling",
  },
  {
    id: "t-17",
    title: "Stabilise cascade texels so shadows stop shimmering",
    state: "todo",
    area: "Rendering",
    due: "2026-09-15",
  },
  {
    id: "t-18",
    title: "Write up the archetype fragmentation findings",
    state: "done",
    area: "ECS",
  },
]
