import type { Area, Difficulty } from "@/data/topics"

export type Lesson = {
  slug: string
  title: string
  brief: string
  /** Seeds the editor pane. */
  starter: string
  lang: string
  /** Human-readable assertions shown beside the editor. */
  checks: string[]
}

export type Module = { title: string; lessons: Lesson[] }

export type Course = {
  slug: string
  title: string
  area: Area
  summary: string
  level: Difficulty
  modules: Module[]
}

export const courses: Course[] = [
  {
    slug: "software-rasterizer",
    title: "Write a Software Rasterizer",
    area: "Rendering",
    summary:
      "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate. Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim.",
    level: "working",
    modules: [
      {
        title: "The framebuffer",
        lessons: [
          {
            slug: "clear-and-present",
            title: "Clear and present",
            brief:
              "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim.",
            lang: "c",
            starter: `void clear(Framebuffer* fb, uint32_t rgba) {
  // TODO: fill every pixel. Watch the stride — it is not always width.
}`,
            checks: [
              "Elit eiusmod ut dolore enim veniam exercitation.",
              "Minim nostrud laboris ex consequat irure voluptate cillum nulla.",
              "Aute reprehenderit esse fugiat excepteur cupidatat.",
            ],
          },
          {
            slug: "plot-a-line",
            title: "Plot a line",
            brief:
              "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing.",
            lang: "c",
            starter: `void line(Framebuffer* fb, int x0, int y0, int x1, int y1, uint32_t c) {
  // TODO: integer error accumulation, all eight octants.
}`,
            checks: [
              "Occaecat proident qui mollit est ipsum amet elit.",
              "Lorem sit adipiscing do incididunt.",
              "Labore magna ad quis ullamco aliquip commodo.",
            ],
          },
        ],
      },
      {
        title: "Triangles",
        lessons: [
          {
            slug: "edge-functions",
            title: "Edge functions and the inside test",
            brief:
              "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore.",
            lang: "c",
            starter: `static inline int edge(Vec2 a, Vec2 b, Vec2 p) {
  // TODO: cross product of (b - a) and (p - a).
  return 0;
}`,
            checks: [
              "Nisi ea duis in velit eu pariatur occaecat proident.",
              "Cillum nulla sint non culpa deserunt.",
              "Officia anim laborum dolor consectetur sed tempor labore.",
            ],
          },
          {
            slug: "barycentric-interpolation",
            title: "Barycentric interpolation",
            brief:
              "Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum amet. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco.",
            lang: "c",
            starter: `Vec3 barycentric(Vec2 a, Vec2 b, Vec2 c, Vec2 p) {
  // TODO: normalise the three edge functions by the total area.
}`,
            checks: [
              "Elit eiusmod ut dolore enim.",
              "Minim nostrud laboris ex consequat irure voluptate.",
              "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim.",
            ],
          },
          {
            slug: "depth-buffer",
            title: "The depth buffer",
            brief:
              "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor labore. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure.",
            lang: "c",
            starter: `bool depth_test(Framebuffer* fb, int x, int y, float inv_w) {
  // TODO: compare, and write only on pass.
  return true;
}`,
            checks: [
              "Occaecat proident qui mollit est ipsum.",
              "Lorem sit adipiscing do incididunt et aliqua minim.",
              "Labore magna ad quis ullamco.",
            ],
          },
        ],
      },
      {
        title: "Perspective",
        lessons: [
          {
            slug: "clip-space",
            title: "Into clip space",
            brief:
              "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim nostrud. Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur.",
            lang: "c",
            starter: `Vec4 to_clip(Mat4 mvp, Vec3 position) {
  // TODO: one matrix multiply. The divide comes later, on purpose.
}`,
            checks: [
              "Nisi ea duis in velit eu pariatur.",
              "Cillum nulla sint non culpa deserunt id lorem sit.",
              "Officia anim laborum dolor consectetur sed.",
            ],
          },
          {
            slug: "near-plane-clipping",
            title: "Near-plane clipping",
            brief:
              "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea duis. Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia.",
            lang: "c",
            starter: `int clip_near(Vertex in[3], Vertex out[4]) {
  // TODO: Sutherland-Hodgman against w > epsilon. Returns vertex count.
  return 0;
}`,
            checks: [
              "Elit eiusmod ut dolore enim veniam exercitation nisi.",
              "Minim nostrud laboris ex consequat.",
              "Aute reprehenderit esse fugiat excepteur cupidatat sunt.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "ecs-from-scratch",
    title: "Build an ECS From Scratch",
    area: "ECS",
    summary:
      "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat. Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip.",
    level: "deep",
    modules: [
      {
        title: "Identity",
        lessons: [
          {
            slug: "generational-ids",
            title: "Generational entity IDs",
            brief:
              "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat. Lorem sit adipiscing do incididunt et aliqua minim nostrud.",
            lang: "rust",
            starter: `pub struct Entity { index: u32, generation: u32 }

impl World {
    pub fn spawn(&mut self) -> Entity {
        // TODO: reuse a free index, bump its generation.
        todo!()
    }
}`,
            checks: [
              "Occaecat proident qui mollit est ipsum amet elit eiusmod.",
              "Lorem sit adipiscing do incididunt et.",
              "Labore magna ad quis ullamco aliquip commodo aute.",
            ],
          },
        ],
      },
      {
        title: "Storage",
        lessons: [
          {
            slug: "dense-columns",
            title: "Dense component columns",
            brief:
              "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis.",
            lang: "rust",
            starter: `pub fn remove(&mut self, entity: Entity) {
    // TODO: swap_remove, then repair the moved entity's index.
}`,
            checks: [
              "Nisi ea duis in velit.",
              "Cillum nulla sint non culpa deserunt id.",
              "Officia anim laborum dolor consectetur sed tempor labore magna.",
            ],
          },
          {
            slug: "component-registry",
            title: "Type-erased component registry",
            brief:
              "Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum. Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat.",
            lang: "rust",
            starter: `pub trait ComponentStorage {
    fn remove(&mut self, entity: Entity);
    // TODO: what else does the world need without knowing the type?
}`,
            checks: [
              "Elit eiusmod ut dolore enim veniam.",
              "Minim nostrud laboris ex consequat irure voluptate cillum.",
            ],
          },
        ],
      },
      {
        title: "Queries and systems",
        lessons: [
          {
            slug: "query-iteration",
            title: "Iterating a multi-component query",
            brief:
              "Labore magna ad quis ullamco aliquip commodo aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor. Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa.",
            lang: "rust",
            starter: `pub fn query2<A: Component, B: Component>(&self) -> impl Iterator<Item = (Entity, &A, &B)> {
    // TODO: drive from the smaller storage.
    std::iter::empty()
}`,
            checks: [
              "Aute reprehenderit esse fugiat excepteur.",
              "Occaecat proident qui mollit est ipsum amet.",
              "Lorem sit adipiscing do incididunt et aliqua minim nostrud.",
            ],
          },
          {
            slug: "command-buffer",
            title: "Deferred structural change",
            brief:
              "Minim nostrud laboris ex consequat irure voluptate cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim. Nisi ea duis in velit eu pariatur occaecat proident qui mollit est ipsum.",
            lang: "rust",
            starter: `pub struct Commands { /* TODO */ }

impl Commands {
    pub fn despawn(&mut self, entity: Entity) { /* TODO: record */ }
    pub fn apply(self, world: &mut World) { /* TODO: replay in order */ }
}`,
            checks: [
              "Labore magna ad quis ullamco aliquip.",
              "Nisi ea duis in velit eu pariatur occaecat.",
              "Cillum nulla sint non culpa.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "shading-models",
    title: "Shading Models, Lambert to GGX",
    area: "Shaders",
    summary:
      "Officia anim laborum dolor consectetur sed tempor labore magna. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate.",
    level: "deep",
    modules: [
      {
        title: "Diffuse",
        lessons: [
          {
            slug: "lambert",
            title: "Lambert, and why it divides by pi",
            brief:
              "Nisi ea duis in velit eu pariatur occaecat proident. Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum dolor consectetur sed tempor.",
            lang: "glsl",
            starter: `vec3 lambert(vec3 albedo) {
  // TODO: one division, and be able to explain it.
  return albedo;
}`,
            checks: [
              "Officia anim laborum dolor consectetur sed tempor.",
              "Elit eiusmod ut dolore enim veniam exercitation nisi ea.",
            ],
          },
        ],
      },
      {
        title: "Specular",
        lessons: [
          {
            slug: "ggx-distribution",
            title: "The GGX normal distribution",
            brief:
              "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia anim laborum. Cillum nulla sint non culpa deserunt id lorem sit adipiscing do incididunt et aliqua minim.",
            lang: "glsl",
            starter: `float D_GGX(float NoH, float roughness) {
  // TODO: alpha = roughness squared. Watch precision at low roughness.
  return 0.0;
}`,
            checks: [
              "Minim nostrud laboris ex consequat irure.",
              "Aute reprehenderit esse fugiat excepteur cupidatat sunt officia.",
              "Occaecat proident qui mollit est.",
            ],
          },
          {
            slug: "smith-geometry",
            title: "Smith geometry and Fresnel",
            brief:
              "Cillum nulla sint non culpa deserunt id lorem sit adipiscing do. Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim veniam exercitation nisi ea.",
            lang: "glsl",
            starter: `float V_SmithGGX(float NoV, float NoL, float roughness) {
  // TODO: the height-correlated visibility form folds in the denominator.
  return 0.0;
}`,
            checks: [
              "Lorem sit adipiscing do incididunt et aliqua.",
              "Labore magna ad quis ullamco aliquip commodo aute reprehenderit.",
              "Nisi ea duis in velit eu.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "rollback-netcode",
    title: "Rollback Netcode for Fighting Games",
    area: "Netcode",
    summary:
      "Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris. Elit eiusmod ut dolore enim veniam exercitation nisi ea duis in velit eu pariatur occaecat.",
    level: "deep",
    modules: [
      {
        title: "Rollback",
        lessons: [
          {
            slug: "state-snapshots",
            title: "Snapshot and restore game state",
            brief:
              "Occaecat proident qui mollit est ipsum amet elit eiusmod ut dolore enim. Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip commodo aute reprehenderit esse.",
            lang: "cpp",
            starter: `void SaveState(GameState* out);
void LoadState(const GameState* in);
// TODO: prove round-tripping is lossless before going further.`,
            checks: [
              "Cillum nulla sint non culpa deserunt id lorem.",
              "Officia anim laborum dolor consectetur.",
              "Elit eiusmod ut dolore enim veniam exercitation.",
            ],
          },
          {
            slug: "predict-and-rollback",
            title: "Predict, detect, re-simulate",
            brief:
              "Officia anim laborum dolor consectetur sed tempor labore magna ad quis ullamco aliquip. Lorem sit adipiscing do incididunt et aliqua minim nostrud laboris ex consequat irure voluptate cillum nulla sint non.",
            lang: "cpp",
            starter: `void OnRemoteInput(Frame frame, Input input) {
  // TODO: if it differs from what was predicted, roll back and re-simulate.
}`,
            checks: [
              "Minim nostrud laboris ex consequat irure voluptate cillum nulla.",
              "Aute reprehenderit esse fugiat excepteur cupidatat.",
              "Occaecat proident qui mollit est ipsum amet elit.",
            ],
          },
        ],
      },
    ],
  },
]

export function courseBySlug(slug: string) {
  return courses.find((course) => course.slug === slug)
}

export function lessonCount(course: Course) {
  return course.modules.reduce((total, mod) => total + mod.lessons.length, 0)
}

export function allLessons(course: Course) {
  return course.modules.flatMap((mod) =>
    mod.lessons.map((lesson) => ({ ...lesson, module: mod.title }))
  )
}
