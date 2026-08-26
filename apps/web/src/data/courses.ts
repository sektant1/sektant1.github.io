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
      "Put triangles on screen with nothing but a pixel buffer. Every abstraction a GPU gives you, built by hand once.",
    level: "working",
    modules: [
      {
        title: "The framebuffer",
        lessons: [
          {
            slug: "clear-and-present",
            title: "Clear and present",
            brief:
              "Allocate a pixel buffer, fill it with a known colour, and get it on screen. Everything later depends on this loop being correct.",
            lang: "c",
            starter: `void clear(Framebuffer* fb, uint32_t rgba) {
  // TODO: fill every pixel. Watch the stride — it is not always width.
}`,
            checks: [
              "Every pixel equals the clear colour",
              "Works when stride exceeds width",
              "No write past the last row",
            ],
          },
          {
            slug: "plot-a-line",
            title: "Plot a line",
            brief:
              "Bresenham, in integers. It is the first place an off-by-one becomes visible rather than theoretical.",
            lang: "c",
            starter: `void line(Framebuffer* fb, int x0, int y0, int x1, int y1, uint32_t c) {
  // TODO: integer error accumulation, all eight octants.
}`,
            checks: [
              "All eight octants render",
              "Endpoints are both inclusive",
              "A steep line has no gaps",
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
              "The signed area of the triangle formed by an edge and the point tells you which side you are on. Three of those give you a fill rule.",
            lang: "c",
            starter: `static inline int edge(Vec2 a, Vec2 b, Vec2 p) {
  // TODO: cross product of (b - a) and (p - a).
  return 0;
}`,
            checks: [
              "Points inside give the same sign for all three edges",
              "Winding order is handled consistently",
              "Shared edges do not double-shade",
            ],
          },
          {
            slug: "barycentric-interpolation",
            title: "Barycentric interpolation",
            brief:
              "The edge functions you already computed are the barycentric weights, up to a scale. Reuse them to interpolate colour and depth.",
            lang: "c",
            starter: `Vec3 barycentric(Vec2 a, Vec2 b, Vec2 c, Vec2 p) {
  // TODO: normalise the three edge functions by the total area.
}`,
            checks: [
              "Weights sum to one",
              "Vertex colours interpolate smoothly",
              "Degenerate triangles are rejected, not divided by zero",
            ],
          },
          {
            slug: "depth-buffer",
            title: "The depth buffer",
            brief:
              "Interpolate 1/w rather than z, and test before you shade. This is where painter's-algorithm intuitions break.",
            lang: "c",
            starter: `bool depth_test(Framebuffer* fb, int x, int y, float inv_w) {
  // TODO: compare, and write only on pass.
  return true;
}`,
            checks: [
              "Nearer fragments win regardless of draw order",
              "Interpolation is perspective-correct",
              "Clearing resets to the far plane",
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
              "Model, view and projection, then the perspective divide. Getting the order wrong produces plausible-looking nonsense.",
            lang: "c",
            starter: `Vec4 to_clip(Mat4 mvp, Vec3 position) {
  // TODO: one matrix multiply. The divide comes later, on purpose.
}`,
            checks: [
              "Points behind the eye have negative w",
              "The divide happens after clipping, not before",
              "The viewport transform maps NDC to pixels",
            ],
          },
          {
            slug: "near-plane-clipping",
            title: "Near-plane clipping",
            brief:
              "Triangles crossing the near plane must be split before the divide, or you get geometry smeared across the screen.",
            lang: "c",
            starter: `int clip_near(Vertex in[3], Vertex out[4]) {
  // TODO: Sutherland-Hodgman against w > epsilon. Returns vertex count.
  return 0;
}`,
            checks: [
              "A triangle fully behind the plane is culled",
              "One vertex behind produces two triangles",
              "Attributes are interpolated at the clip point",
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
      "Entity IDs, component storage, queries and systems — small enough to hold in your head, real enough to ship.",
    level: "deep",
    modules: [
      {
        title: "Identity",
        lessons: [
          {
            slug: "generational-ids",
            title: "Generational entity IDs",
            brief:
              "An index plus a generation counter. Recycling an index bumps the generation, so a stale handle is detectable instead of silently valid.",
            lang: "rust",
            starter: `pub struct Entity { index: u32, generation: u32 }

impl World {
    pub fn spawn(&mut self) -> Entity {
        // TODO: reuse a free index, bump its generation.
        todo!()
    }
}`,
            checks: [
              "A despawned handle fails validation",
              "Indices are reused after despawn",
              "Generation overflow is handled deliberately",
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
              "Components live in contiguous arrays. Removal swaps with the last element and pops, which keeps the array dense but reorders it.",
            lang: "rust",
            starter: `pub fn remove(&mut self, entity: Entity) {
    // TODO: swap_remove, then repair the moved entity's index.
}`,
            checks: [
              "The dense array has no holes after removal",
              "The moved entity's sparse entry is repaired",
              "Removing the last element is not a special case bug",
            ],
          },
          {
            slug: "component-registry",
            title: "Type-erased component registry",
            brief:
              "One storage per component type, keyed by type ID, each knowing how to drop its own values.",
            lang: "rust",
            starter: `pub trait ComponentStorage {
    fn remove(&mut self, entity: Entity);
    // TODO: what else does the world need without knowing the type?
}`,
            checks: [
              "Adding a new component type needs no changes to the world",
              "Dropping the world drops every component exactly once",
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
              "Pick the smallest storage to drive iteration and probe the rest. The order of that choice is most of the performance.",
            lang: "rust",
            starter: `pub fn query2<A: Component, B: Component>(&self) -> impl Iterator<Item = (Entity, &A, &B)> {
    // TODO: drive from the smaller storage.
    std::iter::empty()
}`,
            checks: [
              "Only entities with both components are yielded",
              "Iteration drives from the smaller set",
              "Borrowing two components at once satisfies the borrow checker",
            ],
          },
          {
            slug: "command-buffer",
            title: "Deferred structural change",
            brief:
              "Spawning or despawning mid-iteration invalidates what you are iterating. Record the intent and apply it at a safe point.",
            lang: "rust",
            starter: `pub struct Commands { /* TODO */ }

impl Commands {
    pub fn despawn(&mut self, entity: Entity) { /* TODO: record */ }
    pub fn apply(self, world: &mut World) { /* TODO: replay in order */ }
}`,
            checks: [
              "Despawning during iteration does not invalidate the iterator",
              "Commands apply in the order they were recorded",
              "Despawning the same entity twice is not an error",
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
      "Work up from a cosine term to a microfacet BRDF, checking energy conservation at every step.",
    level: "deep",
    modules: [
      {
        title: "Diffuse",
        lessons: [
          {
            slug: "lambert",
            title: "Lambert, and why it divides by pi",
            brief:
              "The division is not a fudge factor. It is what makes the BRDF integrate to one over the hemisphere.",
            lang: "glsl",
            starter: `vec3 lambert(vec3 albedo) {
  // TODO: one division, and be able to explain it.
  return albedo;
}`,
            checks: [
              "Integrating over the hemisphere yields albedo, not more",
              "Surfaces facing away contribute zero, not negative",
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
              "How many microfacets point at the half vector. The long tail is why GGX highlights look right and Blinn-Phong ones do not.",
            lang: "glsl",
            starter: `float D_GGX(float NoH, float roughness) {
  // TODO: alpha = roughness squared. Watch precision at low roughness.
  return 0.0;
}`,
            checks: [
              "Peaks when the half vector matches the normal",
              "Low roughness does not produce NaN or infinity",
              "Normalised so the integral stays bounded",
            ],
          },
          {
            slug: "smith-geometry",
            title: "Smith geometry and Fresnel",
            brief:
              "Shadowing-masking between microfacets, and the fact that everything becomes a mirror at grazing angles.",
            lang: "glsl",
            starter: `float V_SmithGGX(float NoV, float NoL, float roughness) {
  // TODO: the height-correlated visibility form folds in the denominator.
  return 0.0;
}`,
            checks: [
              "Grazing angles darken rather than blow out",
              "The Fresnel term approaches one at ninety degrees",
              "Combined BRDF never exceeds incoming energy",
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
      "One module, one hard idea: simulate ahead on predicted input, roll back and re-simulate when the truth arrives.",
    level: "deep",
    modules: [
      {
        title: "Rollback",
        lessons: [
          {
            slug: "state-snapshots",
            title: "Snapshot and restore game state",
            brief:
              "Rollback is only possible if the entire simulation state can be saved and restored exactly. Any hidden state breaks it.",
            lang: "cpp",
            starter: `void SaveState(GameState* out);
void LoadState(const GameState* in);
// TODO: prove round-tripping is lossless before going further.`,
            checks: [
              "Save then load leaves the simulation bit-identical",
              "No RNG state escapes the snapshot",
              "Snapshot cost fits inside a frame budget",
            ],
          },
          {
            slug: "predict-and-rollback",
            title: "Predict, detect, re-simulate",
            brief:
              "Assume the remote player repeats their last input. When the real input disagrees, restore and re-run the frames between.",
            lang: "cpp",
            starter: `void OnRemoteInput(Frame frame, Input input) {
  // TODO: if it differs from what was predicted, roll back and re-simulate.
}`,
            checks: [
              "A correct prediction costs nothing",
              "A wrong prediction re-simulates only the affected frames",
              "Rollback depth is capped and the cap is handled",
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
