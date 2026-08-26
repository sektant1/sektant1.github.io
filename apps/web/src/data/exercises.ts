import type { Area, Difficulty } from "@/data/topics"

export type Exercise = {
  id: string
  title: string
  area: Area
  difficulty: Difficulty
  languages: string[]
  estimateMinutes: number
  summary: string
}

export const LANGUAGES = [
  "C++",
  "Rust",
  "TypeScript",
  "GLSL",
  "WGSL",
  "C#",
] as const

export const exercises: Exercise[] = [
  {
    id: "ex-001",
    title: "Pack a G-buffer into three RGBA8 targets",
    area: "Rendering",
    difficulty: "deep",
    languages: ["GLSL", "C++"],
    estimateMinutes: 90,
    summary:
      "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do.",
  },
  {
    id: "ex-002",
    title: "Reconstruct world position from a depth buffer",
    area: "Rendering",
    difficulty: "working",
    languages: ["GLSL", "WGSL"],
    estimateMinutes: 35,
    summary:
      "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim.",
  },
  {
    id: "ex-003",
    title: "Implement a fixed timestep accumulator",
    area: "Physics",
    difficulty: "intro",
    languages: ["C++", "TypeScript"],
    estimateMinutes: 25,
    summary:
      "Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip.",
  },
  {
    id: "ex-004",
    title: "Prove your integrator is frame-rate independent",
    area: "Physics",
    difficulty: "working",
    languages: ["C++", "Rust"],
    estimateMinutes: 45,
    summary:
      "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate.",
  },
  {
    id: "ex-005",
    title: "Write support functions for sphere, capsule and hull",
    area: "Physics",
    difficulty: "working",
    languages: ["Rust", "C++"],
    estimateMinutes: 60,
    summary:
      "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud laboris. Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat.",
  },
  {
    id: "ex-006",
    title: "GJK in 2D before you attempt 3D",
    area: "Physics",
    difficulty: "deep",
    languages: ["TypeScript", "Rust"],
    estimateMinutes: 120,
    summary:
      "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea duis in. Officia anim laborum dolor consectetur sed tempor labore magna.",
  },
  {
    id: "ex-007",
    title: "Build a sparse set component store",
    area: "ECS",
    difficulty: "working",
    languages: ["C++", "Rust"],
    estimateMinutes: 70,
    summary:
      "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris.",
  },
  {
    id: "ex-008",
    title: "Move an entity between archetypes",
    area: "ECS",
    difficulty: "deep",
    languages: ["C++", "C#"],
    estimateMinutes: 110,
    summary:
      "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in.",
  },
  {
    id: "ex-009",
    title: "Query intersection across three component types",
    area: "ECS",
    difficulty: "working",
    languages: ["Rust", "C#"],
    estimateMinutes: 50,
    summary:
      "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur.",
  },
  {
    id: "ex-010",
    title: "Ray-march a sphere and a box with CSG",
    area: "Shaders",
    difficulty: "intro",
    languages: ["GLSL"],
    estimateMinutes: 40,
    summary:
      "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt.",
  },
  {
    id: "ex-011",
    title: "Derive SDF normals from the gradient",
    area: "Shaders",
    difficulty: "working",
    languages: ["GLSL", "WGSL"],
    estimateMinutes: 30,
    summary:
      "Minim nostrud laboris ex consequat irure voluptate cillum nulla. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet.",
  },
  {
    id: "ex-012",
    title: "Soft shadows from a single extra march",
    area: "Shaders",
    difficulty: "deep",
    languages: ["GLSL"],
    estimateMinutes: 55,
    summary:
      "Nisi ea duis in velit eu pariatur occaecat proident qui. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore.",
  },
  {
    id: "ex-013",
    title: "Implement a GGX specular term",
    area: "Shaders",
    difficulty: "deep",
    languages: ["GLSL", "WGSL"],
    estimateMinutes: 80,
    summary:
      "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud.",
  },
  {
    id: "ex-014",
    title: "Ring-buffer the last two seconds of input",
    area: "Netcode",
    difficulty: "intro",
    languages: ["TypeScript", "C#"],
    estimateMinutes: 30,
    summary:
      "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt. Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea duis.",
  },
  {
    id: "ex-015",
    title: "Reconcile a mispredicted position without snapping",
    area: "Netcode",
    difficulty: "deep",
    languages: ["TypeScript", "C#"],
    estimateMinutes: 100,
    summary:
      "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam. Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat.",
  },
  {
    id: "ex-016",
    title: "Interpolate remote entities between snapshots",
    area: "Netcode",
    difficulty: "working",
    languages: ["TypeScript", "C++"],
    estimateMinutes: 60,
    summary:
      "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa.",
  },
  {
    id: "ex-017",
    title: "Simulate packet loss and jitter in your transport",
    area: "Netcode",
    difficulty: "working",
    languages: ["Rust", "C++"],
    estimateMinutes: 65,
    summary:
      "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum.",
  },
  {
    id: "ex-018",
    title: "Debounce a filesystem watcher",
    area: "Tooling",
    difficulty: "intro",
    languages: ["Rust", "TypeScript"],
    estimateMinutes: 25,
    summary:
      "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor.",
  },
  {
    id: "ex-019",
    title: "Handle-based asset table with deferred destruction",
    area: "Tooling",
    difficulty: "working",
    languages: ["C++", "Rust"],
    estimateMinutes: 75,
    summary:
      "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim.",
  },
  {
    id: "ex-020",
    title: "Hot-reload a shader without dropping the frame",
    area: "Tooling",
    difficulty: "deep",
    languages: ["C++", "Rust"],
    estimateMinutes: 95,
    summary:
      "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do. Nisi ea duis in velit eu pariatur occaecat proident.",
  },
  {
    id: "ex-021",
    title: "Profile a frame and find the actual bottleneck",
    area: "Tooling",
    difficulty: "working",
    languages: ["C++"],
    estimateMinutes: 60,
    summary:
      "Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum.",
  },
  {
    id: "ex-022",
    title: "Cascaded shadow maps with stable texels",
    area: "Rendering",
    difficulty: "deep",
    languages: ["C++", "GLSL"],
    estimateMinutes: 130,
    summary:
      "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do.",
  },
]
