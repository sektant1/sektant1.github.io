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
      "Fit albedo, octahedral normals, roughness, metalness and a shading model ID into 12 bytes per pixel. Reconstruct position from depth.",
  },
  {
    id: "ex-002",
    title: "Reconstruct world position from a depth buffer",
    area: "Rendering",
    difficulty: "working",
    languages: ["GLSL", "WGSL"],
    estimateMinutes: 35,
    summary:
      "Given depth and the inverse view-projection matrix, recover world position. Verify against a position target you then delete.",
  },
  {
    id: "ex-003",
    title: "Implement a fixed timestep accumulator",
    area: "Physics",
    difficulty: "intro",
    languages: ["C++", "TypeScript"],
    estimateMinutes: 25,
    summary:
      "Decouple simulation cadence from frame rate, clamp the frame time, and interpolate render state between the last two steps.",
  },
  {
    id: "ex-004",
    title: "Prove your integrator is frame-rate independent",
    area: "Physics",
    difficulty: "working",
    languages: ["C++", "Rust"],
    estimateMinutes: 45,
    summary:
      "Run the same input at 30, 60 and 144 fps and assert the final position matches to within epsilon. Make it fail first.",
  },
  {
    id: "ex-005",
    title: "Write support functions for sphere, capsule and hull",
    area: "Physics",
    difficulty: "working",
    languages: ["Rust", "C++"],
    estimateMinutes: 60,
    summary:
      "One interface, three shapes. This is everything GJK needs to know about geometry.",
  },
  {
    id: "ex-006",
    title: "GJK in 2D before you attempt 3D",
    area: "Physics",
    difficulty: "deep",
    languages: ["TypeScript", "Rust"],
    estimateMinutes: 120,
    summary:
      "Triangles instead of tetrahedra, and you can draw every simplex. Port to 3D once the 2D version is right.",
  },
  {
    id: "ex-007",
    title: "Build a sparse set component store",
    area: "ECS",
    difficulty: "working",
    languages: ["C++", "Rust"],
    estimateMinutes: 70,
    summary:
      "Dense values, sparse index, O(1) insert and remove with a swap-and-pop. Keep the entity-to-index map correct through removal.",
  },
  {
    id: "ex-008",
    title: "Move an entity between archetypes",
    area: "ECS",
    difficulty: "deep",
    languages: ["C++", "C#"],
    estimateMinutes: 110,
    summary:
      "Adding a component means relocating the entity's whole row. Get the column copies and the back-reference fixups right.",
  },
  {
    id: "ex-009",
    title: "Query intersection across three component types",
    area: "ECS",
    difficulty: "working",
    languages: ["Rust", "C#"],
    estimateMinutes: 50,
    summary:
      "Iterate the smallest set first and probe the others. Measure against the naive order and explain the difference.",
  },
  {
    id: "ex-010",
    title: "Ray-march a sphere and a box with CSG",
    area: "Shaders",
    difficulty: "intro",
    languages: ["GLSL"],
    estimateMinutes: 40,
    summary:
      "Sphere trace an SDF and subtract the sphere from the box. No meshes, no vertex buffers.",
  },
  {
    id: "ex-011",
    title: "Derive SDF normals from the gradient",
    area: "Shaders",
    difficulty: "working",
    languages: ["GLSL", "WGSL"],
    estimateMinutes: 30,
    summary:
      "Central differences around the hit point. Compare the four-tap tetrahedron trick against the six-tap version.",
  },
  {
    id: "ex-012",
    title: "Soft shadows from a single extra march",
    area: "Shaders",
    difficulty: "deep",
    languages: ["GLSL"],
    estimateMinutes: 55,
    summary:
      "Track the minimum ratio of distance to travelled length toward the light and turn it into a penumbra.",
  },
  {
    id: "ex-013",
    title: "Implement a GGX specular term",
    area: "Shaders",
    difficulty: "deep",
    languages: ["GLSL", "WGSL"],
    estimateMinutes: 80,
    summary:
      "Distribution, geometry and Fresnel. Verify energy conservation by integrating over the hemisphere numerically.",
  },
  {
    id: "ex-014",
    title: "Ring-buffer the last two seconds of input",
    area: "Netcode",
    difficulty: "intro",
    languages: ["TypeScript", "C#"],
    estimateMinutes: 30,
    summary:
      "Fixed capacity, sequence-numbered, no allocation in the hot path. This is the buffer reconciliation replays from.",
  },
  {
    id: "ex-015",
    title: "Reconcile a mispredicted position without snapping",
    area: "Netcode",
    difficulty: "deep",
    languages: ["TypeScript", "C#"],
    estimateMinutes: 100,
    summary:
      "Replay unacknowledged inputs from the server state, then smooth the residual visual offset over a few frames.",
  },
  {
    id: "ex-016",
    title: "Interpolate remote entities between snapshots",
    area: "Netcode",
    difficulty: "working",
    languages: ["TypeScript", "C++"],
    estimateMinutes: 60,
    summary:
      "Render remote players 100 ms in the past and interpolate. Handle a missing snapshot without teleporting anyone.",
  },
  {
    id: "ex-017",
    title: "Simulate packet loss and jitter in your transport",
    area: "Netcode",
    difficulty: "working",
    languages: ["Rust", "C++"],
    estimateMinutes: 65,
    summary:
      "A test transport that drops, duplicates and reorders. Most netcode bugs only appear once you can reproduce a bad network.",
  },
  {
    id: "ex-018",
    title: "Debounce a filesystem watcher",
    area: "Tooling",
    difficulty: "intro",
    languages: ["Rust", "TypeScript"],
    estimateMinutes: 25,
    summary:
      "Coalesce the burst of events an atomic save produces into one rebuild per path.",
  },
  {
    id: "ex-019",
    title: "Handle-based asset table with deferred destruction",
    area: "Tooling",
    difficulty: "working",
    languages: ["C++", "Rust"],
    estimateMinutes: 75,
    summary:
      "Generational handles so a stale one is detected rather than dereferenced, and destruction deferred by frames in flight.",
  },
  {
    id: "ex-020",
    title: "Hot-reload a shader without dropping the frame",
    area: "Tooling",
    difficulty: "deep",
    languages: ["C++", "Rust"],
    estimateMinutes: 95,
    summary:
      "Compile off-thread, swap on success, keep the last good version on failure. Prove a syntax error cannot crash the session.",
  },
  {
    id: "ex-021",
    title: "Profile a frame and find the actual bottleneck",
    area: "Tooling",
    difficulty: "working",
    languages: ["C++"],
    estimateMinutes: 60,
    summary:
      "GPU timestamps around each pass, CPU spans around each system. Write down your guess first, then check it.",
  },
  {
    id: "ex-022",
    title: "Cascaded shadow maps with stable texels",
    area: "Rendering",
    difficulty: "deep",
    languages: ["C++", "GLSL"],
    estimateMinutes: 130,
    summary:
      "Split the frustum, fit each cascade, and snap the light matrix to texel boundaries so shadows stop shimmering as the camera moves.",
  },
]
